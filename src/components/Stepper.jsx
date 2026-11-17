import { Minus, Plus } from "lucide-react";

/** "portion" → "portions", and "servings" stays "servings" rather than "servingss". */
function pluralize(unit) {
  if (!unit) return "";
  return unit.endsWith("s") ? unit : `${unit}s`;
}

export default function Stepper({ value, onChange, min = 1, max = 12, step = 1, unit = "portion", className = "" }) {
  const set = (next) => onChange(Math.min(max, Math.max(min, Math.round(next * 100) / 100)));
  const label = value === 1 ? unit : pluralize(unit);

  return (
    <div className={`inline-flex items-center rounded-full border border-border ${className}`}>
      <button
        type="button"
        onClick={() => set(value - step)}
        disabled={value <= min}
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-opacity disabled:opacity-25"
        aria-label={`Fewer ${pluralize(unit)}`}
      >
        <Minus className="h-4 w-4" strokeWidth={2} />
      </button>
      <span className="num min-w-[4.25rem] text-center text-body font-semibold">
        {Number.isInteger(value) ? value : value.toFixed(2).replace(/0$/, "")}
        <span className="ml-1 text-small font-normal text-ink-mid">{label}</span>
      </span>
      <button
        type="button"
        onClick={() => set(value + step)}
        disabled={value >= max}
        className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-opacity disabled:opacity-25"
        aria-label={`More ${pluralize(unit)}`}
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}