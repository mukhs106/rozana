import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AppShell from "@/components/AppShell";
import GrocerySuggestions from "@/components/plan/GrocerySuggestions";
import ShoppingList from "@/components/plan/ShoppingList";
import { db } from "@/api/db";
import { useGroceryItems, usePlannedMeals, useRecipes } from "@/hooks/useKitchen";
import { groupBatches } from "@/lib/batches";
import { compareSlots, todayISO } from "@/lib/slots";

export const Route = createFileRoute("/_authed/groceries")({
  ssr: false,
  head: () => ({ meta: [{ title: "Groceries · Rozana" }] }),
  component: GroceriesPage,
});

// Phase 1: the list moves to its own tab unchanged. Phase 4 rebuilds it
// (aisles, pantry, per-person extras, order sheet).
function GroceriesPage() {
  const queryClient = useQueryClient();
  const { data: meals = [] } = usePlannedMeals();
  const { data: items = [] } = useGroceryItems();
  const { data: recipes = [] } = useRecipes();
  const [busy, setBusy] = useState(false);

  const today = todayISO();
  const batches = useMemo(
    () => groupBatches(meals.filter((meal) => meal.scheduled_date >= today).sort(compareSlots)),
    [meals, today],
  );

  const refresh = () => queryClient.invalidateQueries();

  const resolve = async (suggestion, status) => {
    setBusy(true);
    try {
      await db.GroceryItem.create({
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

  const checkItems = async (ids) => {
    await Promise.all(ids.map((id) => db.GroceryItem.update(id, { status: "have" })));
    await refresh();
  };

  const removeItems = async (ids) => {
    await Promise.all(ids.map((id) => db.GroceryItem.delete(id)));
    await refresh();
  };

  const clearHave = async () => {
    await db.GroceryItem.deleteMany({ status: "have" });
    await refresh();
  };

  return (
    <AppShell>
      <h1 className="text-display">Groceries</h1>
      <p className="mt-1 text-body text-ink-mid">One list for everyone at the table.</p>
      <GrocerySuggestions batches={batches} items={items} recipes={recipes} onResolve={resolve} busy={busy} />
      <ShoppingList items={items} onCheck={checkItems} onRemove={removeItems} onClearHave={clearHave} />
    </AppShell>
  );
}
