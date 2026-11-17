import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";
import Pill from "@/components/Pill";
import { Image } from "@/components/ui/image";
import BatchGroup from "@/components/plan/BatchGroup";
import { db } from "@/api/db";
import {
  membersOf,
  useHousehold,
  usePlannedMeals,
} from "@/hooks/useKitchen";
import { groupBatches } from "@/lib/batches";
import { findConflicts } from "@/lib/mealMath";
import { compareSlots, todayISO } from "@/lib/slots";

const TABLE_IMAGE =
  "https://media.base44.com/images/public/user_69a2598feae966a96d73f50c/75ab948da_330243485_generated_image.png";

export const Route = createFileRoute("/_authed/plan")({
  ssr: false,
  head: () => ({ meta: [{ title: "Plan · Rozana" }] }),
  component: PlanPage,
});

function PlanPage() {
  const queryClient = useQueryClient();
  const { data: meals = [] } = usePlannedMeals();
  const { data: household } = useHousehold();
  const { user } = Route.useRouteContext();

  const members = membersOf(household, user);
  const conflictsFor = (batch) => {
    const names = batch.meals[0]?.diner_names || [];
    const seated = members.filter((member) => names.includes(member.name));
    return findConflicts(batch.meals[0]?.ingredients || [], seated.length ? seated : members).conflicts;
  };

  const today = todayISO();
  const upcoming = useMemo(
    () => meals.filter((meal) => meal.scheduled_date >= today).sort(compareSlots),
    [meals, today],
  );
  const batches = useMemo(() => groupBatches(upcoming), [upcoming]);

  const refresh = () => queryClient.invalidateQueries();

  const removeMeal = async (meal) => {
    await db.PlannedMeal.delete(meal.id);
    await refresh();
  };

  return (
    <AppShell surface="paper">
      <div className="-mx-5 relative overflow-hidden bg-secondary">
        <Image
          src={TABLE_IMAGE}
          alt="A shared Indian table"
          className="h-[190px] w-full object-cover object-[center_62%]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-paper" />
      </div>

      <section className="mt-7">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-heading leading-tight">Next batches</h2>
          <p className="num text-small text-ink-mid">
            {batches.length} {batches.length === 1 ? "batch" : "batches"}
          </p>
        </div>

        {batches.length ? (
          <ul className="mt-1">
            {batches.map((batch) => (
              <BatchGroup key={batch.key} batch={batch} conflicts={conflictsFor(batch)} onRemove={removeMeal} />
            ))}
          </ul>
        ) : (
          <div className="mt-1 border-t border-border pt-3">
            <p className="text-body leading-relaxed text-ink-mid">
              Nothing planned yet. Pick a dish and it lands here with its quantities.
            </p>
            <Pill as={Link} to="/recipes" variant="outline" size="sm" className="mt-3">
              Choose a dish
            </Pill>
          </div>
        )}
      </section>

    </AppShell>
  );
}