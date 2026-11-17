import { AlertCircle } from "lucide-react";
import { SwapIcon } from "@/components/icons/AppIcons";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { formatAmount, swapsForIngredient } from "@/lib/mealMath";
import { ingredientImage } from "@/lib/ingredientImages";

/**
 * The ingredient list, also the swap control: ingredients with supported swaps
 * carry a cutout, a name, the scaled amount and a visible Swap label.
 */
export default function IngredientTable({
  ingredients = [],
  swaps = [],
  activeKeys = [],
  onOpenSwap,
  flashNames = [],
}) {
  if (!ingredients.length) {
    return <p className="py-3 text-[13px] text-ink-mid">No ingredients listed for this version yet.</p>;
  }

  return (
    <ul>
      {ingredients.map((ing) => {
        const source = ing.sourceName || ing.name;
        const options = swapsForIngredient(swaps, source);
        // The photo follows what will actually cook: after a swap, the new ingredient.
        const thumb = ingredientImage(ing.name) || ingredientImage(source);
        const swapped = Boolean(ing.swap);
        const flashing = flashNames.includes(ing.name);

        return (
          <li
            key={ing.key}
            className={cn(
              "border-t border-border py-3 transition-colors duration-300 motion-reduce:transition-none",
              flashing && "animate-flash motion-reduce:animate-none",
            )}
          >
            <div className="flex items-center gap-3">
              <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[9px] bg-card ring-1 ring-border">
                {thumb ? <Image src={thumb} alt="" className="h-full w-full object-cover" /> : null}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-snug">{ing.name}</p>
                {ing.scope ? (
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
                    {ing.scope.join(" · ")} only
                  </p>
                ) : null}
                {ing.note ? <p className="mt-0.5 text-[11.5px] leading-snug text-ink-faint">{ing.note}</p> : null}
                {Array.isArray(ing.allergens) && ing.allergens.length > 0 ? (
                  <p className="mt-1 flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-plum">
                    <AlertCircle className="h-3 w-3" strokeWidth={2.4} />
                    contains {ing.allergens.join(", ")}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className="num text-[13.5px] font-medium leading-tight">{formatAmount(ing.qty, ing.unit)}</span>
                {options.length ? (
                  <button
                    type="button"
                    onClick={() => onOpenSwap({ options, ingredient: ing })}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-[3px] text-[9px] font-semibold uppercase tracking-[0.1em] transition-colors duration-150 motion-reduce:transition-none",
                      swapped ? "border-chili text-chili" : "border-border text-ink-mid hover:border-ink-mid",
                    )}
                  >
                    <SwapIcon className="h-3 w-3" />
                    {swapped ? "Swapped" : "Swap"}
                  </button>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}