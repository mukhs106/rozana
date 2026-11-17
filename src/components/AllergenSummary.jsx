import { ALLERGEN_ICONS } from "@/components/icons/FoodIcons";
import { allergenLabel } from "@/lib/foodInfo";
import { cn } from "@/lib/utils";

/**
 * Ingredient marks always sit beside their word. A filled mark means the dish
 * contains it; a muted outlined row means we cannot say either way. Neither is
 * a safety sign-off.
 */
export function AllergenChip({ kind, label, muted = false, className }) {
  const Icon = ALLERGEN_ICONS[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-[3px] text-small font-medium",
        muted ? "border-border text-ink-mid" : "border-oxblood bg-oxblood text-field-paper",
        className,
      )}
    >
      {Icon ? <Icon className="h-[15px] w-[15px]" /> : null}
      {label || allergenLabel(kind)}
    </span>
  );
}

export default function AllergenSummary({ report, className }) {
  const { contains, rules, unknown } = report;
  if (!contains.length && !rules.length && !unknown.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {contains.map((kind) => (
        <AllergenChip key={kind} kind={kind} />
      ))}
      {rules.includes("oniongarlic") ? <AllergenChip kind="oniongarlic" label="Onion & garlic" /> : null}
      {report.none ? <AllergenChip kind="check" label="Check ingredients" muted /> : null}
      {report.partial ? <AllergenChip kind="check" label={`Check ingredients (${unknown.length})`} muted /> : null}
    </div>
  );
}