const METRICS = [
  { key: "kcal", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
  { key: "fiber", label: "Fiber", unit: "g" },
];

/**
 * Per-serving values for one version, in one block. A value the data does not
 * cover is written as unavailable rather than shown as a zero.
 */
export default function NutritionRow({ nutrition, basis = "Per serving", footnote }) {
  return (
    <div>
      <p className="text-[12.5px] text-ink-mid">{basis}</p>
      <dl className="mt-2">
        {METRICS.map((item) => {
          const value = nutrition?.[item.key];
          const known = Number.isFinite(Number(value)) && Number(value) > 0;
          return (
            <div key={item.key} className="flex items-baseline justify-between gap-4 border-t border-border py-2">
              <dt className="text-[13.5px] text-ink-soft">{item.label}</dt>
              <dd className="num text-[14px] font-medium">
                {known ? `${value} ${item.unit}` : "Unavailable"}
              </dd>
            </div>
          );
        })}
      </dl>
      {footnote ? <p className="mt-2 text-[12px] leading-snug text-ink-mid">{footnote}</p> : null}
    </div>
  );
}