export function NutritionInline({ nutrition }) {
  if (!nutrition?.kcal) return null;
  return (
    <p className="num text-[12px] text-ink-mid">
      {nutrition.kcal} kcal · {nutrition.protein ?? "n/a"} g protein · {nutrition.carbs ?? "n/a"} g carbs ·{" "}
      {nutrition.fat ?? "n/a"} g fat · {nutrition.fiber ? `${nutrition.fiber} g fiber` : "fiber n/a"}
    </p>
  );
}

export function Stat({ value, label }) {
  return (
    <div>
      <p className="num text-[17px] font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.12em] text-ink-faint">{label}</p>
    </div>
  );
}