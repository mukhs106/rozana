import { formatAmount } from "@/lib/mealMath";
import { batchIngredients } from "@/lib/batches";

/**
 * Quantities per ingredient, counted once per batch. A dish cooked once and
 * eaten at dinner and lunch is one batch, not two, so it never claims an
 * ingredient twice.
 */
function buildSuggestions({ batches = [], items = [], recipes = [] }) {
  const handled = new Set(items.map((item) => (item.display_name || item.name || "").toLowerCase()));
  const found = new Map();

  batches.forEach((batch) => {
    const recipe = recipes.find((item) => item.id === batch.recipe_id);
    batchIngredients(batch, recipe).forEach((ingredient) => {
      const name = String(ingredient.name || "").trim();
      if (!name) return;
      const key = `${name.toLowerCase()}|${ingredient.unit || ""}`;
      const entry =
        found.get(key) || { key, name, unit: ingredient.unit, qty: 0, batches: new Set(), dishes: new Set() };
      entry.qty += Number(ingredient.qty) || 0;
      entry.batches.add(batch.key);
      entry.dishes.add(batch.recipe_title);
      found.set(key, entry);
    });
  });

  return Array.from(found.values())
    .filter((entry) => entry.batches.size > 1 && !handled.has(entry.name.toLowerCase()))
    .slice(0, 6)
    .map((entry) => ({
      key: entry.key,
      name: entry.name,
      qty: entry.qty,
      unit: entry.unit,
      reason: `Needed for ${entry.batches.size} upcoming batches`,
      detail: Array.from(entry.dishes).slice(0, 2).join(" · "),
    }));
}

export default function GrocerySuggestions({ batches, items, recipes, onResolve, busy }) {
  const suggestions = buildSuggestions({ batches, items, recipes });
  if (!suggestions.length) return null;

  return (
    <section className="mt-9">
      <h2 className="text-[19px] leading-tight">Suggested for your list</h2>
      <ul className="mt-1">
        {suggestions.map((suggestion) => (
          <li key={suggestion.key} className="border-t border-border py-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[15px] font-medium leading-tight">{suggestion.name}</p>
              {suggestion.qty ? (
                <span className="num shrink-0 text-[12.5px] text-ink-mid">
                  {formatAmount(suggestion.qty, suggestion.unit)}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[12.5px] leading-snug text-ink-mid">
              {suggestion.reason}
              {suggestion.detail ? ` · ${suggestion.detail}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => onResolve(suggestion, "to_buy")}
                className="rounded-full bg-chili px-3 py-1.5 text-[12px] font-medium text-chili-foreground disabled:opacity-40"
              >
                Add to list
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onResolve(suggestion, "have")}
                className="rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-ink-soft disabled:opacity-40"
              >
                Already have it
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onResolve(suggestion, "dismissed")}
                className="rounded-full px-2.5 py-1.5 text-[12px] font-medium text-ink-mid disabled:opacity-40"
              >
                Dismiss
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}