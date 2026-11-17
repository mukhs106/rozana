import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import AppShell from "@/components/AppShell";
import Pill from "@/components/Pill";
import CookingClip from "@/components/today/CookingClip";
import OpenSlotCard from "@/components/today/OpenSlotCard";
import PlannedMealCard from "@/components/today/PlannedMealCard";
import UpcomingList from "@/components/today/UpcomingList";
import { usePlannedMeals, useRecipes, useSavedVersions } from "@/hooks/useKitchen";
import { usePrefs } from "@/hooks/usePrefs";
import { groupBatches } from "@/lib/batches";
import { clipForToday } from "@/lib/clips";
import { compareSlots, nextSlot, todayISO } from "@/lib/slots";

export const Route = createFileRoute("/_authed/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Today · Rozana" }] }),
  component: TodayPage,
});

function TodayPage() {
  const { data: recipes = [], isLoading } = useRecipes();
  const { data: meals = [] } = usePlannedMeals();
  const { data: saved = [] } = useSavedVersions();
  const { prefs } = usePrefs();

  const today = todayISO();
  const slot = useMemo(() => nextSlot(), []);
  const upcoming = useMemo(
    () => meals.filter((meal) => meal.scheduled_date >= today).sort(compareSlots),
    [meals, today],
  );
  const batches = useMemo(() => groupBatches(upcoming), [upcoming]);

  const planned = upcoming.find((meal) => meal.scheduled_date === slot.date && meal.meal_type === slot.type);
  const currentBatch = planned ? batches.find((batch) => batch.meals.some((meal) => meal.id === planned.id)) : null;
  const siblings = currentBatch ? currentBatch.meals.filter((meal) => meal.id !== planned.id) : [];
  const later = batches.filter((batch) => !currentBatch || batch.key !== currentBatch.key).slice(0, 2);

  const featured = recipes[0];
  const savedFor = (recipeId) =>
    saved
      .filter((version) => version.recipe_id === recipeId)
      .sort((a, b) => String(b.created_date || "").localeCompare(String(a.created_date || "")));

  const clip = useMemo(() => clipForToday(), []);

  return (
    <AppShell>
      {isLoading ? (
        <div className="animate-pulse">
          <div className="-mx-5 h-[200px] w-[calc(100%+40px)] bg-secondary" />
          <div className="mt-4 h-8 w-2/3 rounded bg-secondary" />
          <div className="mt-2 h-3 w-1/2 rounded bg-secondary" />
          <div className="mt-4 h-12 w-full rounded-full bg-secondary" />
        </div>
      ) : planned ? (
        <PlannedMealCard meal={planned} siblings={siblings} />
      ) : featured ? (
        <OpenSlotCard recipe={featured} slot={slot} saved={savedFor(featured.id)} />
      ) : (
        <section className="border-t border-border pt-5">
          <h1 className="text-[28px] leading-tight">No dishes yet</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
            Add a recipe you already cook, or a link, and it will show up here.
          </p>
          <Pill as={Link} to="/recipes/new" search={{ mode: "link" }} className="mt-4 w-full">
            Add a recipe
          </Pill>
        </section>
      )}

      <UpcomingList batches={later} />

      <CookingClip clip={clip} autoplay={Boolean(prefs.autoplay)} />
    </AppShell>
  );
}