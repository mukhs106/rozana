import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import {
  DRAFT_SCHEMA,
  ENRICH_SCHEMA,
  alreadyInLibrary,
  baseIngredientFrom,
  draftPrompt,
  enrichPrompt,
  needsReview,
  normalizeIngredient,
  normalizeNutrition,
} from "@/lib/enrich-schema";

/** The library tools are the owner's: every call checks the role, not just the page. */
function assertOwner(context) {
  if (context?.user?.role !== "admin") throw Object.assign(new Error("Owner only"), { status: 403 });
}

/** A model call that fails for credits or rate limits has to stop the run, not retry it. */
function isOutOfCredits(error) {
  const status = error?.status ?? error?.response?.status;
  const text = String(error?.message || error || "");
  return status === 402 || status === 429 || /credit|quota|rate.?limit|insufficient/i.test(text);
}

export const getEnrichState = createServerFn({ method: "GET" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    assertOwner(context);
    const api = context.getBase44().asServiceRole;
    const rows = await api.entities.Recipe.filter({});
    return {
      pending: rows.filter((row) => !row.enriched_at).map((row) => ({ id: row.id, title: row.title })),
      enriched: rows.filter((row) => Boolean(row.enriched_at)).length,
      flagged: rows.filter((row) => row.needs_review && row.status !== "draft").length,
      drafts: rows.filter((row) => row.status === "draft").map((row) => row.title),
      titles: rows.map((row) => String(row.title || "")),
    };
  });

export const enrichRecipe = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ id: z.string().min(1).max(80) }))
  .handler(async ({ data, context }) => {
    assertOwner(context);
    const api = context.getBase44().asServiceRole;

    let recipe;
    try {
      recipe = await api.entities.Recipe.get(data.id);
    } catch {
      return { ok: false, error: "That recipe is no longer there." };
    }
    if (recipe.enriched_at) return { ok: true, skipped: true, title: recipe.title };

    const lines = (recipe.base_ingredients || [])
      .map((item) => `${item.qty || ""} ${item.unit || ""} ${item.name || ""}`.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 60);
    if (!lines.length) return { ok: false, title: recipe.title, error: "This recipe has no ingredients to read." };

    let result;
    try {
      result = await api.integrations.Core.InvokeLLM({
        prompt: enrichPrompt({
          title: recipe.title,
          servings: recipe.base_servings,
          lines,
          method: (recipe.base_instructions || []).join("\n"),
        }),
        response_json_schema: ENRICH_SCHEMA,
      });
    } catch (error) {
      return isOutOfCredits(error)
        ? { ok: false, outOfCredits: true, title: recipe.title, error: "AI credits ran out." }
        : { ok: false, title: recipe.title, error: "The model could not read this recipe." };
    }

    const ingredients = (Array.isArray(result?.ingredients) ? result.ingredients : [])
      .map(normalizeIngredient)
      .filter((item) => item.name);
    if (!ingredients.length) return { ok: false, title: recipe.title, error: "Nothing usable came back." };

    const review = needsReview(ingredients);
    // Only the new fields are written; the recipe as authored stays as it is.
    await api.entities.Recipe.update(data.id, {
      ingredients_structured: ingredients,
      nutrition_per_serving: normalizeNutrition(result?.nutrition),
      enriched_at: new Date().toISOString(),
      needs_review: review,
    });

    return { ok: true, title: recipe.title, needs_review: review, count: ingredients.length };
  });

export const createDraftRecipe = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(z.object({ name: z.string().min(2).max(80) }))
  .handler(async ({ data, context }) => {
    assertOwner(context);
    const api = context.getBase44().asServiceRole;

    const existing = await api.entities.Recipe.filter({});
    if (alreadyInLibrary(data.name, existing.map((row) => row.title))) {
      return { ok: true, skipped: true, title: data.name };
    }

    let result;
    try {
      result = await api.integrations.Core.InvokeLLM({
        prompt: draftPrompt(data.name),
        response_json_schema: DRAFT_SCHEMA,
      });
    } catch (error) {
      return isOutOfCredits(error)
        ? { ok: false, outOfCredits: true, title: data.name, error: "AI credits ran out." }
        : { ok: false, title: data.name, error: "The model could not write this one." };
    }

    const ingredients = (Array.isArray(result?.ingredients) ? result.ingredients : [])
      .map(normalizeIngredient)
      .filter((item) => item.name);
    if (!ingredients.length) return { ok: false, title: data.name, error: "Nothing usable came back." };

    const instructions = (Array.isArray(result?.instructions) ? result.instructions : [])
      .map((step) => String(step || "").trim())
      .filter(Boolean)
      .slice(0, 20);

    const created = await context.getBase44().entities.Recipe.create({
      title: String(result?.title || data.name).trim(),
      subtitle: String(result?.subtitle || "").trim(),
      description: String(result?.description || "").trim(),
      base_servings: Number(result?.servings) || 4,
      cook_minutes: Number(result?.cook_minutes) || 0,
      heat_level: Number(result?.heat_level) || 0,
      base_ingredients: ingredients.map(baseIngredientFrom),
      base_instructions: instructions,
      ingredients_structured: ingredients,
      nutrition_per_serving: normalizeNutrition(result?.nutrition),
      adapts_note: String(result?.adapts_for || "").trim(),
      enriched_at: new Date().toISOString(),
      needs_review: true,
      status: "draft",
      is_seeded: false,
    });

    return { ok: true, title: created.title, id: created.id };
  });

export const exportAllData = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .handler(async ({ context }) => {
    assertOwner(context);
    const api = context.getBase44().asServiceRole;

    const [recipes, meals, groceries, households, versions, settings, users] = await Promise.all([
      api.entities.Recipe.filter({}),
      api.entities.PlannedMeal.filter({}),
      api.entities.GroceryItem.filter({}),
      api.entities.Household.filter({}),
      api.entities.SavedVersion.filter({}),
      api.entities.AppSetting.filter({}),
      api.entities.User.list(),
    ]);

    const profiles = (Array.isArray(users) ? users : []).map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      created_date: user.created_date,
      updated_date: user.updated_date,
    }));

    const data = {
      Recipe: recipes,
      PlannedMeal: meals,
      GroceryItem: groceries,
      Household: households,
      SavedVersion: versions,
      AppSetting: settings,
      User: profiles,
    };

    return {
      exported_at: new Date().toISOString(),
      data,
      counts: Object.fromEntries(Object.entries(data).map(([name, rows]) => [name, rows.length])),
    };
  });