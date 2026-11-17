import { ChilliIcon } from "@/components/icons/FoodIcons";
import { cn } from "@/lib/utils";
import { heatLabel } from "@/lib/foodInfo";

/** One to three filled chillies plus the word, so heat is never colour alone. */
export default function HeatMeter({ level = 1, showLabel = true, className, tone = "inherit" }) {
  const count = Math.min(3, Math.max(1, Number(level) || 1));
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-[1px]">
        {[1, 2, 3].map((index) => (
          <ChilliIcon
            key={index}
            className={cn("h-[15px] w-[15px]", index > count && "opacity-30", tone === "ink" && "text-ink")}
          />
        ))}
      </span>
      {showLabel ? <span className="text-[11.5px] font-medium">{heatLabel(count)}</span> : null}
    </span>
  );
}