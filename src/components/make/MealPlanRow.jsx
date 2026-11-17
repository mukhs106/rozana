import { ChevronRight } from "lucide-react";
import { LunchboxIcon, PlateIcon, SwapIcon } from "@/components/icons/AppIcons";
import { cn } from "@/lib/utils";
import { formatServings, mealPortions } from "@/lib/allocations";

/** One meal of the batch: where it goes, who eats it, how much, and the way in to edit portions. */
export default function MealPlanRow({ meal, label, dinersLine, swaps = [], flash = false, onEdit }) {
  const Icon = meal.type === "lunch" ? LunchboxIcon : PlateIcon;

  return (
    <button
      type="button"
      onClick={onEdit}
      className={cn(
        "flex w-full items-center gap-3 border-t border-border py-3 text-left transition-colors duration-150 motion-reduce:transition-none",
        flash && "animate-flash motion-reduce:animate-none",
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-black/[0.04] text-ink">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold leading-tight">{label}</span>
        <span className="mt-0.5 block truncate text-[11.5px] leading-snug text-ink-mid">{dinersLine}</span>
        {swaps.length ? (
          <span className="mt-1 inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-chili">
            <SwapIcon className="h-3 w-3" /> {swaps.join(", ")}
          </span>
        ) : null}
      </span>
      <span className="num shrink-0 text-[15px] font-semibold leading-none">{formatServings(mealPortions(meal))}</span>
      <span className="flex shrink-0 items-center gap-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
        Edit
        <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.4} />
      </span>
    </button>
  );
}