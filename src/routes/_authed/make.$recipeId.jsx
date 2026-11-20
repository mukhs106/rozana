import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/api/db";
import Pill from "@/components/Pill";
import VersionTiles from "@/components/recipe/VersionTiles";
import IngredientTable from "@/components/recipe/IngredientTable";
import NutritionRow from "@/components/recipe/NutritionRow";
import DinerPicker from "@/components/make/DinerPicker";
import MealPlanRow from "@/components/make/MealPlanRow";
import PortionSheet from "@/components/make/PortionSheet";
import SwapSheet from "@/components/make/SwapSheet";
import ConflictRows from "@/components/make/ConflictRows";
import ExtraIngredients from "@/components/make/ExtraIngredients";
import ReviewSheet from "@/components/make/ReviewSheet";
import { firstNameOf, membersOf, useHousehold, useRecipes, useSavedVersions } from "@/hooks/useKitchen";
import {
  dinersLine,
  formatServings,
  mealPortions,
  portionsByType,
  typeBreakdown,
  withDiners,
} from "@/lib/allocations";
import {
  availableSwaps,
  batchNutrition,
  findConflicts,
  formatAmount,
  getVersion,
  resolveBatch,
  resolveIngredients,
  versionIngredients,
} from "@/lib/mealMath";
import { perServing as servingFacts } from "@/lib/foodInfo";
import VersionSuggestion from "@/components/make/VersionSuggestion";
import { librarySwapsFor } from "@/lib/swapLibrary";
import { followingSlot, mealLabel, nextSlot, slotLabel } from "@/lib/slots";

export const Route = createFileRoute("/_authed/make/$recipeId")({
  ssr: false,
  validateSearch: (search) => ({
    version: typeof search.version === "string" ? search.version : undefined,
    from: typeof search.from === "string" ? search.from : undefined,
    // Comma-separated diner ids, from "Cook for this table" on Today.
    diners: typeof search.diners === "string" ? search.diners : undefined,
    // Comma-separated swap keys already chosen on the recipe page.
    swaps: typeof search.swaps === "string" ? search.swaps : undefined,
  }),
  component: MakePage,
});

function MakePage() {
  const { recipeId } = Route.useParams();
  const { version, from, diners: dinerParam, swaps: swapParam } = Route.useSearch();
  const { user } = Route.useRouteContext();
  const { data: recipes = [], isLoading } = useRecipes();
  const { data: household } = useHousehold();
  const { data: saved = [] } = useSavedVersions();

  const recipe = recipes.find((item) => item.id === recipeId);
  const prefill = saved.find((item) => item.id === from) || null;

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!recipe) {
    return (
      <div className="mx-auto max-w-[460px] px-5 pt-16">
        <p className="eyebrow">Batch</p>
        <h1 className="mt-2 text-title font-semibold">That recipe is not here.</h1>
      </div>
    );
  }

  return (
    <BatchEditor
      key={`${recipe.id}-${prefill?.id || "new"}`}
      recipe={recipe}
      household={household}
      user={user}
      prefill={prefill}
      initialVersion={version}
      initialDinerIds={dinerParam ? dinerParam.split(",").filter(Boolean) : []}
      initialSwapKeys={swapParam ? swapParam.split(",").filter(Boolean) : []}
    />
  );
}

function BatchEditor({ recipe, household, user, prefill, initialVersion, initialDinerIds = [], initialSwapKeys = [] }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const members = membersOf(household, user);
  const self = members.find((member) => member.is_self) || members[0];
  const versions = recipe.variations || [];

  const prefilledIds = prefill?.diner_names?.length
    ? members.filter((member) => prefill.diner_names.includes(member.name)).map((member) => member.id)
    : [];
  const fromTable = members.filter((member) => initialDinerIds.includes(member.id)).map((member) => member.id);
  const startDinerIds = fromTable.length ? fromTable : prefilledIds.length ? prefilledIds : self ? [self.id] : [];
  // Each person starts at their usual portion size.
  const usualPortion = (id) => Number(members.find((member) => member.id === id)?.portion) || 1;

  const [versionKey, setVersionKey] = useState(
    initialVersion || prefill?.version_key || versions[0]?.key || "base",
  );
  const [dinerIds, setDinerIds] = useState(startDinerIds);
  const [meals, setMeals] = useState(() => {
    const first = nextSlot();
    return [first, followingSlot(first)].map((slot, index) => ({
      key: `meal-${index}`,
      date: slot.date,
      type: slot.type,
      portions: Object.fromEntries(startDinerIds.map((id) => [id, usualPortion(id)])),
    }));
  });
  const [swapScopes, setSwapScopes] = useState(() => {
    return Object.fromEntries([...(prefill?.swap_keys || []), ...initialSwapKeys].map((key) => [key, "all"]));
  });
  const [flash, setFlash] = useState({ names: [], meal: null });
  const [sheetOptions, setSheetOptions] = useState([]);
  const [sheetKey, setSheetKey] = useState(null);
  const [sheetScope, setSheetScope] = useState("all");
  const [extras, setExtras] = useState([]);
  const [portionMealKey, setPortionMealKey] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const sheet = sheetOptions.find((option) => option.key === sheetKey) || null;
  const version = getVersion(recipe, versionKey);
  const recipeSwaps = recipe.swaps || [];
  const librarySwaps = librarySwapsFor(versionIngredients(recipe, versionKey)).filter(
    (librarySwap) =>
      !recipeSwaps.some(
        (swap) =>
          swap.key === librarySwap.key ||
          (swap.from.toLowerCase() === librarySwap.from &&
            swap.to.toLowerCase() === librarySwap.to.toLowerCase()),
      ),
  );
  const effectiveRecipe = { ...recipe, swaps: [...recipeSwaps, ...librarySwaps] };
  const swaps = availableSwaps(effectiveRecipe, versionKey);
  const diners = members.filter((member) => dinerIds.includes(member.id));

  const groups = meals.map((meal) => {
    const swapKeys = Object.keys(swapScopes).filter(
      (key) => swapScopes[key] === "all" || swapScopes[key] === meal.key,
    );
    return {
      ...meal,
      label: slotLabel(meal.date, meal.type),
      swapKeys,
      portionTotal: mealPortions(meal),
      ingredients: resolveIngredients(effectiveRecipe, versionKey, mealPortions(meal), swapKeys),
    };
  });

  const totalPortions = groups.reduce((total, group) => total + group.portionTotal, 0);
  const ingredientRows = resolveBatch(
    effectiveRecipe,
    versionKey,
    groups.map((group) => ({
      label: mealLabel(group.type),
      portions: group.portionTotal,
      swapKeys: group.swapKeys,
    })),
  );
  const extraRows = extras.map((item, index) => ({
    key: `extra-${index}`,
    name: item.name,
    qty: item.qty,
    unit: item.unit,
    allergens: [],
    extra: true,
  }));
  const allRows = [...ingredientRows, ...extraRows];
  const checks = [
    ...groups.map((group) => findConflicts(group.ingredients, diners)),
    findConflicts(extraRows, diners),
  ];
  const conflicts = checks
    .flatMap((check) => check.conflicts)
    .filter(
      (conflict, index, all) =>
        all.findIndex(
          (other) =>
            other.kind === conflict.kind && other.who === conflict.who && other.ingredient === conflict.ingredient,
        ) === index,
    );
  const missing = Array.from(new Set(checks.flatMap((check) => check.missing)));

  const perServing = servingFacts(recipe, versionKey);
  const batch = batchNutrition(perServing, totalPortions);
  const versionImage = version?.image_url || recipe.image_url;
  const versionName = version?.name || "Original recipe";
  const canScope = Boolean(version?.split);

  const appliedSwaps = Object.keys(swapScopes)
    .map((key) => {
      const swap = swaps.find((item) => item.key === key);
      if (!swap) return null;
      const scoped = meals.find((meal) => meal.key === swapScopes[key]);
      return { ...swap, scopeLabel: scoped ? slotLabel(scoped.date, scoped.type) : "Whole batch" };
    })
    .filter(Boolean);

  const flashSoon = (names = [], mealKey = null) => {
    setFlash({ names, meal: mealKey });
    window.setTimeout(() => setFlash({ names: [], meal: null }), 1100);
  };

  const chooseVersion = (key) => {
    setVersionKey(key);
    setSwapScopes({});
  };

  const setPortion = (mealKey, dinerId, value) => {
    setMeals((rows) =>
      rows.map((row) => (row.key === mealKey ? { ...row, portions: { ...row.portions, [dinerId]: value } } : row)),
    );
    flashSoon([], mealKey);
  };

  const setMealDate = (mealKey, date) =>
    setMeals((rows) => rows.map((row) => (row.key === mealKey ? { ...row, date } : row)));

  const resetPortions = (mealKey) =>
    setMeals((rows) =>
      rows.map((row) =>
        row.key === mealKey
          ? { ...row, portions: Object.fromEntries(Object.keys(row.portions).map((id) => [id, 1])) }
          : row,
      ),
    );

  const toggleDiner = (id) => {
    const next = dinerIds.includes(id)
      ? dinerIds.length === 1
        ? dinerIds
        : dinerIds.filter((item) => item !== id)
      : [...dinerIds, id];
    setDinerIds(next);
    setMeals((rows) => withDiners(rows, next));
  };

  const addDiner = async (name) => {
    const member = { id: crypto.randomUUID(), name, is_self: false, allergies: [], diet: [], goals: {} };
    const nextMembers = [...members, member];
    if (household) {
      await db.Household.update(household.id, { members: nextMembers });
    } else {
      await db.Household.create({ name: `${firstNameOf(user)}’s kitchen`, members: nextMembers });
    }
    const nextIds = [...dinerIds, member.id];
    setDinerIds(nextIds);
    setMeals((rows) => withDiners(rows, nextIds));
    await queryClient.invalidateQueries({ queryKey: ["household"] });
  };

  const closeSheet = () => {
    setSheetOptions([]);
    setSheetKey(null);
  };

  const openSwap = ({ options }) => {
    const applied = options.find((option) => swapScopes[option.key]);
    setSheetOptions(options);
    setSheetKey(applied?.key || options[0]?.key || null);
    setSheetScope(applied ? swapScopes[applied.key] : "all");
  };

  const scopedPortions =
    sheet && sheetScope !== "all"
      ? (groups.find((group) => group.key === sheetScope)?.portionTotal ?? 0)
      : totalPortions;

  const swapAmounts = sheet
    ? (() => {
        const base = resolveIngredients(effectiveRecipe, versionKey, scopedPortions, []).find((row) =>
          row.sourceName.toLowerCase().includes(sheet.from.toLowerCase()),
        );
        const next = resolveIngredients(effectiveRecipe, versionKey, scopedPortions, [sheet.key]).find(
          (row) => row.swap?.key === sheet.key,
        );
        return {
          fromAmount: base ? formatAmount(base.qty, base.unit) : "",
          toAmount: next ? formatAmount(next.qty, next.unit) : "",
          names: [base?.name, next?.name].filter(Boolean),
        };
      })()
    : { fromAmount: "", toAmount: "", names: [] };

  const applySwap = () => {
    if (!sheet) return;
    const mealKey = sheetScope === "all" ? null : sheetScope;
    setSwapScopes((scopes) => {
      // An ingredient holds one choice, so picking an alternative replaces its siblings.
      const next = { ...scopes };
      swaps.forEach((swap) => {
        if (swap.from.toLowerCase() === sheet.from.toLowerCase()) delete next[swap.key];
      });
      next[sheet.key] = sheetScope;
      return next;
    });
    flashSoon(swapAmounts.names, mealKey);
    closeSheet();
  };

  const undoSwap = (key) => {
    setSwapScopes((scopes) => {
      const next = { ...scopes };
      delete next[key];
      return next;
    });
    closeSheet();
  };

  const persist = async ({ withPlan }) => {
    setSaving(true);
    try {
      const names = diners.map((diner) => diner.name);
      const snapshot = allRows.map((row) => ({
        name: row.name,
        qty: row.qty,
        unit: row.unit,
        allergens: Array.isArray(row.allergens) ? row.allergens : null,
      }));

      await db.SavedVersion.create({
        recipe_id: recipe.id,
        recipe_title: recipe.title,
        image_url: versionImage,
        version_key: versionKey,
        version_name: versionName,
        servings: Math.round((totalPortions / meals.length) * 100) / 100,
        meal_count: meals.length,
        total_portions: totalPortions,
        swap_keys: Object.keys(swapScopes),
        diner_names: names,
      });

      if (withPlan) {
        // The same dish already planned for one of these meals is replaced, not doubled.
        const existing = await db.PlannedMeal.filter({ recipe_id: recipe.id });
        const replaced = existing.filter((meal) =>
          groups.some((group) => group.date === meal.scheduled_date && group.type === meal.meal_type),
        );
        await Promise.all(replaced.map((meal) => db.PlannedMeal.delete(meal.id)));
        await db.PlannedMeal.bulkCreate(
          groups.map((group) => ({
            recipe_id: recipe.id,
            recipe_title: recipe.title,
            image_url: versionImage,
            version_key: versionKey,
            version_name: versionName,
            scheduled_date: group.date,
            meal_type: group.type,
            servings: group.portionTotal,
            diner_names: names,
            portions: diners.map((diner) => ({
              diner_id: diner.id,
              diner_name: diner.name,
              servings: Number(group.portions[diner.id] ?? 1),
            })),
            swap_keys: group.swapKeys,
            swap_names: appliedSwaps
              .filter((swap) => group.swapKeys.includes(swap.key))
              .map((swap) => `${swap.from} → ${swap.to}`),
            ingredients: snapshot,
            nutrition: perServing || {},
          })),
        );
      }

      await queryClient.invalidateQueries();
      setSaving(false);
      if (withPlan) {
        toast.success("Saved to your plan");
        navigate({ to: "/plan" });
      } else {
        toast.success("Version saved");
        setReviewOpen(false);
      }
    } catch (error) {
      setSaving(false);
      toast.error("Could not save this batch");
    }
  };

  const portionMeal = meals.find((meal) => meal.key === portionMealKey) || null;

  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="sticky top-0 z-20 border-b border-black/[0.08] bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-[58px] w-full max-w-[460px] items-center gap-1 px-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/recipes/$recipeId", params: { recipeId: recipe.id } })}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink"
            aria-label="Back to recipe"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          </button>
          <p className="text-small font-semibold uppercase tracking-[0.16em] text-ink-mid">Make it yours</p>
          <p className="num ml-auto pr-2 text-small font-semibold uppercase tracking-[0.14em] text-ink-mid">
            {formatServings(totalPortions)} servings
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[460px] px-5 pb-40 pt-4">
        <h1 className="text-display font-semibold leading-[1.05] tracking-[-0.03em]">{recipe.title}</h1>
        <p className="mt-1 text-small font-medium text-ink-mid">{versionName}</p>

        {prefill ? (
          <p className="mt-3 rounded-[4px] bg-black/[0.035] p-3 text-small leading-relaxed text-ink-soft">
            Your saved version is filled in. Choose dates and portions below, and today’s diners get checked again.
          </p>
        ) : null}

        {versions.length ? (
          <section className="mt-5">
            <VersionSuggestion
              recipe={recipe}
              versionKey={versionKey}
              household={household}
              onUseVersion={chooseVersion}
            />
            <div className="mt-4">
              <VersionTiles versions={versions} value={versionKey} onChange={chooseVersion} title={recipe.title} />
            </div>
          </section>
        ) : null}

        <section className="mt-6 border-t border-border pt-4">
          <p className="num text-display font-semibold leading-[0.9] tracking-[-0.04em]">
            {formatServings(totalPortions)}
          </p>
          <p className="mt-1.5 text-small font-semibold uppercase tracking-[0.14em] text-ink-mid">
            servings total
          </p>
          <div className="mt-3 flex items-baseline gap-4">
            {portionsByType(meals).map((row) => (
              <p key={row.type} className="text-small">
                <span className="num font-semibold">{formatServings(row.portions)}</span>{" "}
                <span className="uppercase tracking-[0.1em] text-ink-mid">{mealLabel(row.type)}</span>
              </p>
            ))}
          </div>
        </section>

        <section className="mt-2">
          {groups.map((group) => (
            <MealPlanRow
              key={group.key}
              meal={group}
              label={group.label}
              dinersLine={dinersLine(group, diners)}
              swaps={appliedSwaps.filter((swap) => group.swapKeys.includes(swap.key)).map((swap) => swap.to)}
              flash={flash.meal === group.key}
              onEdit={() => setPortionMealKey(group.key)}
            />
          ))}
        </section>

        <section className="mt-6">
          <p className="eyebrow">Who’s eating</p>
          <div className="mt-2">
            <DinerPicker members={members} selected={dinerIds} onToggle={toggleDiner} onAdd={addDiner} />
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Ingredients</p>
            <p className="num text-small font-medium uppercase tracking-[0.12em] text-ink-faint">
              for {formatServings(totalPortions)}
            </p>
          </div>
          <div className="mt-1">
            <IngredientTable
              ingredients={ingredientRows}
              swaps={swaps}
              activeKeys={Object.keys(swapScopes)}
              onOpenSwap={openSwap}
              flashNames={flash.names}
            />
            <ExtraIngredients
              items={extras}
              onAdd={(item) => setExtras((rows) => [...rows, item])}
              onRemove={(index) => setExtras((rows) => rows.filter((_, at) => at !== index))}
            />
          </div>
          {appliedSwaps.length ? (
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <p className="text-small leading-snug text-ink-mid">
                {appliedSwaps[appliedSwaps.length - 1].from} → {appliedSwaps[appliedSwaps.length - 1].to} for{" "}
                {appliedSwaps[appliedSwaps.length - 1].scopeLabel.toLowerCase()}
              </p>
              <button
                type="button"
                onClick={() => undoSwap(appliedSwaps[appliedSwaps.length - 1].key)}
                className="shrink-0 text-small font-semibold uppercase tracking-[0.12em] text-chili"
              >
                Undo
              </button>
            </div>
          ) : null}
        </section>

        {conflicts.length || missing.length ? (
          <section className="mt-5 rounded-[4px] bg-chili/[0.06] p-3">
            <p className="text-small font-semibold uppercase tracking-[0.12em] text-chili">Check before saving</p>
            <div className="mt-2">
              <ConflictRows conflicts={conflicts} missing={missing} />
            </div>
            <p className="mt-2 text-small leading-snug text-ink-mid">
              Swap the ingredient, send the swap to one meal, or change who is eating.
            </p>
          </section>
        ) : null}

        <section className="mt-7 border-t border-border pt-4">
          <div className="flex items-baseline justify-between">
            <p className="eyebrow">Nutrient estimate</p>
            <p className="text-small font-medium uppercase tracking-[0.12em] text-ink-faint">whole batch</p>
          </div>
          <div className="mt-2">
            <NutritionRow
              nutrition={batch}
              basis={`Whole batch · ${formatServings(totalPortions)} portions`}
              footnote={
                perServing?.kcal
                  ? `About ${perServing.kcal} kcal and ${perServing.protein ?? "–"} g protein per portion.`
                  : "No per-portion estimate for this dish yet."
              }
            />
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto w-full max-w-[460px]">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-small font-semibold leading-none">
              {formatServings(totalPortions)} servings total
            </p>
            <p className="text-small leading-none text-ink-mid">{typeBreakdown(meals)}</p>
          </div>
          <Pill className="mt-2 w-full" onClick={() => setReviewOpen(true)}>
            Review batch
          </Pill>
        </div>
      </div>

      <PortionSheet
        open={Boolean(portionMeal)}
        onOpenChange={(open) => setPortionMealKey(open ? portionMealKey : null)}
        title={portionMeal ? slotLabel(portionMeal.date, portionMeal.type) : ""}
        meal={portionMeal}
        date={portionMeal?.date}
        onDate={(date) => portionMeal && setMealDate(portionMeal.key, date)}
        diners={diners}
        onChange={(dinerId, value) => portionMeal && setPortion(portionMeal.key, dinerId, value)}
        onReset={() => portionMeal && resetPortions(portionMeal.key)}
      />

      <SwapSheet
        open={Boolean(sheet)}
        onOpenChange={(open) => (open ? null : closeSheet())}
        swap={sheet}
        options={sheetOptions}
        value={sheetKey}
        onSelect={setSheetKey}
        fromAmount={swapAmounts.fromAmount}
        toAmount={swapAmounts.toAmount}
        applied={Boolean(sheet && swapScopes[sheet.key])}
        scopes={
          canScope
            ? [
                { value: "all", label: "Whole batch" },
                ...meals.map((meal) => ({ value: meal.key, label: slotLabel(meal.date, meal.type) })),
              ]
            : [{ value: "all", label: "Whole batch" }]
        }
        scope={sheetScope}
        onScope={setSheetScope}
        setAside={
          sheet && sheetScope !== "all"
            ? `Shared base: set aside ${formatServings(scopedPortions)} of ${formatServings(totalPortions)} servings for ${
                (() => {
                  const scoped = meals.find((meal) => meal.key === sheetScope);
                  return scoped ? slotLabel(scoped.date, scoped.type) : "one meal";
                })()
              } before the dairy goes in, then finish those with ${sheet.to}.`
            : sheet
              ? `Applies to all ${formatServings(totalPortions)} servings. ${sheet.affects}.`
              : ""
        }
        onApply={applySwap}
        onUndo={() => sheet && undoSwap(sheet.key)}
      />

      <ReviewSheet
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        recipe={recipe}
        versionName={versionName}
        meals={groups.map((group) => ({
          key: group.key,
          type: group.type,
          label: group.label,
          portions: group.portionTotal,
          dinersLine: dinersLine(group, diners),
        }))}
        totalPortions={totalPortions}
        breakdown={typeBreakdown(meals)}
        ingredients={allRows}
        swaps={appliedSwaps}
        conflicts={conflicts}
        missing={missing}
        nutrition={batch}
        saving={saving}
        onSave={() => persist({ withPlan: true })}
        onSaveVersion={() => persist({ withPlan: false })}
      />
    </div>
  );
}