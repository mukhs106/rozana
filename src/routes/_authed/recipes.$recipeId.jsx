import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarPlus, Check, ChevronLeft, Clock, Flame, Heart, ShoppingBasket, Users, UtensilsCrossed } from "lucide-react";
import { db } from "@/api/db";
import AppShell from "@/components/AppShell";
import Pill from "@/components/Pill";
import Stepper from "@/components/Stepper";
import { Image } from "@/components/ui/image";
import IngredientTable from "@/components/recipe/IngredientTable";
import NutritionRow from "@/components/recipe/NutritionRow";
import SwapSheet from "@/components/make/SwapSheet";
import AtTheTable from "@/components/recipe/AtTheTable";
import { AddToPlanSheet, CookModeSheet, SaveSheet } from "@/components/recipe/RecipeSheets";
import {
  membersOf,
  useCollections,
  useCookLog,
  useHousehold,
  useRecipes,
  useUserSettings,
} from "@/hooks/useKitchen";
import { formatServings } from "@/lib/allocations";
import {
  allCollections,
  createCollection,
  isFavourite,
  logCooked,
  toggleFavourite,
  toggleInCollection,
} from "@/lib/collections";
import { heatOf, perServing as servingFacts } from "@/lib/foodInfo";
import { FIT, fitForDiner } from "@/lib/fit";
import { availableSwaps, formatAmount, resolveIngredients, versionInstructions } from "@/lib/mealMath";
import { plannedMealFor } from "@/lib/planWrite";
import { toGroceryItem } from "@/lib/groceries";
import { cookMinutes } from "@/lib/suggest";
import { batchIngredients, batchMaths, isSplittable, tableRows, withLibrarySwaps } from "@/lib/table";
import { convertRows } from "@/lib/units";
import { todayISO } from "@/lib/slots";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/recipes/$recipeId")({
  ssr: false,
  validateSearch: (search) => ({
    version: typeof search.version === "string" ? search.version : undefined,
    // Comma-separated diner ids: who's eating ("Cook for this table" on Today).
    diners: typeof search.diners === "string" ? search.diners : undefined,
  }),
  component: RecipeDetailPage,
});

function RecipeDetailPage() {
  const { recipeId } = Route.useParams();
  const { data: recipes = [], isLoading } = useRecipes();
  const recipe = recipes.find((item) => item.id === recipeId);

  if (isLoading) {
    return (
      <AppShell>
        <div className="-mx-5 -mt-4 aspect-[4/3] animate-pulse bg-sand motion-reduce:animate-none" />
      </AppShell>
    );
  }
  if (!recipe) {
    return (
      <AppShell>
        <h1 className="mt-2 text-display">This recipe is no longer here.</h1>
        <Pill as={Link} to="/recipes" variant="soft" className="mt-5">
          Back to recipes
        </Pill>
      </AppShell>
    );
  }
  return <RecipeView key={recipe.id} recipe={recipe} />;
}

function ActionButton({ icon: Icon, label, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-[76px] flex-1 flex-col items-center gap-1.5 rounded-2xl py-2 text-small font-medium text-ink"
    >
      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          active ? "bg-primary text-primary-foreground" : "bg-sand text-ink",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      {label}
    </button>
  );
}

function SwapNotes({ notes }) {
  if (!notes.length) return null;
  return (
    <div className="mt-3 rounded-2xl bg-status-swap-tint p-4">
      <p className="text-body font-semibold text-status-swap">Swaps in this batch</p>
      <ul className="mt-1 space-y-2">
        {notes.map((note) => (
          <li key={note.key} className="text-body text-ink">
            {note.text}
            {note.method ? <span className="block text-small text-ink-soft">{note.method}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecipeView({ recipe: original }) {
  const search = Route.useSearch();
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: household } = useHousehold();
  const { data: settings } = useUserSettings();
  const { data: stored = [] } = useCollections();
  const { data: cookLog = [] } = useCookLog();
  const today = todayISO();

  const members = membersOf(household, user);
  const versionKey = search.version ?? original.variations?.[0]?.key ?? "base";
  const recipe = useMemo(() => withLibrarySwaps(original, versionKey), [original, versionKey]);

  // null = everyone at the table. Ids from the link are kept as given, so they
  // still apply once the household finishes loading.
  const [seatedIds, setSeatedIds] = useState(() => {
    const wanted = (search.diners || "").split(",").filter(Boolean);
    return wanted.length ? wanted : null;
  });
  const [portions, setPortions] = useState({});
  const [chosen, setChosen] = useState([]);
  const [spare, setSpare] = useState(0);
  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(false);
  const [swapOptions, setSwapOptions] = useState([]);
  const [swapKey, setSwapKey] = useState(null);

  // With no one chosen yet, seat everyone who can eat this; anyone who can't
  // is offered as "Add …" below, so their portion isn't cooked by default.
  const canEatIds = members.filter((member) => fitForDiner(recipe, member, versionKey).status !== FIT.CANT).map((member) => member.id);
  const defaultIds = canEatIds.length ? canEatIds : members.map((member) => member.id);
  const seated = members.filter((member) => (seatedIds || defaultIds).includes(member.id));
  const rows = tableRows(recipe, seated, portions, chosen, versionKey);
  const maths = batchMaths(rows, spare, Number(recipe.base_servings) || 4);
  const units = settings?.units || "recipe";
  const ingredients = convertRows(batchIngredients(recipe, rows, chosen, spare, versionKey), units);
  const steps = versionInstructions(recipe, versionKey);
  const nutrition = servingFacts(recipe, versionKey);
  const minutes = cookMinutes(recipe);
  const heat = heatOf(recipe, versionKey);
  const collections = allCollections(stored, cookLog, today);
  const favourite = isFavourite(stored, recipe.id);
  const swapSheet = swapOptions.find((option) => option.key === swapKey) || null;

  // What each chosen swap changes in the method, and whose plate it is for.
  const swapNotes = (recipe.swaps || [])
    .filter((swap) => chosen.includes(swap.key))
    .map((swap) => {
      const who = rows.filter((row) => row.needed.includes(swap.key)).map((row) => row.member.name);
      const scope = isSplittable(swap) && who.length ? `${who.join(" and ")}'s portion` : "the whole pot";
      return { key: swap.key, text: `${swap.to} instead of ${String(swap.from).toLowerCase()}, for ${scope}.`, method: swap.method_change };
    });

  const refresh = (key) => queryClient.invalidateQueries({ queryKey: [key] });
  const toggleSwap = (key) => setChosen((list) => (list.includes(key) ? list.filter((item) => item !== key) : [...list, key]));
  const fitAll = () => setChosen((list) => Array.from(new Set([...list, ...rows.flatMap((row) => row.needed)])));
  const toggleSeat = (id) => {
    const current = seatedIds || defaultIds;
    const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
    if (next.length) setSeatedIds(next);
  };
  const goBack = () => (router.history.canGoBack() ? router.history.back() : router.navigate({ to: "/recipes" }));

  const withPortions = (list) => list.map((row) => ({ ...row.member, portion: row.portion }));
  const tableWords = `${rows.length} ${rows.length === 1 ? "person" : "people"}, ${formatServings(maths.total)} portions${
    chosen.length ? `, ${chosen.length} ${chosen.length === 1 ? "swap" : "swaps"}` : ""
  }`;

  const addToPlan = async (date, type) => {
    setBusy(true);
    try {
      // Split swaps go on the plates of the people who need them; the rest are whole-pot.
      const split = chosen.filter((key) => {
        const swap = (recipe.swaps || []).find((item) => item.key === key);
        return swap && isSplittable(swap) && rows.some((row) => row.needed.includes(key));
      });
      const personSwaps = Object.fromEntries(rows.map((row) => [row.member.id, split.filter((key) => row.needed.includes(key))]));
      const meal = plannedMealFor(recipe, withPortions(rows), date, type, {
        swapKeys: chosen.filter((key) => !split.includes(key)),
        personSwaps,
        versionKey,
      });
      await db.PlannedMeal.create(meal);
      await refresh("planned-meals");
      toast.success(`${recipe.title} is on the plan`);
      setSheet(null);
    } finally {
      setBusy(false);
    }
  };

  const addToGroceries = async () => {
    setBusy(true);
    try {
      const staples = (settings?.staples || []).map((item) => item.toLowerCase());
      const raw = batchIngredients(recipe, rows, chosen, spare, versionKey);
      const skipped = raw.filter((row) => staples.some((staple) => row.name.toLowerCase().includes(staple)));
      const items = raw
        .filter((row) => !skipped.includes(row) && row.qty > 0)
        .map((row) => ({
          ...toGroceryItem({ name: row.name, qty: row.qty, unit: row.unit, forNames: row.swap && row.scope ? row.scope : null }, recipe.title),
          recipe_id: recipe.id,
        }));
      await db.GroceryItem.bulkCreate(items);
      await refresh("grocery-items");
      toast.success(
        `${items.length} items added to Groceries${skipped.length ? ` · skipped ${skipped.length} staples you always have` : ""}`,
      );
    } finally {
      setBusy(false);
    }
  };

  const cooked = async () => {
    setBusy(true);
    try {
      await logCooked(recipe.id, today);
      await refresh("cook-log");
      toast.success("Logged. Your streak is counting.");
      setSheet(null);
    } finally {
      setBusy(false);
    }
  };

  // Swaps opened from an ingredient row apply to the whole pot.
  const openSwap = ({ options }) => {
    setSwapOptions(options);
    setSwapKey(options.find((option) => chosen.includes(option.key))?.key || options[0]?.key || null);
  };
  const applySwap = () => {
    if (!swapSheet) return;
    setChosen((list) => [...list.filter((key) => !swapOptions.some((option) => option.key === key)), swapSheet.key]);
    setSwapOptions([]);
  };
  const amountFor = (keys) => {
    const row = resolveIngredients(recipe, versionKey, maths.total, keys).find((item) =>
      keys.length ? item.swap?.key === keys[0] : item.sourceName.toLowerCase().includes(String(swapSheet?.from).toLowerCase()),
    );
    return row ? formatAmount(row.qty, row.unit) : "";
  };

  return (
    <AppShell>
      {/* 1. Full-bleed photo */}
      <div className="relative -mx-5 -mt-4 bg-sand">
        {recipe.image_url ? (
          <Image src={recipe.image_url} alt={recipe.title} className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div className="aspect-[4/3] w-full" />
        )}
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-background text-ink shadow-sm"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={async () => {
            await toggleFavourite(stored, recipe.id);
            refresh("collections");
          }}
          aria-label={favourite ? "Remove from favourites" : "Add to favourites"}
          aria-pressed={favourite}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-background text-ink shadow-sm"
        >
          <Heart className={cn("h-5 w-5", favourite && "fill-primary text-primary")} aria-hidden="true" />
        </button>
      </div>

      {/* 2. Title and meta chips */}
      <h1 className="mt-5 text-display">{recipe.title}</h1>
      {recipe.subtitle ? <p className="mt-1 text-body text-ink-mid">{recipe.subtitle}</p> : null}
      <ul className="mt-3 flex flex-wrap gap-2">
        {minutes ? (
          <li className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sand px-3 text-small font-medium">
            <Clock className="h-4 w-4" aria-hidden="true" /> {minutes} min
          </li>
        ) : null}
        <li className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sand px-3 text-small font-medium">
          <Flame className="h-4 w-4" aria-hidden="true" /> {heat.label}
        </li>
        <li className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sand px-3 text-small font-medium">
          <Users className="h-4 w-4" aria-hidden="true" /> Serves {formatServings(maths.total)}
        </li>
      </ul>

      {/* 3. Action row */}
      <div className="mt-5 flex justify-between gap-1">
        <ActionButton icon={CalendarPlus} label="Plan" onClick={() => setSheet("plan")} />
        <ActionButton icon={ShoppingBasket} label="Groceries" onClick={addToGroceries} />
        <ActionButton icon={Heart} label="Save" active={favourite} onClick={() => setSheet("save")} />
        <ActionButton icon={UtensilsCrossed} label="Cook" onClick={() => setSheet("cook")} />
      </div>

      {recipe.description ? <p className="mt-5 text-body text-ink-soft">{recipe.description}</p> : null}

      {/* 4. At the table, above the ingredients */}
      <AtTheTable
        members={members}
        seatedIds={seated.map((member) => member.id)}
        onToggleSeat={toggleSeat}
        rows={rows}
        chosen={chosen}
        onToggleSwap={toggleSwap}
        onFitAll={fitAll}
        onPortion={(id, value) => setPortions((current) => ({ ...current, [id]: value }))}
        maths={maths}
        recipeId={recipe.id}
        cantFor={(member) => !canEatIds.includes(member.id)}
      />

      {/* 5. Ingredients with a servings stepper */}
      <section aria-labelledby="ingredients-title" className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 id="ingredients-title" className="text-title">
            Ingredients
          </h2>
          <Stepper
            value={maths.total}
            min={maths.people}
            max={maths.people + 12}
            step={1}
            unit="portion"
            onChange={(value) => setSpare(Math.max(0, value - maths.people))}
          />
        </div>
        <p className="mt-1 text-small text-ink-mid">
          {spare > 0
            ? `${formatServings(maths.people)} for the table + ${spare} spare for a tiffin or the freezer.`
            : "Add portions for tomorrow's tiffin or the freezer."}
          {units !== "recipe" ? " Units follow your kitchen settings." : ""}
        </p>
        <div className="mt-2">
          <IngredientTable
            ingredients={ingredients}
            swaps={availableSwaps(recipe, versionKey)}
            activeKeys={chosen}
            onOpenSwap={openSwap}
          />
        </div>
      </section>

      {/* 6. Steps */}
      <section aria-labelledby="steps-title" className="mt-10">
        <h2 id="steps-title" className="text-title">
          Steps
        </h2>
        <SwapNotes notes={swapNotes} />
        <ol className="mt-2">
          {steps.map((step, index) => (
            <li key={index} className="flex gap-4 border-t border-border py-4">
              <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sand text-small font-semibold">
                {index + 1}
              </span>
              <span className="text-body text-ink-soft">{step}</span>
            </li>
          ))}
        </ol>
        <Pill variant="soft" className="mt-2 w-full" disabled={busy} onClick={cooked}>
          <Check className="h-5 w-5" aria-hidden="true" /> Cooked it
        </Pill>
      </section>

      {/* 7. Nutrition per serving */}
      <section aria-labelledby="nutrition-title" className="mt-10">
        <h2 id="nutrition-title" className="text-title">
          Nutrition per serving
        </h2>
        <div className="mt-2">
          <NutritionRow nutrition={nutrition} basis="One standard portion. Estimates, not lab values." />
        </div>
      </section>

      {recipe.source_url ? (
        <p className="mt-8 break-words border-t border-border pt-3 text-small text-ink-mid">Saved from {recipe.source_url}</p>
      ) : null}

      <AddToPlanSheet
        open={sheet === "plan"}
        onOpenChange={(open) => setSheet(open ? "plan" : null)}
        today={today}
        onSave={addToPlan}
        busy={busy}
        summary={`For ${tableWords}.`}
      />
      <SaveSheet
        open={sheet === "save"}
        onOpenChange={(open) => setSheet(open ? "save" : null)}
        collections={collections}
        favourite={favourite}
        recipeId={recipe.id}
        onFavourite={async () => {
          await toggleFavourite(stored, recipe.id);
          refresh("collections");
        }}
        onToggle={async (item) => {
          await toggleInCollection(item, recipe.id);
          refresh("collections");
        }}
        onCreate={async (name) => {
          await createCollection(name, [recipe.id]);
          refresh("collections");
          toast.success(`Saved to ${name.trim()}`);
        }}
      />
      <CookModeSheet
        open={sheet === "cook"}
        onOpenChange={(open) => setSheet(open ? "cook" : null)}
        title={recipe.title}
        steps={steps}
        busy={busy}
        onCooked={cooked}
        notes={<SwapNotes notes={swapNotes} />}
        ingredients={ingredients.map((row) => ({
          key: row.key,
          name: row.name,
          amount: formatAmount(row.qty, row.unit),
          scopeText: row.swap && row.scope ? `For ${row.scope.join(" and ")}` : "",
        }))}
      />
      <SwapSheet
        open={Boolean(swapSheet)}
        onOpenChange={(open) => (open ? null : setSwapOptions([]))}
        swap={swapSheet}
        options={swapOptions}
        value={swapKey}
        onSelect={setSwapKey}
        fromAmount={swapSheet ? amountFor([]) : ""}
        toAmount={swapSheet ? amountFor([swapSheet.key]) : ""}
        applied={Boolean(swapSheet && chosen.includes(swapSheet.key))}
        scopes={[]}
        scope="all"
        onScope={() => {}}
        setAside={swapSheet ? `Applies to the whole pot. ${swapSheet.method_change || ""}` : ""}
        onApply={applySwap}
        onUndo={() => {
          if (swapSheet) toggleSwap(swapSheet.key);
          setSwapOptions([]);
        }}
        warnings={[]}
      />
    </AppShell>
  );
}
