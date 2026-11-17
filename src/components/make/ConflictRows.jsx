import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/** Allergen and diet checks as icon plus label, so they can be scanned rather than read. */
export default function ConflictRows({ conflicts = [], missing = [] }) {
  if (!conflicts.length && !missing.length) return null;

  return (
    <div className="space-y-2">
      {conflicts.map((conflict, index) => (
        <div key={`${conflict.who}-${conflict.ingredient}-${index}`} className="flex items-start gap-2">
          <AlertTriangle
            className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", conflict.kind === "allergy" ? "text-chili" : "text-plum")}
            strokeWidth={2.2}
          />
          <p className="text-small leading-snug text-ink-soft">
            <span className="font-semibold text-ink">{conflict.who}</span> avoids {conflict.label} — {conflict.ingredient}{" "}
            is still in.
          </p>
        </div>
      ))}
      {missing.length ? (
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" strokeWidth={2.2} />
          <p className="text-small leading-snug text-ink-mid">
            No allergen info for {missing.slice(0, 3).join(", ")}
            {missing.length > 3 ? ` and ${missing.length - 3} more` : ""}.
          </p>
        </div>
      ) : null}
    </div>
  );
}