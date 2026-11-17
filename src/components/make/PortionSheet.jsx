import { Minus, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatServings, mealPortions } from "@/lib/allocations";

/** Per-diner servings for one meal, so 1.5 stays tied to the person it belongs to. */
export default function PortionSheet({
  open,
  onOpenChange,
  title,
  meal,
  date,
  onDate,
  diners = [],
  onChange,
  onReset,
}) {
  const step = (id, current, delta) => {
    const next = Math.min(6, Math.max(0.5, Math.round((current + delta) * 2) / 2));
    onChange(id, next);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-border bg-background px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5"
      >
        <SheetTitle className="text-[19px] font-semibold tracking-[-0.01em]">{title}</SheetTitle>
        <SheetDescription className="mt-1 text-[12px] leading-snug text-ink-mid">
          Half steps are fine — 1.5 for a bigger appetite.
        </SheetDescription>

        {onDate ? (
          <label className="mt-4 flex items-center justify-between border-t border-border py-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-mid">Date</span>
            <input
              type="date"
              value={date || ""}
              onChange={(event) => onDate(event.target.value)}
              className="num rounded-[4px] border border-black/15 px-2 py-1 text-[12px] text-ink"
            />
          </label>
        ) : null}

        <ul className="mt-1">
          {diners.map((diner) => {
            const value = Number(meal?.portions?.[diner.id] ?? 1);
            return (
              <li key={diner.id} className="flex items-center justify-between border-t border-border py-3">
                <span className="text-[14px] font-medium">{diner.name}</span>
                <span className="inline-flex items-center rounded-full border border-black/15">
                  <button
                    type="button"
                    onClick={() => step(diner.id, value, -0.5)}
                    disabled={value <= 0.5}
                    aria-label={`Less for ${diner.name}`}
                    className="flex h-8 w-8 items-center justify-center text-ink disabled:opacity-25"
                  >
                    <Minus className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </button>
                  <span className="num min-w-[2.75rem] text-center text-[13px] font-semibold">
                    {formatServings(value)}
                  </span>
                  <button
                    type="button"
                    onClick={() => step(diner.id, value, 0.5)}
                    disabled={value >= 6}
                    aria-label={`More for ${diner.name}`}
                    className="flex h-8 w-8 items-center justify-center text-ink disabled:opacity-25"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-2 flex items-baseline justify-between border-t border-border pt-3">
          <span className="eyebrow">This meal</span>
          <span className="num text-[16px] font-semibold">{formatServings(mealPortions(meal))} servings</span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-chili"
        >
          1× for everyone
        </button>
      </SheetContent>
    </Sheet>
  );
}