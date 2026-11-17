import { Check, Trash2 } from "lucide-react";
import { combineItems, formatAmount } from "@/lib/mealMath";

export default function ShoppingList({ items = [], onCheck, onRemove, onClearHave }) {
  const toBuy = combineItems(items.filter((item) => item.status === "to_buy"));
  const have = items.filter((item) => item.status === "have");

  return (
    <section id="list" className="mt-9 scroll-mt-20">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-heading leading-tight">Shopping list</h2>
        <p className="num text-small text-ink-mid">
          {toBuy.length} {toBuy.length === 1 ? "item" : "items"} to buy
        </p>
      </div>

      {toBuy.length ? (
        <ul className="mt-1">
          {toBuy.map((item) => (
            <li key={item.key} className="flex items-center gap-3 border-t border-border py-2.5">
              <button
                type="button"
                onClick={() => onCheck(item.ids)}
                aria-label={`Mark ${item.label} as bought`}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink-mid text-transparent transition-colors hover:border-chili"
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </button>
              <span className="min-w-0 flex-1 text-body leading-tight">{item.label}</span>
              <span className="num shrink-0 text-small text-ink-mid">{formatAmount(item.qty, item.unit)}</span>
              <button
                type="button"
                onClick={() => onRemove(item.ids)}
                aria-label={`Remove ${item.label}`}
                className="p-1 text-ink-mid transition-colors hover:text-chili"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 border-t border-border py-3 text-body leading-relaxed text-ink-mid">
          Nothing on the list yet. Add a suggestion above, or plan a batch.
        </p>
      )}

      {have.length ? (
        <div className="mt-4 flex items-start justify-between gap-3 border-t border-border pt-3">
          <div>
            <p className="text-body font-medium">Already in the kitchen</p>
            <p className="mt-1 text-small leading-snug text-ink-mid">
              {have.map((item) => item.display_name).join(", ")}
            </p>
          </div>
          <button type="button" onClick={onClearHave} className="shrink-0 text-small font-medium text-ink-mid">
            Clear
          </button>
        </div>
      ) : null}
    </section>
  );
}