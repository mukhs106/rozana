import { Link } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import DinerAvatar from "@/components/table/DinerAvatar";
import FitBadge from "@/components/table/FitBadge";
import Pill from "@/components/Pill";
import { formatServings } from "@/lib/allocations";
import { FIT } from "@/lib/fit";
import { isSplittable } from "@/lib/table";
import { cn } from "@/lib/utils";

function PortionStepper({ value, onChange, name }) {
  const set = (next) => onChange(Math.min(4, Math.max(0.5, Math.round(next * 2) / 2)));
  return (
    <div className="inline-flex items-center rounded-full bg-sand">
      <button
        type="button"
        onClick={() => set(value - 0.5)}
        disabled={value <= 0.5}
        aria-label={`Smaller portion for ${name}`}
        className="flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-30"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="num w-9 text-center text-body font-semibold">{formatServings(value)}</span>
      <button
        type="button"
        onClick={() => set(value + 0.5)}
        disabled={value >= 4}
        aria-label={`Bigger portion for ${name}`}
        className="flex h-11 w-11 items-center justify-center rounded-full disabled:opacity-30"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function swapLine(swap) {
  return `${swap.to} instead of ${String(swap.ingredient || swap.from).toLowerCase()}`;
}

/**
 * Each person at the table with their portion and their swaps, above the
 * ingredients, with the batch maths written out underneath.
 */
export default function AtTheTable({
  members,
  seatedIds,
  onToggleSeat,
  rows,
  chosen,
  onToggleSwap,
  onFitAll,
  onPortion,
  maths,
  recipeId,
  cantFor = () => false,
}) {
  const unseated = members.filter((member) => !seatedIds.includes(member.id));
  const needsAny = rows.some((row) => row.needed.length && !row.fixedBy);
  const anyAllergy = rows.some((row) => row.member.allergies?.length || row.fit.status === FIT.CHECK);

  return (
    <section aria-labelledby="table-title" className="mt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 id="table-title" className="text-title">
          At the table
        </h2>
        {needsAny ? (
          <Pill size="sm" onClick={onFitAll}>
            Fit to my table
          </Pill>
        ) : null}
      </div>
      <p className="mt-1 text-body text-ink-mid">One batch, each plate its own way.</p>

      <ul className="mt-3 space-y-3">
        {rows.map((row) => {
          const { member, fit } = row;
          const status = row.fixedBy ? FIT.FITS : fit.status;
          return (
            <li key={member.id} className="rounded-2xl bg-sand/60 p-4">
              <div className="flex items-center gap-3">
                <DinerAvatar member={member} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold">{member.name}</p>
                  <FitBadge status={status} label={row.fixedBy ? "Fits with swap" : undefined} className="mt-0.5" />
                </div>
                <PortionStepper value={row.portion} name={member.name} onChange={(value) => onPortion(member.id, value)} />
              </div>

              {fit.swaps.filter((swap) => swap.kind !== "version").map((swap) => {
                const on = chosen.includes(swap.key);
                return (
                  <label key={swap.key} className="mt-3 flex min-h-[44px] items-center gap-3 border-t border-border pt-3">
                    <span className="min-w-0 flex-1">
                      <span className="block text-body">{swapLine(swap)}</span>
                      <span className="block text-small text-ink-mid">
                        {isSplittable(swap) ? `Just ${member.name}'s portion` : "Changes the whole pot"}
                      </span>
                    </span>
                    <Switch checked={on} onCheckedChange={() => onToggleSwap(swap.key)} aria-label={swapLine(swap)} />
                  </label>
                );
              })}

              {fit.status === FIT.CANT ? (
                <p className="mt-3 border-t border-border pt-3 text-body text-status-cant">
                  No swap covers {fit.blockers.slice(0, 3).join(", ").toLowerCase()} for {member.name}.
                </p>
              ) : null}
              {fit.status === FIT.CHECK ? (
                <p className="mt-3 border-t border-border pt-3 text-body text-ink-soft">
                  Nobody has recorded what’s in {fit.unknown.slice(0, 3).join(", ").toLowerCase()}. Check the labels
                  for {member.name}.
                </p>
              ) : null}
              {fit.dislikes.length ? (
                <p className="mt-2 text-small text-ink-mid">
                  {member.name} doesn’t like {fit.dislikes.join(", ").toLowerCase()}.
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => onToggleSeat(member.id)}
                className="mt-2 flex h-11 items-center text-small font-medium text-ink-mid underline-offset-4 hover:underline"
              >
                Not eating this time
              </button>
            </li>
          );
        })}
      </ul>

      {unseated.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {unseated.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => onToggleSeat(member.id)}
              className="flex h-11 items-center gap-2 rounded-full border border-border pl-1.5 pr-4 text-body"
            >
              <DinerAvatar member={member} size={32} /> Add {member.name}
              {rows.length && cantFor(member) ? <span className="text-small text-status-cant">· can’t eat this</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-border p-4">
        <p className="text-small font-medium text-ink-mid">The batch</p>
        <p className="num mt-1 text-body">{maths.sum}</p>
        {maths.scale ? <p className="mt-1 text-small text-ink-mid">{maths.scale}</p> : null}
      </div>

      {anyAllergy ? (
        <p className="mt-3 text-small text-ink-mid">
          Always check packet labels for allergens.{" "}
          <Link to="/info/$topic" params={{ topic: "how-checks-work" }} className="font-medium text-primary underline">
            How checks work
          </Link>
        </p>
      ) : null}

      <Link
        to="/make/$recipeId"
        params={{ recipeId }}
        search={{ diners: rows.map((row) => row.member.id).join(",") }}
        className={cn("mt-2 flex h-11 items-center text-body font-medium text-primary")}
      >
        Split this batch across several meals
      </Link>
    </section>
  );
}
