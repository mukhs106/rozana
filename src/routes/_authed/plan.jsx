import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Layers, Plus } from "lucide-react";
import { db } from "@/api/db";
import AppShell from "@/components/AppShell";
import { Image } from "@/components/ui/image";
import DinerAvatar from "@/components/table/DinerAvatar";
import { MealSheet, PickDishSheet } from "@/components/plan/PlanSheets";
import {
  membersOf,
  useGroceryItems,
  useHousehold,
  usePlannedMeals,
  useRecipes,
  useUserSettings,
} from "@/hooks/useKitchen";
import { formatServings, mealPortions } from "@/lib/allocations";
import { batchKey, groupBatches } from "@/lib/batches";
import { logCooked } from "@/lib/collections";
import { dinersOfMeal, FIT, fitForDiner } from "@/lib/fit";
import { planNeeds, toGroceryItem } from "@/lib/groceries";
import { plannedMealFor } from "@/lib/planWrite";
import { weekDays } from "@/lib/suggest";
import { withLibrarySwaps } from "@/lib/table";
import { addDays, compareSlots, mealLabel, parseISODate, todayISO } from "@/lib/slots";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/plan")({
  ssr: false,
  head: () => ({ meta: [{ title: "Plan · Rozana" }] }),
  component: PlanPage,
});

const DAY_NAME = new Intl.DateTimeFormat("en-GB", { weekday: "long" });
const SHORT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const STATUS_DOT = { fits: "bg-status-fit", swap: "bg-status-swap", check: "bg-status-swap", cant: "bg-status-cant" };

function weekLabel(offset) {
  if (offset === 0) return "This week";
  if (offset === 1) return "Next week";
  if (offset === -1) return "Last week";
  return null;
}

function MealCard({ meal, diners, statuses, siblings, onOpen }) {
  const portions = mealPortions(meal);
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn("flex w-full items-center gap-3 rounded-2xl bg-sand/60 p-3 text-left", meal.cooked_on && "opacity-70")}
    >
      {meal.image_url ? (
        <Image src={meal.image_url} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
      ) : (
        <span className="h-16 w-16 shrink-0 rounded-xl bg-sand" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-small font-medium text-ink-mid">
          {mealLabel(meal.meal_type)} · {formatServings(portions)} {portions === 1 ? "portion" : "portions"}
          {meal.cooked_on ? " · cooked" : ""}
        </span>
        <span className="block truncate text-body font-semibold">{meal.recipe_title}</span>
        <span className="mt-1 flex items-center gap-2">
          <span className="flex -space-x-2" aria-label={`Eating: ${diners.map((member) => member.name).join(", ")}`}>
            {diners.map((member) => (
              <span key={member.id} className="relative">
                <DinerAvatar member={member} size={28} className="ring-2 ring-background" />
                <span
                  className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-background", STATUS_DOT[statuses[member.id]])}
                  aria-hidden="true"
                />
              </span>
            ))}
          </span>
          {siblings ? (
            <span className="inline-flex items-center gap-1 text-small text-ink-mid">
              <Layers className="h-4 w-4" aria-hidden="true" /> 1 cook, {siblings + 1} meals
            </span>
          ) : null}
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-ink-mid" aria-hidden="true" />
    </button>
  );
}

function PlanPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: meals = [] } = usePlannedMeals();
  const { data: recipes = [] } = useRecipes();
  const { data: household } = useHousehold();
  const { data: items = [] } = useGroceryItems();
  const { data: settings } = useUserSettings();
  const members = membersOf(household, user);
  const today = todayISO();

  const [offset, setOffset] = useState(0);
  const [adding, setAdding] = useState(null); // { date, anyDay }
  const [openId, setOpenId] = useState(null);
  const [swapping, setSwapping] = useState(false);
  const [busy, setBusy] = useState(false);

  const days = weekDays(addDays(today, offset * 7));
  const monday = days[0];
  const inWeek = meals.filter((meal) => meal.scheduled_date >= monday && meal.scheduled_date <= days[6]);
  const anyDay = inWeek.filter((meal) => meal.any_day);
  const dated = inWeek.filter((meal) => !meal.any_day);
  const batches = useMemo(() => groupBatches([...meals].sort(compareSlots)), [meals]);
  const batchOf = (meal) => batches.find((batch) => batch.key === batchKey(meal));
  const open = meals.find((meal) => meal.id === openId) || null;
  const openRecipe = open ? recipes.find((recipe) => recipe.id === open.recipe_id) : null;

  const statusesFor = (meal, diners) => {
    const recipe = recipes.find((item) => item.id === meal.recipe_id);
    if (!recipe) return {};
    const full = withLibrarySwaps(recipe, meal.version_key);
    return Object.fromEntries(
      diners.map((member) => {
        const fit = fitForDiner(full, member, meal.version_key);
        const portion = (meal.portions || []).find((item) => item.diner_id === member.id || item.diner_name === member.name);
        const planned = portion?.swap_keys || meal.swap_keys || [];
        const covered = fit.status === FIT.SWAP && fit.swaps.every((swap) => planned.includes(swap.key));
        return [member.id, covered ? FIT.FITS : fit.status];
      }),
    );
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["planned-meals"] });
  const run = async (work, message) => {
    setBusy(true);
    try {
      await work();
      await refresh();
      if (message) toast.success(message);
    } finally {
      setBusy(false);
    }
  };

  const seatedMembers = (seat) =>
    members.filter((member) => seat[member.id] !== undefined).map((member) => ({ ...member, portion: seat[member.id] }));
  const personSwapsOf = (meal) =>
    Object.fromEntries((meal.portions || []).map((portion) => [portion.diner_id, portion.swap_keys || []]));

  const addMeal = (recipe, type) =>
    run(async () => {
      const row = plannedMealFor(withLibrarySwaps(recipe), members, adding.date, type, { anyDay: adding.anyDay });
      await db.PlannedMeal.create(row);
      setAdding(null);
    }, `${recipe.title} added`);

  const saveTable = (seat) =>
    run(async () => {
      const recipe = withLibrarySwaps(openRecipe, open.version_key);
      const row = plannedMealFor(recipe, seatedMembers(seat), open.scheduled_date, open.meal_type, {
        personSwaps: personSwapsOf(open),
        versionKey: open.version_key,
        anyDay: Boolean(open.any_day),
      });
      await db.PlannedMeal.update(open.id, row);
    }, "Saved");

  const swapDish = (recipe) =>
    run(async () => {
      const seat = Object.fromEntries(dinersOfMeal(open, members).map((member) => {
        const portion = (open.portions || []).find((item) => item.diner_id === member.id || item.diner_name === member.name);
        return [member.id, Number(portion?.servings) || 1];
      }));
      const row = plannedMealFor(withLibrarySwaps(recipe), seatedMembers(seat), open.scheduled_date, open.meal_type, {
        anyDay: Boolean(open.any_day),
      });
      await db.PlannedMeal.update(open.id, row);
      setSwapping(false);
    }, `Swapped to ${recipe.title}`);

  const move = ({ anyDay: isAny, date, type }) =>
    run(() => db.PlannedMeal.update(open.id, { any_day: isAny, scheduled_date: isAny ? monday : date, meal_type: type }));

  const addToGroceries = () =>
    run(async () => {
      const batch = batchOf(open) || { meals: [open], recipe_id: open.recipe_id, recipe_title: open.recipe_title, version_key: open.version_key };
      // The whole batch, counted once, minus what's already on the list, in the pantry or a staple.
      const fresh = planNeeds({ batches: [batch], recipes, items, staples: settings?.staples || [] });
      if (fresh.length) await db.GroceryItem.bulkCreate(fresh.map((need) => toGroceryItem(need, open.recipe_title)));
      await queryClient.invalidateQueries({ queryKey: ["grocery-items"] });
      toast.success(
        fresh.length
          ? `${fresh.length} ${fresh.length === 1 ? "item" : "items"} added for ${open.recipe_title}`
          : `Everything for ${open.recipe_title} is already on your list or in the pantry`,
      );
    });

  const cooked = () =>
    run(async () => {
      await logCooked(open.recipe_id, today, open.id);
      await db.PlannedMeal.update(open.id, { cooked_on: today });
      await queryClient.invalidateQueries({ queryKey: ["cook-log"] });
    }, "Logged. Your streak is counting.");

  const remove = () =>
    run(async () => {
      await db.PlannedMeal.delete(open.id);
      setOpenId(null);
    }, "Removed from the plan");

  const renderMeal = (meal) => {
    const diners = dinersOfMeal(meal, members);
    const batch = batchOf(meal);
    return (
      <li key={meal.id}>
        <MealCard
          meal={meal}
          diners={diners}
          statuses={statusesFor(meal, diners)}
          siblings={batch && batch.meals.length > 1 ? batch.meals.length - 1 : 0}
          onOpen={() => setOpenId(meal.id)}
        />
      </li>
    );
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-2 rounded-full bg-sand p-1">
        <button
          type="button"
          onClick={() => setOffset((value) => value - 1)}
          aria-label="Previous week"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-background"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="text-center">
          <p className="text-body font-semibold">{weekLabel(offset) || `Week of ${SHORT.format(parseISODate(monday))}`}</p>
          <p className="text-small text-ink-mid">
            {SHORT.format(parseISODate(monday))} – {SHORT.format(parseISODate(days[6]))}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOffset((value) => value + 1)}
          aria-label="Next week"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-background"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      {offset !== 0 ? (
        <button type="button" onClick={() => setOffset(0)} className="mt-1 h-11 w-full text-body font-medium text-primary">
          Back to this week
        </button>
      ) : null}

      <section className="mt-6" aria-labelledby="anyday-title">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="anyday-title" className="text-heading">
              Any day this week
            </h2>
            <p className="text-small text-ink-mid">Planned, not pinned to a day</p>
          </div>
          <button
            type="button"
            onClick={() => setAdding({ date: monday, anyDay: true })}
            aria-label="Add a dish for any day this week"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-sand"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {anyDay.length ? <ul className="mt-2 space-y-2">{anyDay.map(renderMeal)}</ul> : null}
      </section>

      {days.map((day) => {
        const dayMeals = dated.filter((meal) => meal.scheduled_date === day).sort(compareSlots);
        const isToday = day === today;
        const past = day < today;
        return (
          <section key={day} className={cn("mt-6 border-t border-border pt-4", past && "opacity-70")} aria-label={DAY_NAME.format(parseISODate(day))}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-heading">
                <span className={isToday ? "text-primary" : undefined}>{isToday ? "Today" : DAY_NAME.format(parseISODate(day))}</span>{" "}
                <span className="font-normal text-ink-mid">{SHORT.format(parseISODate(day))}</span>
              </h2>
              <button
                type="button"
                onClick={() => setAdding({ date: day, anyDay: false })}
                aria-label={`Add a dish on ${DAY_NAME.format(parseISODate(day))}`}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-sand"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {dayMeals.length ? (
              <ul className="mt-2 space-y-2">{dayMeals.map(renderMeal)}</ul>
            ) : (
              <p className="mt-1 text-small text-ink-mid">Nothing planned</p>
            )}
          </section>
        );
      })}

      <PickDishSheet
        open={Boolean(adding) && !swapping}
        onOpenChange={(value) => (value ? null : setAdding(null))}
        title={adding?.anyDay ? "Add for any day" : adding ? `Add to ${DAY_NAME.format(parseISODate(adding.date))}` : ""}
        description="Ranked by who it fits at your table."
        recipes={recipes}
        members={members}
        busy={busy}
        onPick={addMeal}
      />
      <PickDishSheet
        open={swapping}
        onOpenChange={setSwapping}
        title="Swap dish"
        description="Same day, same people. Ranked by who it fits."
        recipes={recipes}
        members={open ? dinersOfMeal(open, members) : members}
        busy={busy}
        showMeal={false}
        onPick={swapDish}
      />
      <MealSheet
        open={Boolean(open) && !swapping}
        onOpenChange={(value) => (value ? null : setOpenId(null))}
        meal={open}
        recipe={openRecipe ? withLibrarySwaps(openRecipe, open?.version_key) : null}
        members={members}
        siblings={open ? (batchOf(open)?.meals || []).filter((meal) => meal.id !== open.id) : []}
        weekDays={days}
        busy={busy}
        onSaveTable={saveTable}
        onSwapDish={() => setSwapping(true)}
        onMove={move}
        onGroceries={addToGroceries}
        onNote={(note) => run(() => db.PlannedMeal.update(open.id, { note }), "Note saved")}
        onCooked={cooked}
        onRemove={remove}
      />
    </AppShell>
  );
}

