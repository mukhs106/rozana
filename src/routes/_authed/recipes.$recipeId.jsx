import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import AppShell from "@/components/AppShell";
import Pill from "@/components/Pill";
import Stepper from "@/components/Stepper";
import { Image } from "@/components/ui/image";
import IngredientTable from "@/components/recipe/IngredientTable";
import NutritionRow from "@/components/recipe/NutritionRow";
import AllergenPanel from "@/components/recipe/AllergenPanel";
import SwapSheet from "@/components/make/SwapSheet";
import ConflictRows from "@/components/make/ConflictRows";
import { membersOf, useHousehold, useRecipes } from "@/hooks/useKitchen";
import {
  availableSwaps,
  findConflicts,
  formatAmount,
  resolveIngredients,
  versionInstructions,
} from "@/lib/mealMath";
import { cookMinutesOf, heatOf, perServing as servingFacts, versionChipLabel } from "@/lib/foodInfo";
import { librarySwapsFor } from "@/lib/swapLibrary";
import { formatServings } from "@/lib/allocations";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/recipes/$recipeId")({
  ssr: false,
  validateSearch: (search) => ({
    version: typeof search.version === "string" ? search.version : undefined,
    portions: search.portions ? Number(search.portions) : undefined,
  }),
  component: RecipeDetailPage,
});

function RecipeDetailPage() {
  const { recipeId } = Route.useParams();
  const search = Route.useSearch();
  const { user } = Route.useRouteContext();
  const { data: recipes = [], isLoading } = useRecipes();
  const { data: household } = useHousehold();
  const [versionOverride, setVersionOverride] = useState(null);
  const [portionsOverride, setPortionsOverride] = useState(null);
  const [swapKeys, setSwapKeys] = useState([]);
  const [sheetOptions, setSheetOptions] = useState([]);
  const [sheetKey, setSheetKey] = useState(null);
  const [flash, setFlash] = useState([]);
  const [showAllIngredients, setShowAllIngredients] = useState(false);

  const recipe = recipes.find((item) => item.id === recipeId);

  if (isLoading) {
    return (
      <AppShell>
        <div className="-mx-5 h-[230px] animate-pulse bg-secondary" />
      </AppShell>
    );
  }

  if (!recipe) {
    return (
      <AppShell>
        <h1 className="mt-2 text-[26px] leading-tight">This recipe is no longer here.</h1>
        <Pill as={Link} to="/recipes" variant="outline" className="mt-5">
          Back to recipes
        </Pill>
      </AppShell>
    );
  }

  const versionKey = versionOverride ?? search.version ?? recipe.variations?.[0]?.key ?? "base";
  const portions =
    portionsOverride ?? search.portions ?? household?.default_servings ?? recipe.base_servings ?? 4;
  const version = (recipe.variations || []).find((item) => item.key === versionKey) || null;
  const hero = version?.image_url || recipe.image_url;
  const minutes = cookMinutesOf(recipe);
  const heat = heatOf(recipe, versionKey);

  const recipeSwaps = recipe.swaps || [];
  const librarySwaps = librarySwapsFor(
    (version?.ingredients?.length ? version.ingredients : recipe.base_ingredients) || [],
  ).filter(
    (librarySwap) =>
      !recipeSwaps.some(
        (swap) =>
          swap.key === librarySwap.key ||
          (swap.from.toLowerCase() === librarySwap.from && swap.to.toLowerCase() === librarySwap.to.toLowerCase()),
      ),
  );
  const swaps = [...recipeSwaps, ...librarySwaps];
  const effectiveRecipe = { ...recipe, swaps };
  const sheet = sheetOptions.find((option) => option.key === sheetKey) || null;

  const ingredients = resolveIngredients(effectiveRecipe, versionKey, portions, swapKeys);
  const instructions = versionInstructions(recipe, versionKey);
  const perServing = servingFacts(recipe, versionKey);
  const diners = membersOf(household, user);
  const { conflicts, missing } = findConflicts(ingredients, diners);
  // What the open swap would leave unresolved for the people at the table.
  const sheetWarnings = sheet
    ? findConflicts(resolveIngredients(effectiveRecipe, versionKey, portions, [sheet.key]), diners).conflicts.map(
        (conflict) => `${conflict.ingredient} against ${conflict.who} (${conflict.label})`,
      )
    : [];
  const visibleIngredients = showAllIngredients ? ingredients : ingredients.slice(0, 6);

  // A new version is a different dish for allergens, nutrition and method, so
  // the ingredient choices made for the old one do not carry over.
  const pickVersion = (key) => {
    setVersionOverride(key);
    setSwapKeys([]);
  };

  const flashSoon = (names) => {
    setFlash(names);
    window.setTimeout(() => setFlash([]), 1100);
  };

  const closeSheet = () => {
    setSheetOptions([]);
    setSheetKey(null);
  };

  const openSwap = ({ options }) => {
    const applied = options.find((option) => swapKeys.includes(option.key));
    setSheetOptions(options);
    setSheetKey(applied?.key || options[0]?.key || null);
  };

  const applySwap = () => {
    if (!sheet) return;
    const base = resolveIngredients(effectiveRecipe, versionKey, portions, []).find((row) =>
      row.sourceName.toLowerCase().includes(sheet.from.toLowerCase()),
    );
    const next = resolveIngredients(effectiveRecipe, versionKey, portions, [sheet.key]).find(
      (row) => row.swap?.key === sheet.key,
    );
    setSwapKeys((keys) => [
      // An ingredient holds one choice, so picking an alternative replaces its siblings.
      ...keys.filter((key) => {
        const kept = swaps.find((item) => item.key === key);
        return kept ? kept.from.toLowerCase() !== sheet.from.toLowerCase() : true;
      }),
      sheet.key,
    ]);
    flashSoon([base?.name, next?.name].filter(Boolean));
    closeSheet();
  };

  const undoSwap = (key) => {
    setSwapKeys((keys) => keys.filter((item) => item !== key));
    closeSheet();
  };

  const sheetAmounts = sheet
    ? (() => {
        const base = resolveIngredients(effectiveRecipe, versionKey, portions, []).find((row) =>
          row.sourceName.toLowerCase().includes(sheet.from.toLowerCase()),
        );
        const next = resolveIngredients(effectiveRecipe, versionKey, portions, [sheet.key]).find(
          (row) => row.swap?.key === sheet.key,
        );
        return {
          fromAmount: base ? formatAmount(base.qty, base.unit) : "",
          toAmount: next ? formatAmount(next.qty, next.unit) : "",
        };
      })()
    : { fromAmount: "", toAmount: "" };

  return (
    <AppShell>
      <div className="-mx-5 overflow-hidden bg-secondary">
        <Image
          key={hero}
          src={hero}
          alt={version?.name || recipe.title}
          className="h-[230px] w-full object-cover object-center sm:h-[320px]"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <Link to="/recipes" className="inline-flex items-center gap-1 text-[13px] text-ink-mid">
          <ChevronLeft className="h-4 w-4" strokeWidth={2.2} /> Recipes
        </Link>
        {recipe.tags?.length ? (
          <p className="flex flex-wrap justify-end gap-x-2 text-[12px] text-ink-mid">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </p>
        ) : null}
      </div>

      <h1 className="mt-2 font-serif text-[40px] leading-[0.98]">{recipe.title}</h1>

      <p className="num mt-2 flex items-center gap-1.5 text-[14px] text-ink-soft">
        <span>Serves {formatServings(portions)}</span>
        {minutes ? <span>· {minutes} min</span> : null}
        <span>· {heat.label}</span>
      </p>

      <Pill
        as={Link}
        to="/make/$recipeId"
        params={{ recipeId: recipe.id }}
        search={{ version: versionKey }}
        className="mt-4 w-full"
      >
        Make it yours
      </Pill>

      {recipe.variations?.length ? (
        <section className="mt-5">
          <h2 className="text-[15px] font-medium">Versions you can cook</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {recipe.variations.map((item) => {
              const selected = item.key === versionKey;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => pickVersion(item.key)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    selected
                      ? "border-oxblood bg-oxblood text-field-paper"
                      : "border-border text-ink-mid hover:border-ink-mid",
                  )}
                >
                  {versionChipLabel(recipe.title, item.name)}
                </button>
              );
            })}
          </div>
          {version?.summary ? <p className="mt-2 text-[13px] leading-snug text-ink-mid">{version.summary}</p> : null}
        </section>
      ) : null}

      <AllergenPanel
        recipe={recipe}
        versionKey={versionKey}
        household={household}
        onPickVersion={pickVersion}
      />

      <p className="mt-4 text-[14.5px] leading-relaxed text-ink-soft">{version?.summary || recipe.description}</p>

      <section className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-4">
        <div>
          <p className="text-[15px] font-medium">How much are you cooking?</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-ink-mid">
            {formatServings(portions)} {portions === 1 ? "portion" : "portions"} in this batch. The recipe makes{" "}
            {recipe.base_servings}.
          </p>
        </div>
        <Stepper value={portions} onChange={setPortionsOverride} max={24} unit="portion" />
      </section>

      <section className="mt-7">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[19px] leading-tight">Ingredients</h2>
          <p className="num text-[12.5px] text-ink-mid">
            for {formatServings(portions)} {portions === 1 ? "portion" : "portions"}
          </p>
        </div>
        <div className="mt-1">
          <IngredientTable
            ingredients={visibleIngredients}
            swaps={availableSwaps(effectiveRecipe, versionKey)}
            activeKeys={swapKeys}
            onOpenSwap={openSwap}
            flashNames={flash}
          />
        </div>
        {ingredients.length > 6 ? (
          <button
            type="button"
            onClick={() => setShowAllIngredients((shown) => !shown)}
            className="mt-1 text-[13px] font-medium text-chili"
          >
            {showAllIngredients ? "Show fewer ingredients" : `Show all ${ingredients.length} ingredients`}
          </button>
        ) : null}
      </section>

      {conflicts.length || missing.length ? (
        <section className="mt-5 rounded-[8px] bg-chili/[0.06] p-3">
          <p className="text-[13px] font-semibold text-chili">For your kitchen</p>
          <div className="mt-2">
            <ConflictRows conflicts={conflicts} missing={missing} />
          </div>
        </section>
      ) : null}

      <section className="mt-7">
        <h2 className="text-[19px] leading-tight">Method</h2>
        <ol className="mt-2">
          {instructions.map((step, index) => (
            <li key={index} className="flex gap-3 border-t border-border py-3">
              <span className="num shrink-0 text-[12.5px] font-semibold text-chili">{index + 1}</span>
              <span className="text-[14px] leading-relaxed text-ink-soft">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-7 border-t border-border pt-4">
        <h2 className="text-[19px] leading-tight">Per serving</h2>
        <div className="mt-2">
          <NutritionRow nutrition={perServing} basis={`One of ${formatServings(portions)} portions`} />
        </div>
      </section>

      {recipe.source_url ? (
        <p className="mt-6 break-words border-t border-border pt-3 text-[12px] text-ink-mid">
          Saved from {recipe.source_url}
        </p>
      ) : null}

      <SwapSheet
        open={Boolean(sheet)}
        onOpenChange={(open) => (open ? null : closeSheet())}
        swap={sheet}
        options={sheetOptions}
        value={sheetKey}
        onSelect={setSheetKey}
        fromAmount={sheetAmounts.fromAmount}
        toAmount={sheetAmounts.toAmount}
        applied={Boolean(sheet && swapKeys.includes(sheet.key))}
        scopes={[]}
        scope="all"
        onScope={() => {}}
        setAside={
          sheet ? `Applies to all ${formatServings(portions)} portions. ${sheet.method_change || ""}` : ""
        }
        onApply={applySwap}
        onUndo={() => sheet && undoSwap(sheet.key)}
        warnings={sheetWarnings}
      />
    </AppShell>
  );
}