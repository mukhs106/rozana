import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Pill from "@/components/Pill";
import { LunchboxIcon, PlateIcon, PortionIcon } from "@/components/icons/AppIcons";
import ConflictRows from "@/components/make/ConflictRows";
import { NutritionInline } from "@/components/recipe/SummaryBits";
import { formatAmount } from "@/lib/mealMath";
import { formatServings } from "@/lib/allocations";

/** The same meal visuals as the editor, showing what to cook, what to pack and which portion is swapped. */
export default function ReviewSheet({
  open,
  onOpenChange,
  recipe,
  versionName,
  meals = [],
  totalPortions,
  breakdown,
  ingredients = [],
  swaps = [],
  conflicts = [],
  missing = [],
  nutrition,
  saving,
  onSave,
  onSaveVersion,
}) {
  const hardConflicts = conflicts.filter((conflict) => conflict.kind === "allergy");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[430px] rounded-2xl border-border p-0">
        <div className="max-h-[82vh] overflow-y-auto px-5 pb-5 pt-6">
          <p className="eyebrow">Review batch</p>
          <DialogTitle className="mt-2 text-title font-semibold leading-tight tracking-[-0.02em]">
            {recipe?.title}
          </DialogTitle>
          <p className="mt-1 text-small text-ink-mid">{versionName}</p>

          <div className="mt-4 border-t border-border pt-3">
            <p className="num text-display font-semibold leading-none tracking-[-0.04em]">
              {formatServings(totalPortions)}
            </p>
            <p className="mt-1 text-small font-semibold uppercase tracking-[0.14em] text-ink-mid">
              servings total · {breakdown}
            </p>
          </div>

          <div className="mt-3">
            <p className="eyebrow">Where it goes</p>
            <ul className="mt-1">
              {meals.map((meal) => {
                const Icon = meal.type === "lunch" ? LunchboxIcon : PlateIcon;
                return (
                  <li key={meal.key} className="flex items-start gap-2.5 border-t border-border py-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink" />
                    <div className="min-w-0 flex-1">
                      <p className="text-small font-semibold leading-tight">{meal.label}</p>
                      <p className="text-small leading-snug text-ink-mid">
                        {meal.dinersLine} · pack {formatServings(meal.portions)}
                      </p>
                    </div>
                    <span className="num shrink-0 text-small text-ink-mid">{formatServings(meal.portions)}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <p className="eyebrow">What to cook</p>
            <ul className="mt-1.5 space-y-1">
              {ingredients.map((row) => (
                <li key={row.key} className="flex items-baseline justify-between gap-3 text-small">
                  <span className="text-ink-soft">
                    {row.name}
                    {row.scope ? (
                      <span className="ml-1.5 text-small font-semibold uppercase tracking-[0.1em] text-ink-faint">
                        {row.scope.join(" · ")}
                      </span>
                    ) : null}
                  </span>
                  <span className="num shrink-0 text-ink">{formatAmount(row.qty, row.unit)}</span>
                </li>
              ))}
            </ul>
          </div>

          {swaps.length ? (
            <div className="mt-4 border-t border-border pt-3">
              <p className="eyebrow">Swaps</p>
              <ul className="mt-1.5 space-y-1">
                {swaps.map((swap) => (
                  <li key={swap.key} className="text-small leading-snug text-ink-soft">
                    {swap.from} → {swap.to}
                    <span className="ml-1.5 text-small font-semibold uppercase tracking-[0.1em] text-ink-faint">
                      {swap.scopeLabel}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {nutrition ? (
            <div className="mt-4 border-t border-border pt-3">
              <p className="eyebrow">Whole batch</p>
              <div className="mt-1.5">
                <NutritionInline nutrition={nutrition} />
              </div>
            </div>
          ) : null}

          {hardConflicts.length ? (
            <div className="mt-4 rounded-[4px] bg-chili/[0.06] p-3">
              <p className="text-small font-semibold uppercase tracking-[0.12em] text-chili">Check before saving</p>
              <div className="mt-2">
                <ConflictRows conflicts={hardConflicts} />
              </div>
            </div>
          ) : null}

          {conflicts.some((conflict) => conflict.kind !== "allergy") || missing.length ? (
            <div className="mt-3 rounded-[4px] bg-black/[0.035] p-3">
              <p className="text-small font-semibold uppercase tracking-[0.12em] text-ink-mid">Worth knowing</p>
              <div className="mt-2">
                <ConflictRows
                  conflicts={conflicts.filter((conflict) => conflict.kind !== "allergy")}
                  missing={missing}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-5 space-y-2">
            <Pill className="w-full" onClick={onSave} disabled={saving || hardConflicts.length > 0}>
              <PortionIcon className="h-4 w-4" /> {saving ? "Saving" : "Save to plan"}
            </Pill>
            <Pill variant="outline" className="w-full" onClick={onSaveVersion} disabled={saving}>
              Save my version
            </Pill>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full py-1 text-small font-semibold uppercase tracking-[0.12em] text-ink-mid"
            >
              Keep editing
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}