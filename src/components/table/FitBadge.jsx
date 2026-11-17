import { ArrowLeftRight, Ban, Check, CircleHelp } from "lucide-react";
import { FIT, FIT_LABELS } from "@/lib/fit";
import { cn } from "@/lib/utils";

const STYLES = {
  [FIT.FITS]: { Icon: Check, className: "bg-status-fit-tint text-status-fit" },
  [FIT.SWAP]: { Icon: ArrowLeftRight, className: "bg-status-swap-tint text-status-swap" },
  [FIT.CHECK]: { Icon: CircleHelp, className: "bg-status-swap-tint text-status-swap" },
  [FIT.CANT]: { Icon: Ban, className: "bg-status-cant-tint text-status-cant" },
};

const SHORT = { [FIT.FITS]: "Fits", [FIT.SWAP]: "Swap", [FIT.CHECK]: "Check", [FIT.CANT]: "Can't eat" };

/** One person's verdict: always an icon and a word, never colour alone. */
export default function FitBadge({ status, className, short = false }) {
  const style = STYLES[status] || STYLES[FIT.CHECK];
  const label = short ? SHORT[status] : FIT_LABELS[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-small font-medium", style.className, className)}>
      <style.Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.4} aria-hidden="true" />
      {label}
    </span>
  );
}

/** Tiny "fits 3 of 4" line for cards: a dot per person, then the words. */
export function FitDots({ table, className }) {
  if (!table?.total) return null;
  const dot = { fits: "bg-status-fit", swap: "bg-status-swap", check: "bg-status-swap", cant: "bg-status-cant" };
  const words =
    table.fits === table.total ? `Fits all ${table.total}` : `Fits ${table.fits} of ${table.total}`;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-small text-ink-mid", className)}>
      <span className="flex gap-0.5" aria-hidden="true">
        {table.people.map((person) => (
          <span key={person.member.id} className={cn("h-2 w-2 rounded-full", dot[person.status])} />
        ))}
      </span>
      {words}
    </span>
  );
}
