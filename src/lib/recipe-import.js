import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireUser } from "@/lib/auth-middleware";
import { IMPORT_SCHEMA, INGREDIENT_LIST_SCHEMA, baseIngredientFrom, ingredientPrompt } from "@/lib/enrich-schema";

const Input = z.object({ url: z.string().trim().min(8).max(2000) });

/** The page publishes amounts as text ("½ cup", "1 to 2 tsp"): the model reads qty, unit and allergens from them. */
async function structureLines(context, lines) {
  const result = await context.getBase44().asServiceRole.integrations.Core.InvokeLLM({
    prompt: ingredientPrompt(lines),
    response_json_schema: INGREDIENT_LIST_SCHEMA,
  });
  return (Array.isArray(result?.ingredients) ? result.ingredients : []).map(baseIngredientFrom).filter((item) => item.name);
}

const stripTags = (value) =>
  String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

function metaContent(html, name) {
  const pattern = new RegExp(`<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`, "i");
  const match = html.match(pattern);
  return match ? match[1] : null;
}

/** Most recipe sites publish schema.org Recipe, which is exact where a model is guesswork. */
function structuredRecipe(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const found = [];
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    const type = node["@type"];
    const types = Array.isArray(type) ? type : [type];
    if (types.some((item) => String(item).toLowerCase() === "recipe")) found.push(node);
    if (node["@graph"]) walk(node["@graph"]);
  };
  blocks.forEach((block) => {
    try {
      walk(JSON.parse(block[1]));
    } catch {
      /* a malformed block just means this page falls back to reading the text */
    }
  });
  return found[0] || null;
}

function isoMinutes(value) {
  const match = String(value || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!match) return 0;
  return (Number(match[1]) || 0) * 60 + (Number(match[2]) || 0);
}

function firstNumber(value) {
  const match = String(Array.isArray(value) ? value[0] : value || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function firstImage(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return firstImage(value[0]);
  if (typeof value === "object") return String(value.url || "");
  return "";
}

function instructionSteps(value) {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .flatMap((item) => {
      if (typeof item === "string") return [stripTags(item)];
      if (item && typeof item === "object") {
        if (item.itemListElement) return instructionSteps(item.itemListElement);
        return [stripTags(item.text || item.name)];
      }
      return [];
    })
    .filter(Boolean)
    .slice(0, 30);
}

/** A window of the page around the ingredients, for pages with no structured data. */
function readableExcerpt(pageText) {
  const lower = pageText.toLowerCase();
  const at = ["ingredients", "method", "instructions", "directions"].map((word) => lower.indexOf(word)).filter((index) => index > 500);
  const start = at.length ? Math.max(0, Math.min(...at) - 1200) : 0;
  return pageText.slice(start, start + 16000);
}

/**
 * Reads what a recipe page publishes about itself, then the page text. Whatever
 * it cannot read is left for the cook to fill in, and the source URL is kept.
 */
export const importRecipeFromUrl = createServerFn({ method: "POST" })
  .middleware([requireUser])
  .validator(Input)
  .handler(async ({ data, context }) => {
    let url;
    try {
      url = new URL(data.url.match(/^https?:\/\//i) ? data.url : `https://${data.url}`);
    } catch {
      return { ok: false, error: "That does not look like a link. Check the address, or fill the recipe in by hand." };
    }

    let response;
    try {
      response = await fetch(url.toString(), {
        headers: { accept: "text/html", "user-agent": "RozanaRecipeReader/1.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(9000),
      });
    } catch {
      return { ok: false, error: "That link could not be opened just now. Fill the recipe in by hand and the link is kept." };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: `That page answered ${response.status}, so nothing could be read. Fill the recipe in by hand and the link is kept.`,
      };
    }

    const html = (await response.text()).slice(0, 400000);
    const siteName = metaContent(html, "og:site_name") || url.hostname.replace(/^www\./, "");
    const ogImage = metaContent(html, "og:image") || "";
    const base = { source_url: url.toString(), source_name: siteName, image_url: ogImage };

    // 1. The page's own recipe data.
    const ld = structuredRecipe(html);
    if (ld) {
      const rawIngredients = ld.recipeIngredient || ld.ingredients || [];
      const lines = (Array.isArray(rawIngredients) ? rawIngredients : [])
        .map((line) => (typeof line === "string" ? stripTags(line).replace(/^[-•]\s*/, "") : stripTags(line?.name)))
        .filter(Boolean)
        .slice(0, 60);
      let ingredients = [];
      if (lines.length) {
        try {
          ingredients = await structureLines(context, lines);
        } catch {
          // No amounts rather than wrong ones: the cook fills them in.
          ingredients = lines.map((line) => ({ name: line, qty: 0, unit: "" }));
        }
      }
      const instructions = instructionSteps(ld.recipeInstructions);
      if (ingredients.length) {
        return {
          ok: true,
          ...base,
          image_url: firstImage(ld.image) || ogImage,
          recipe: {
            title: stripTags(ld.name) || stripTags(metaContent(html, "og:title")),
            description: stripTags(ld.description).slice(0, 400),
            base_servings: firstNumber(ld.recipeYield),
            cook_minutes: isoMinutes(ld.totalTime) || isoMinutes(ld.cookTime),
            image_url: firstImage(ld.image) || ogImage,
            ingredients,
            instructions,
          },
        };
      }
    }

    // 2. No usable structured data: read the page text.
    const pageText = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const excerpt = readableExcerpt(pageText);

    if (excerpt.length < 200) {
      return { ok: false, ...base, error: "That page did not show a readable recipe. Fill it in by hand and the link is kept." };
    }

    let extracted;
    try {
      extracted = await context.getBase44().asServiceRole.integrations.Core.InvokeLLM({
        prompt: [
          "You are reading a cooking web page for a meal-planning app.",
          "Extract only what the page states. Do not invent amounts or steps.",
          "servings is the yield the recipe states, as a number.",
          "cook_minutes is total time in minutes if stated, otherwise 0.",
          "instructions: one short sentence per step, in the page's order.",
          "For each ingredient give name, qty as one number (1/2 -> 0.5, a range uses the upper value), unit as one of g, kg, ml, l, tsp, tbsp, cup, piece, pinch, clove, bunch or empty, a short prep note, and any allergens from gluten, dairy, egg, tree_nuts, peanut, soy, sesame, mustard, fish, shellfish, celery.",
          "An empty allergen list means you do not know, never that the ingredient is free of them. diet flags and confidence as the schema asks.",
          "If the page holds no recipe at all, return an empty title, empty ingredients and empty instructions.",
          "",
          `Page title: ${metaContent(html, "og:title") || ""}`,
          `Page text: ${excerpt}`,
        ].join("\n"),
        response_json_schema: IMPORT_SCHEMA,
      });
    } catch {
      return { ok: false, ...base, error: "That page could not be read as a recipe. Fill it in by hand and the link is kept." };
    }

    const ingredients = Array.isArray(extracted?.ingredients)
      ? extracted.ingredients
          .filter((item) => item && String(item.name || "").trim())
          .slice(0, 60)
          .map(baseIngredientFrom)
      : [];
    const instructions = Array.isArray(extracted?.instructions)
      ? extracted.instructions.filter((step) => String(step || "").trim()).slice(0, 30).map((step) => String(step).trim())
      : [];

    if (!ingredients.length) {
      return { ok: false, ...base, error: "No recipe was found on that page. Fill it in by hand and the link is kept." };
    }

    return {
      ok: true,
      ...base,
      recipe: {
        title: String(extracted?.title || "").trim(),
        description: String(extracted?.description || "").trim(),
        base_servings: Number(extracted?.servings) || 0,
        cook_minutes: Number(extracted?.cook_minutes) || 0,
        image_url: String(extracted?.image_url || ogImage),
        ingredients,
        instructions,
      },
    };
  });