import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { db } from "@/api/db";
import AppShell from "@/components/AppShell";
import Pill from "@/components/Pill";
import TonightsTable from "@/components/today/TonightsTable";
import { PlanWeekSheet, ShortcutListSheet, ShortcutRow } from "@/components/today/Shortcuts";
import Shelf from "@/components/today/Shelf";
import WeekStrip from "@/components/today/WeekStrip";
import StoryTeaser from "@/components/today/StoryTeaser";
import {
  membersOf,
  useCookLog,
  useGroceryItems,
  useHousehold,
  usePlannedMeals,
  useRecipes,
  useUserSettings,
} from "@/hooks/useKitchen";
import { mealPortions } from "@/lib/allocations";
import { dinersOfMeal, fitForTable } from "@/lib/fit";
import { plannedMealFor } from "@/lib/planWrite";
import {
  buildShelves,
  cookFromPantry,
  feedsEveryone,
  pantryOf,
  planWeek,
  rankUseItUp,
  itemsToUseSoon,
} from "@/lib/suggest";
import { nextSlot, todayISO } from "@/lib/slots";

export const Route = createFileRoute("/_authed/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Today · Rozana" }] }),
  component: TodayPage,
});

function TodayPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: recipes = [], isLoading } = useRecipes();
  const { data: meals = [] } = usePlannedMeals();
  const { data: household } = useHousehold();
  const { data: groceries = [] } = useGroceryItems();
  const { data: settings } = useUserSettings();
  const { data: cookLog = [] } = useCookLog();
  const [another, setAnother] = useState(0);
  const [sheet, setSheet] = useState(null);
  const [busy, setBusy] = useState(false);

  const today = todayISO();
  const slot = useMemo(() => nextSlot(), []);
  const members = membersOf(household, user);
  const pantry = useMemo(() => pantryOf(groceries, settings?.staples || []), [groceries, settings]);

  // Tonight: the planned meal for the next slot, or the best dish for everyone.
  const planned = meals.find((meal) => meal.scheduled_date === slot.date && meal.meal_type === slot.type) || null;
  const everyone = useMemo(() => feedsEveryone(recipes, members), [recipes, members]);
  const tonight = useMemo(() => {
    if (planned) {
      const recipe = recipes.find((item) => item.id === planned.recipe_id);
      const diners = dinersOfMeal(planned, members);
      const seated = diners.length ? diners : members;
      return recipe
        ? { recipe, diners: seated, table: fitForTable(recipe, seated, planned.version_key), portions: mealPortions(planned) }
        : null;
    }
    const pool = everyone.length
      ? everyone
      : recipes.map((recipe) => ({ recipe, table: fitForTable(recipe, members) })).sort((a, b) => b.table.canEat - a.table.canEat);
    const row = pool.length ? pool[another % pool.length] : null;
    if (!row) return null;
    const portions = members.reduce((total, member) => total + (Number(member.portion) || 1), 0);
    return { recipe: row.recipe, diners: members, table: row.table, portions };
  }, [planned, recipes, members, everyone, another]);

  const useSoon = useMemo(() => itemsToUseSoon(groceries, today), [groceries, today]);
  const lists = useMemo(
    () => ({
      pantry: cookFromPantry(recipes, members, pantry),
      everyone,
      useup: rankUseItUp(recipes, members, useSoon),
    }),
    [recipes, members, pantry, everyone, useSoon],
  );
  const draft = useMemo(
    () => planWeek({ recipes, members, meals, cookLog, pantry, today }),
    [recipes, members, meals, cookLog, pantry, today],
  );
  const shelves = useMemo(() => buildShelves(recipes, members), [recipes, members]);

  const hints = {
    week: draft.length ? `${draft.length} empty ${draft.length === 1 ? "night" : "nights"}` : "Week is full",
    pantry: lists.pantry.length
      ? `${lists.pantry.length} ${lists.pantry.length === 1 ? "dish" : "dishes"} to start`
      : "Mark what you have",
    everyone: `${lists.everyone.length} ${lists.everyone.length === 1 ? "dish" : "dishes"} for all ${members.length}`,
    useup: useSoon.length ? `${useSoon.length} ${useSoon.length === 1 ? "item" : "items"} to use` : "Nothing marked",
  };

  const save = async (rows, message) => {
    setBusy(true);
    try {
      await db.PlannedMeal.bulkCreate(rows);
      await queryClient.invalidateQueries({ queryKey: ["planned-meals"] });
      toast.success(message);
    } finally {
      setBusy(false);
    }
  };

  const planTonight = () =>
    tonight && save([plannedMealFor(tonight.recipe, members, slot.date, slot.type)], `${tonight.recipe.title} is on the plan`);

  const acceptWeek = async (picks) => {
    await save(
      picks.map(({ date, pick }) => plannedMealFor(pick.recipe, members, date, "dinner")),
      `${picks.length} ${picks.length === 1 ? "dinner" : "dinners"} added to your plan`,
    );
    setSheet(null);
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="animate-pulse motion-reduce:animate-none">
          <div className="h-8 w-2/3 rounded-full bg-sand" />
          <div className="mt-4 flex gap-3">
            {[0, 1, 2, 3].map((key) => (
              <div key={key} className="h-[52px] w-[52px] rounded-full bg-sand" />
            ))}
          </div>
          <div className="mt-5 aspect-[4/3] w-full rounded-3xl bg-sand" />
        </div>
      </AppShell>
    );
  }

  if (!recipes.length) {
    return (
      <AppShell>
        <h1 className="text-display">Start with a dish you already cook</h1>
        <p className="mt-2 text-body text-ink-mid">
          Add a recipe and Rozana works out how it lands for everyone at your table.
        </p>
        <Pill as={Link} to="/recipes/new" search={{ mode: "manual" }} className="mt-5 w-full">
          Add a recipe
        </Pill>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {tonight ? (
        <TonightsTable
          slot={slot}
          today={today}
          recipe={tonight.recipe}
          diners={tonight.diners}
          table={tonight.table}
          portions={tonight.portions}
          planned={planned}
          onPlan={planTonight}
          onAnother={() => setAnother((value) => value + 1)}
          busy={busy}
        />
      ) : null}

      <ShortcutRow hints={hints} onOpen={setSheet} />

      {shelves.slice(0, 5).map((shelf) => (
        <Shelf key={shelf.key} shelf={shelf} />
      ))}

      <WeekStrip meals={meals} today={today} />

      <StoryTeaser />

      <PlanWeekSheet
        draft={draft}
        open={sheet === "week"}
        onOpenChange={(open) => setSheet(open ? "week" : null)}
        onAccept={acceptWeek}
        busy={busy}
      />
      {["pantry", "everyone", "useup"].map((kind) => (
        <ShortcutListSheet
          key={kind}
          kind={kind}
          rows={lists[kind]}
          open={sheet === kind}
          onOpenChange={(open) => setSheet(open ? kind : null)}
        />
      ))}
    </AppShell>
  );
}
