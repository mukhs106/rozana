import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ClipboardCopy, MoreHorizontal, Package, Plus, Share2, ShoppingCart, Trash2, X } from "lucide-react";
import { db } from "@/api/db";
import AppShell from "@/components/AppShell";
import Pill from "@/components/Pill";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { OrderSheet, PantrySheet } from "@/components/groceries/GrocerySheets";
import { useGroceryItems, usePlannedMeals, useRecipes, useUserSettings } from "@/hooks/useKitchen";
import { groupBatches } from "@/lib/batches";
import { amountText, groupItems, listText, mergeToBuy, planNeeds, toGroceryItem } from "@/lib/groceries";
import { addDays, compareSlots, todayISO } from "@/lib/slots";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/groceries")({
  ssr: false,
  head: () => ({ meta: [{ title: "Groceries · Rozana" }] }),
  component: GroceriesPage,
});

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function GroceriesPage() {
  const queryClient = useQueryClient();
  const { data: meals = [] } = usePlannedMeals();
  const { data: items = [], isLoading } = useGroceryItems();
  const { data: recipes = [] } = useRecipes();
  const { data: settings } = useUserSettings();
  const [mode, setMode] = useState("aisle");
  const [draft, setDraft] = useState("");
  const [sheet, setSheet] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showNeeds, setShowNeeds] = useState(false);
  const [busy, setBusy] = useState(false);

  const today = todayISO();
  const units = settings?.units || "recipe";
  const staples = settings?.staples || [];
  const batches = useMemo(
    () =>
      groupBatches(
        meals.filter((meal) => meal.scheduled_date >= today && meal.scheduled_date <= addDays(today, 7)).sort(compareSlots),
      ),
    [meals, today],
  );
  const needs = useMemo(() => planNeeds({ batches, recipes, items, staples }), [batches, recipes, items, staples]);
  const toBuy = useMemo(() => mergeToBuy(items), [items]);
  const groups = groupItems(toBuy, mode);
  const pantry = items.filter((item) => item.status === "have");

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["grocery-items"] });
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

  const addByHand = (event) => {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    run(() => db.GroceryItem.create({ name: name.toLowerCase(), display_name: name, quantity: 0, unit: "", status: "to_buy", note: "" }));
    setDraft("");
  };
  const addNeeds = (list) =>
    run(() => db.GroceryItem.bulkCreate(list.map((need) => toGroceryItem(need))), `${list.length} ${list.length === 1 ? "item" : "items"} added from your plan`);
  const markHave = (need) => run(() => db.GroceryItem.create({ ...toGroceryItem(need), quantity: 0, status: "have" }));
  const bought = (row) => run(() => Promise.all(row.ids.map((id) => db.GroceryItem.update(id, { status: "have" }))));
  const remove = (row) => run(() => Promise.all(row.ids.map((id) => db.GroceryItem.delete(id))));
  const clearAll = () => run(() => db.GroceryItem.deleteMany({ status: "to_buy" }), "List cleared").then(() => setConfirmClear(false));

  const copyList = async () => {
    const ok = await copyText(listText(toBuy, units));
    toast[ok ? "success" : "error"](ok ? "List copied" : "Couldn't copy. Your browser blocked the clipboard.");
  };
  const shareList = async () => {
    const text = listText(toBuy, units);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Grocery list", text });
        return;
      } catch {
        /* closed the share sheet: nothing to do */
        return;
      }
    }
    copyList();
  };

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-display">Groceries</h1>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="More list actions"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-sand text-ink"
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1">
            <DropdownMenuItem className="min-h-11 gap-3 text-body" onSelect={() => setSheet("pantry")}>
              <Package className="h-5 w-5" aria-hidden="true" /> Pantry
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 gap-3 text-body" onSelect={copyList}>
              <ClipboardCopy className="h-5 w-5" aria-hidden="true" /> Copy list
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 gap-3 text-body" onSelect={shareList}>
              <Share2 className="h-5 w-5" aria-hidden="true" /> Share
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 gap-3 text-body text-status-cant" onSelect={() => setConfirmClear(true)}>
              <Trash2 className="h-5 w-5" aria-hidden="true" /> Clear all
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="mt-1 text-body text-ink-mid">One list for everyone at the table.</p>

      {confirmClear ? (
        <div className="mt-4 rounded-2xl border border-border p-4">
          <p className="text-body">Clear all {toBuy.length} items to buy? Your pantry stays as it is.</p>
          <div className="mt-3 flex gap-2">
            <Pill variant="soft" className="flex-1" onClick={() => setConfirmClear(false)}>
              Keep them
            </Pill>
            <Pill className="flex-1" disabled={busy} onClick={clearAll}>
              Clear list
            </Pill>
          </div>
        </div>
      ) : null}

      {needs.length ? (
        <section className="mt-5 rounded-2xl bg-sand p-4" aria-labelledby="needs-title">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="needs-title" className="text-heading">
                From your plan
              </h2>
              <p className="text-small text-ink-soft">
                {needs.length} {needs.length === 1 ? "thing" : "things"} this week’s batches need that aren’t on the list
              </p>
            </div>
            <Pill size="sm" disabled={busy} onClick={() => addNeeds(needs)} className="shrink-0">
              Add all
            </Pill>
          </div>
          <button
            type="button"
            onClick={() => setShowNeeds((open) => !open)}
            className="mt-1 h-11 text-body font-medium text-primary"
            aria-expanded={showNeeds}
          >
            {showNeeds ? "Hide the list" : "Choose one by one"}
          </button>
          {showNeeds ? (
            <ul>
              {needs.map((need) => (
                <li key={need.key} className="flex items-center gap-2 border-t border-border/80 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-body">
                      {need.forNames ? <span className="font-semibold text-primary">+ </span> : null}
                      {need.name}
                      {need.forNames ? <span className="text-primary"> for {need.forNames.join(" and ")}</span> : null}
                    </span>
                    <span className="block text-small text-ink-mid">
                      {[amountText(need, units), need.dishes.join(", ")].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => markHave(need)}
                    className="h-11 shrink-0 rounded-full px-3 text-small font-medium text-ink-soft"
                  >
                    Have it
                  </button>
                  <button
                    type="button"
                    onClick={() => addNeeds([need])}
                    aria-label={`Add ${need.name}`}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background"
                  >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <form onSubmit={addByHand} className="mt-5 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add an item, e.g. 1 kg atta"
          aria-label="Add an item"
          className="h-12 min-w-0 flex-1 rounded-full bg-sand px-4 text-body outline-none placeholder:text-ink-mid focus-visible:ring-2 focus-visible:ring-primary"
        />
        <Pill type="submit" size="sm" variant="soft" disabled={!draft.trim()} aria-label="Add item">
          <Plus className="h-5 w-5" aria-hidden="true" />
        </Pill>
      </form>

      <div role="tablist" aria-label="Sort the list" className="mt-5 grid grid-cols-2 rounded-full bg-sand p-1">
        {[
          ["aisle", "By aisle"],
          ["recipe", "By recipe"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={mode === key}
            onClick={() => setMode(key)}
            className={cn("h-11 rounded-full text-body font-medium", mode === key ? "bg-background shadow-sm" : "text-ink-mid")}
          >
            {label}
          </button>
        ))}
      </div>

      <section aria-label="To buy" className="mt-2">
        {isLoading ? null : groups.length ? (
          groups.map((group) => (
            <div key={group.key} className="mt-5">
              <h2 className="text-small font-semibold text-ink-mid">
                {group.label} · {group.rows.length}
              </h2>
              <ul className="mt-1">
                {group.rows.map((row) => (
                  <li key={row.key} className="flex min-h-[56px] items-center gap-2 border-t border-border">
                    <button
                      type="button"
                      onClick={() => bought(row)}
                      aria-label={`Bought ${row.name}`}
                      className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink-mid text-transparent group-hover:border-primary group-hover:text-primary">
                        <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                      </span>
                    </button>
                    <span className="min-w-0 flex-1 py-2">
                      <span className="block text-body">
                        {row.forNames ? (
                          <>
                            <span className="font-semibold text-primary">+{amountText(row, units) ? ` ${amountText(row, units)}` : ""} </span>
                            {row.name.toLowerCase()}
                            <span className="font-semibold text-primary"> for {row.forNames.join(" and ")}</span>
                          </>
                        ) : (
                          row.name
                        )}
                      </span>
                      {mode === "aisle" && row.recipes.length ? (
                        <span className="block text-small text-ink-mid">{row.recipes.join(", ")}</span>
                      ) : null}
                    </span>
                    {!row.forNames ? <span className="num shrink-0 text-body text-ink-soft">{amountText(row, units)}</span> : null}
                    <button
                      type="button"
                      onClick={() => remove(row)}
                      aria-label={`Remove ${row.name}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-mid hover:bg-sand"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="mt-6 rounded-2xl bg-sand p-4 text-body text-ink-soft">
            Nothing to buy. Add items by hand, or add what your plan needs.
          </p>
        )}
      </section>

      {pantry.length ? (
        <button
          type="button"
          onClick={() => setSheet("pantry")}
          className="mt-6 flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-border px-4 text-left"
        >
          <Package className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-body">
            In the pantry · {pantry.length} {pantry.length === 1 ? "item" : "items"}
          </span>
        </button>
      ) : null}

      <Pill className="mt-6 w-full" onClick={() => setSheet("order")} disabled={!toBuy.length}>
        <ShoppingCart className="h-5 w-5" aria-hidden="true" /> Order groceries
      </Pill>

      <PantrySheet
        open={sheet === "pantry"}
        onOpenChange={(open) => setSheet(open ? "pantry" : null)}
        items={pantry}
        staples={staples}
        today={today}
        onChange={refresh}
      />
      <OrderSheet
        open={sheet === "order"}
        onOpenChange={(open) => setSheet(open ? "order" : null)}
        count={toBuy.length}
        onCopy={copyList}
        onShare={shareList}
      />
    </AppShell>
  );
}
