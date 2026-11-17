import { useState } from "react";
import { ClipboardCopy, Plus, RotateCcw, Share2, X } from "lucide-react";
import { db } from "@/api/db";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import Pill from "@/components/Pill";
import { addDays } from "@/lib/slots";
import { cn } from "@/lib/utils";

const sheetClass =
  "max-h-[92vh] overflow-y-auto rounded-t-3xl border-border bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6";

function Toggle({ on, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "h-11 rounded-full px-3 text-small font-medium",
        on ? "bg-status-swap-tint text-status-swap" : "bg-sand text-ink-soft",
      )}
    >
      {children}
    </button>
  );
}

/**
 * What's already in the kitchen. Marking something "use soon" or "leftover"
 * feeds the Use it up shortcut on Today.
 */
export function PantrySheet({ open, onOpenChange, items = [], staples = [], today, onChange }) {
  const [draft, setDraft] = useState("");
  const update = async (item, patch) => {
    await db.GroceryItem.update(item.id, patch);
    onChange();
  };
  const add = async (event) => {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    await db.GroceryItem.create({ name: name.toLowerCase(), display_name: name, quantity: 0, unit: "", status: "have", note: "" });
    setDraft("");
    onChange();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={sheetClass}>
        <SheetTitle className="pr-12 text-title">Pantry</SheetTitle>
        <SheetDescription className="mt-1 text-body text-ink-mid">
          What you already have. Mark things to use soon and Today will suggest dishes that use them.
        </SheetDescription>

        <form onSubmit={add} className="mt-4 flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add something you have"
            aria-label="Add a pantry item"
            className="h-12 min-w-0 flex-1 rounded-full bg-sand px-4 text-body outline-none placeholder:text-ink-mid focus-visible:ring-2 focus-visible:ring-primary"
          />
          <Pill type="submit" size="sm" variant="soft" disabled={!draft.trim()} aria-label="Add to pantry">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </Pill>
        </form>

        {items.length ? (
          <ul className="mt-3">
            {items.map((item) => {
              const name = item.display_name || item.name;
              return (
                <li key={item.id} className="border-t border-border py-3">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 text-body font-medium">{name}</span>
                    <button
                      type="button"
                      onClick={() => update(item, { status: "to_buy", use_soon: false, leftover: false })}
                      aria-label={`Put ${name} back on the list`}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-ink-mid hover:bg-sand"
                    >
                      <RotateCcw className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await db.GroceryItem.delete(item.id);
                        onChange();
                      }}
                      aria-label={`Used up ${name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-ink-mid hover:bg-sand"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Toggle on={Boolean(item.use_soon)} onClick={() => update(item, { use_soon: !item.use_soon })}>
                      Use soon
                    </Toggle>
                    <Toggle on={Boolean(item.leftover)} onClick={() => update(item, { leftover: !item.leftover })}>
                      Leftover
                    </Toggle>
                    {item.use_soon || item.leftover ? (
                      <label className="flex h-11 items-center gap-2 text-small text-ink-mid">
                        By
                        <input
                          type="date"
                          value={item.use_by || ""}
                          min={today}
                          max={addDays(today, 30)}
                          onChange={(event) => update(item, { use_by: event.target.value || null })}
                          className="h-11 rounded-full bg-sand px-3 text-small text-ink"
                        />
                      </label>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl bg-sand p-4 text-body text-ink-soft">
            Nothing here yet. Tick items off your list and they land in the pantry.
          </p>
        )}

        {staples.length ? (
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-body font-semibold">Staples you always have</p>
            <p className="mt-1 text-body text-ink-soft">{staples.join(", ")}</p>
            <p className="mt-1 text-small text-ink-mid">Change these in Profile, under In the kitchen.</p>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

// Real ordering needs each shop's partner programme. Until then these are
// labelled "coming soon" and nothing pretends to place an order.
const PROVIDERS = [
  { key: "instacart", name: "Instacart", region: "United States" },
  { key: "noon", name: "Noon", region: "United Arab Emirates" },
  { key: "carrefour", name: "Carrefour", region: "United Arab Emirates" },
];

export function OrderSheet({ open, onOpenChange, count, onCopy, onShare }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={sheetClass}>
        <SheetTitle className="pr-12 text-title">Order groceries</SheetTitle>
        <SheetDescription className="mt-1 text-body text-ink-mid">
          Sending your list straight to a shop isn’t ready yet. For now, copy or share the {count}{" "}
          {count === 1 ? "item" : "items"} and paste them into any delivery app.
        </SheetDescription>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Pill onClick={onCopy}>
            <ClipboardCopy className="h-5 w-5" aria-hidden="true" /> Copy list
          </Pill>
          <Pill variant="soft" onClick={onShare}>
            <Share2 className="h-5 w-5" aria-hidden="true" /> Share
          </Pill>
        </div>

        <p className="mt-6 text-small font-medium text-ink-mid">Shops</p>
        <ul className="mt-1">
          {PROVIDERS.map((provider) => (
            <li key={provider.key} className="flex min-h-[56px] items-center gap-3 border-t border-border">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sand text-body font-semibold" aria-hidden="true">
                {provider.name.charAt(0)}
              </span>
              <span className="flex-1">
                <span className="block text-body font-medium">{provider.name}</span>
                <span className="block text-small text-ink-mid">{provider.region}</span>
              </span>
              <span className="rounded-full bg-sand px-3 py-1 text-small font-medium text-ink-soft">Coming soon</span>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
