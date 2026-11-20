import { Link } from "@tanstack/react-router";
import { Clock, RefreshCw } from "lucide-react";
import { Image } from "@/components/ui/image";
import Pill from "@/components/Pill";
import DinerAvatar from "@/components/table/DinerAvatar";
import FitBadge from "@/components/table/FitBadge";
import { formatServings } from "@/lib/allocations";
import { FIT } from "@/lib/fit";
import { cookMinutes } from "@/lib/suggest";
import { mealLabel } from "@/lib/slots";

function slotWords(slot, today) {
  if (slot.date === today) return slot.type === "dinner" ? "Tonight's table" : "Today's lunch table";
  return slot.type === "dinner" ? "Tomorrow night's table" : "Tomorrow's lunch table";
}

/** One line under the people that says what the swaps are, in plain words. */
function noteFor(table) {
  const notes = [];
  table.people.forEach(({ member, status, swaps, blockers, unknown }) => {
    if (status === FIT.SWAP) notes.push(`${member.name}: ${swaps.map((swap) => `${swap.to} for ${String(swap.ingredient || swap.from).toLowerCase()}`).join(", ")}`);
    if (status === FIT.CANT) notes.push(`${member.name} can't have ${blockers.slice(0, 2).join(" or ").toLowerCase()}`);
    if (status === FIT.CHECK) notes.push(`${member.name}: check ${unknown.slice(0, 2).join(", ").toLowerCase()}`);
  });
  return notes;
}

/**
 * The first thing on Today: who's eating, the dish, and how it lands for each
 * person. One primary action opens the batch adapted for exactly these people.
 */
export default function TonightsTable({ slot, today, recipe, diners, table, planned, portions, onPlan, onAnother, busy }) {
  if (!recipe) return null;
  const minutes = cookMinutes(recipe);
  const notes = noteFor(table);
  const showCheckNote = table.people.some((person) => person.status === FIT.CHECK || person.member.allergies?.length);

  return (
    <section aria-labelledby="tonight-title">
      <div className="flex items-baseline justify-between gap-3">
        <h1 id="tonight-title" className="text-display">
          {slotWords(slot, today)}
        </h1>
        {!planned ? <span className="shrink-0 text-small text-ink-mid">Suggested</span> : null}
      </div>

      <ul className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5" aria-label="Who's eating">
        {table.people.map(({ member, status }) => (
          <li key={member.id} className="flex w-[80px] shrink-0 flex-col items-center gap-1.5 text-center">
            <DinerAvatar member={member} size={52} />
            <span className="w-full truncate text-small font-medium text-ink">{member.name}</span>
            <FitBadge status={status} short />
          </li>
        ))}
      </ul>

      <Link
        to="/recipes/$recipeId"
        params={{ recipeId: recipe.id }}
        className="mt-5 block overflow-hidden rounded-3xl bg-sand"
      >
        {recipe.image_url ? (
          <Image src={recipe.image_url} alt={recipe.title} className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div className="aspect-[4/3] w-full" />
        )}
      </Link>

      <h2 className="mt-4 text-title">{recipe.title}</h2>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-body text-ink-mid">
        <span>{mealLabel(slot.type)}</span>
        <span aria-hidden="true">·</span>
        <span>
          {formatServings(portions)} {portions === 1 ? "portion" : "portions"} for {diners.length}
        </span>
        {minutes ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4" aria-hidden="true" /> {minutes} min
            </span>
          </>
        ) : null}
      </p>

      {notes.length ? (
        <ul className="mt-3 space-y-1 text-body text-ink-soft">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-body text-ink-soft">Everyone at the table can eat this as it is.</p>
      )}
      {showCheckNote ? <p className="mt-2 text-small text-ink-mid">Always check packet labels for allergens.</p> : null}

      {planned ? (
        <Pill
          as={Link}
          to="/recipes/$recipeId"
          params={{ recipeId: recipe.id }}
          search={{ diners: diners.map((member) => member.id).join(","), version: planned.version_key || undefined }}
          className="mt-5 w-full"
        >
          Cook for this table
        </Pill>
      ) : (
        <div className="mt-5 flex gap-2">
          <Pill onClick={onPlan} disabled={busy} className="flex-1">
            Plan it for {slot.type === "dinner" ? "tonight" : "lunch"}
          </Pill>
          <Pill variant="soft" onClick={onAnother} aria-label="Show another dish" className="w-[52px] shrink-0 px-0">
            <RefreshCw className="h-5 w-5" aria-hidden="true" />
          </Pill>
        </div>
      )}
    </section>
  );
}
