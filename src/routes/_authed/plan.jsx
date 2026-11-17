import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import AppShell from "@/components/AppShell";
import Pill from "@/components/Pill";
import { Image } from "@/components/ui/image";
import { ShoppingListIcon } from "@/components/icons/AppIcons";
import BatchGroup from "@/components/plan/BatchGroup";
import GrocerySuggestions from "@/components/plan/GrocerySuggestions";
import ShoppingList from "@/components/plan/ShoppingList";
import { base44 } from "@/api/base44Client";
import {
  membersOf,
  useGroceryItems,
  useHousehold,
  usePlannedMeals,
  useRecipes,
  useSavedVersions,
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
  const { data: items = [] } = useGroceryItems();
  const { data: saved = [] } = useSavedVersions();
  const { data: recipes = [] } = useRecipes();
  const { data: household } = useHousehold();
  const { user } = Route.useRouteContext();
  const [busy, setBusy] = useState(false);

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
  const toBuy = items.filter((item) => item.status === "to_buy").length;
  const inKitchen = items.filter((item) => item.status === "have").length;

  const refresh = () => queryClient.invalidateQueries();

  const resolve = async (suggestion, status) => {
    setBusy(true);
    try {
      await base44.entities.GroceryItem.create({
        name: suggestion.key,
        display_name: suggestion.name,
        quantity: status === "to_buy" ? suggestion.qty : 0,
        unit: status === "to_buy" ? suggestion.unit : "",
        status,
        note: suggestion.reason,
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const removeMeal = async (meal) => {
    await base44.entities.PlannedMeal.delete(meal.id);
    await refresh();
  };

  const checkItems = async (ids) => {
    await Promise.all(ids.map((id) => base44.entities.GroceryItem.update(id, { status: "have" })));
    await refresh();
  };

  const removeItems = async (ids) => {
    await Promise.all(ids.map((id) => base44.entities.GroceryItem.delete(id)));
    await refresh();
  };

  const clearHave = async () => {
    await base44.entities.GroceryItem.deleteMany({ status: "have" });
    await refresh();
  };

  const jumpToList = () => {
    document.getElementById("list")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

      <button
        type="button"
        onClick={jumpToList}
        className="mt-1 flex w-full items-center gap-3 border-y border-border py-3 text-left"
      >
        <ShoppingListIcon className="h-5 w-5 shrink-0 text-ink" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium leading-tight">Shopping list</span>
          <span className="mt-0.5 block text-[12.5px] text-ink-mid">
            {toBuy} to buy{inKitchen ? ` · ${inKitchen} already in the kitchen` : ""}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-ink-mid" strokeWidth={2} />
      </button>

      <section className="mt-7">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[19px] leading-tight">Next batches</h2>
          <p className="num text-[12.5px] text-ink-mid">
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
            <p className="text-[13px] leading-relaxed text-ink-mid">
              Nothing planned yet. Pick a dish and it lands here with its quantities.
            </p>
            <Pill as={Link} to="/recipes" variant="outline" size="sm" className="mt-3">
              Choose a dish
            </Pill>
          </div>
        )}
      </section>

      <GrocerySuggestions batches={batches} items={items} recipes={recipes} onResolve={resolve} busy={busy} />

      <ShoppingList items={items} onCheck={checkItems} onRemove={removeItems} onClearHave={clearHave} />
    </AppShell>
  );
}