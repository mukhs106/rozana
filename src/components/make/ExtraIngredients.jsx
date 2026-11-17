import { useState } from "react";
import { Plus, X } from "lucide-react";
import Pill from "@/components/Pill";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatAmount } from "@/lib/mealMath";

const IDEAS = [
  { name: "Moringa powder", qty: 1, unit: "tsp", note: "Green, barely tastes of anything, adds iron and calcium." },
  { name: "Flaxseed powder", qty: 1, unit: "tbsp", note: "Fibre and omega-3, stirred in at the end." },
  { name: "Hemp seeds", qty: 1, unit: "tbsp", note: "Extra protein, sprinkled on before serving." },
];

const UNITS = ["tsp", "tbsp", "g", "ml", "pinch"];

/** Additions that are not in the recipe: nutrition powders, seeds, a handful of greens. */
export default function ExtraIngredients({ items = [], onAdd, onRemove }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("tsp");

  const reset = () => {
    setName("");
    setAmount("");
    setUnit("tsp");
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const qty = Number(amount);
    onAdd({ name: trimmed, qty: Number.isFinite(qty) && qty > 0 ? qty : null, unit: amount ? unit : null });
    reset();
    setOpen(false);
  };

  const pickIdea = (idea) => {
    setName(idea.name);
    setAmount(String(idea.qty));
    setUnit(idea.unit);
  };

  return (
    <div className="mt-1">
      {items.map((item, index) => (
        <div key={`${item.name}-${index}`} className="flex items-center gap-3 border-t border-border py-3">
          <div className="min-w-0 flex-1">
            <p className="text-body leading-snug">{item.name}</p>
            <p className="mt-0.5 text-small font-semibold uppercase tracking-[0.1em] text-ink-faint">added</p>
          </div>
          {item.qty ? (
            <span className="num shrink-0 text-body font-medium leading-tight">
              {formatAmount(item.qty, item.unit)}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onRemove(index)}
            aria-label={`Remove ${item.name}`}
            className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint hover:text-ink"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 inline-flex items-center gap-1.5 border-t border-border py-2.5 text-small font-semibold uppercase tracking-[0.14em] text-chili"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.6} /> Add ingredient
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-border bg-background px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5"
        >
          <SheetTitle className="text-heading font-semibold tracking-[-0.01em]">Add an ingredient</SheetTitle>
          <SheetDescription className="mt-1 text-small leading-snug text-ink-mid">
            Anything this batch needs beyond the recipe. It goes into the saved version and the shopping list.
          </SheetDescription>

          <label className="mt-4 block">
            <span className="eyebrow">Ingredient</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Moringa powder"
              className="mt-1.5 h-11 w-full rounded-[4px] border border-black/15 bg-background px-3 text-body text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none"
            />
          </label>

          <div className="mt-3 grid grid-cols-[1fr_1fr] gap-2">
            <label className="block">
              <span className="eyebrow">Amount</span>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                inputMode="decimal"
                placeholder="1"
                className="num mt-1.5 h-11 w-full rounded-[4px] border border-black/15 bg-background px-3 text-body focus:border-ink focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="eyebrow">Unit</span>
              <select
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-[4px] border border-black/15 bg-background px-2 text-body focus:border-ink focus:outline-none"
              >
                {UNITS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {IDEAS.map((idea) => (
              <button
                key={idea.name}
                type="button"
                onClick={() => pickIdea(idea)}
                className="rounded-full border border-black/15 px-3 py-1.5 text-small font-medium text-ink-soft hover:border-black/35"
              >
                {idea.name}
              </button>
            ))}
          </div>
          <p className="mt-2 text-small leading-snug text-ink-faint">
            {IDEAS.find((idea) => idea.name === name)?.note || "No allergen is assumed for what you add."}
          </p>

          <Pill className="mt-4 w-full" onClick={submit} disabled={!name.trim()}>
            Add to this batch
          </Pill>
        </SheetContent>
      </Sheet>
    </div>
  );
}