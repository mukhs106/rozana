import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronRight, Package, RefreshCw, Users, Recycle } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Image } from "@/components/ui/image";
import Pill from "@/components/Pill";
import { FitDots } from "@/components/table/FitBadge";
import { blockedNames, cookMinutes } from "@/lib/suggest";
import { longDate } from "@/lib/slots";

export const SHORTCUTS = [
  { key: "week", title: "Plan my week", Icon: CalendarDays },
  { key: "pantry", title: "Cook from my pantry", Icon: Package },
  { key: "everyone", title: "Feeds everyone", Icon: Users },
  { key: "useup", title: "Use it up", Icon: Recycle },
];

/** The horizontal row of four shortcut tiles. `hints` is one short line per key. */
export function ShortcutRow({ hints = {}, onOpen }) {
  return (
    <section aria-labelledby="shortcuts-title" className="mt-10">
      <h2 id="shortcuts-title" className="text-title">
        Shortcuts
      </h2>
      <div className="-mx-5 mt-3 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-1">
        {SHORTCUTS.map(({ key, title, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onOpen(key)}
            className="flex w-[148px] shrink-0 snap-start flex-col items-start gap-3 rounded-2xl bg-sand p-4 text-left transition-colors hover:bg-sand/70"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background text-primary">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-body font-semibold leading-5">{title}</span>
              {hints[key] ? <span className="mt-1 block text-small text-ink-mid">{hints[key]}</span> : null}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ResultRow({ row, line }) {
  const minutes = cookMinutes(row.recipe);
  return (
    <li>
      <Link
        to="/recipes/$recipeId"
        params={{ recipeId: row.recipe.id }}
        className="flex min-h-[72px] items-center gap-3 border-t border-border py-3"
      >
        {row.recipe.image_url ? (
          <Image src={row.recipe.image_url} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
        ) : (
          <span className="h-16 w-16 shrink-0 rounded-2xl bg-sand" />
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-body font-semibold">{row.recipe.title}</span>
          {line ? <span className="block text-small text-ink-soft">{line}</span> : null}
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2">
            <FitDots table={row.table} />
            {minutes ? <span className="text-small text-ink-mid">· {minutes} min</span> : null}
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-ink-mid" aria-hidden="true" />
      </Link>
    </li>
  );
}

const COPY = {
  pantry: {
    title: "Cook from my pantry",
    intro: "Ranked by how much you already have. Your staples count; water and salt don't. Dishes everyone can eat come first.",
    empty: "Mark things as \"have\" on your grocery list and they'll count here.",
  },
  everyone: {
    title: "Feeds everyone",
    intro: "Dishes everyone at your table can eat, fewest swaps first.",
    empty: "Nothing in your library suits everyone yet. Try a recipe with swaps, or add one.",
  },
  useup: {
    title: "Use it up",
    intro: "Dishes that use what you've marked as leftover or use soon. Soonest dates count double. Dishes everyone can eat come first.",
    empty: "Nothing marked as leftover or use soon. Mark items in Groceries and they'll show up here.",
  },
};

function lineFor(key, row) {
  const blocked = blockedNames(row.table);
  const cant = blocked.length ? ` · ${blocked.join(" and ")} can't eat this` : "";
  return baseLine(key, row) + cant;
}

function baseLine(key, row) {
  if (key === "pantry") {
    const need = row.pantry.missing.slice(0, 3).join(", ").toLowerCase();
    return `You have ${row.pantry.have} of ${row.pantry.total}${need ? ` · need ${need}` : ""}`;
  }
  if (key === "useup") return `Uses ${row.used.map((item) => item.name.toLowerCase()).join(", ")}`;
  if (key === "everyone") {
    return row.table.swapCount
      ? `Everyone can eat it with ${row.table.swapCount} ${row.table.swapCount === 1 ? "swap" : "swaps"}`
      : "Everyone can eat it as it is";
  }
  return "";
}

/** The sheet for Pantry, Feeds everyone and Use it up: a ranked list. */
export function ShortcutListSheet({ kind, rows = [], open, onOpenChange }) {
  const copy = COPY[kind] || COPY.everyone;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[88vh] overflow-y-auto rounded-t-3xl border-border bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6"
      >
        <SheetTitle className="pr-12 text-title">{copy.title}</SheetTitle>
        <SheetDescription className="mt-1 text-body text-ink-mid">{copy.intro}</SheetDescription>
        {rows.length ? (
          <ul className="mt-4">
            {rows.slice(0, 12).map((row) => (
              <ResultRow key={row.recipe.id} row={row} line={lineFor(kind, row)} />
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl bg-sand p-4 text-body text-ink-soft">{copy.empty}</p>
        )}
      </SheetContent>
    </Sheet>
  );
}

/**
 * Plan my week: a draft you can change day by day. Nothing is saved until
 * "Add to plan".
 */
export function PlanWeekSheet({ draft = [], open, onOpenChange, onAccept, busy }) {
  const [choice, setChoice] = useState({});

  const pickFor = (day) => {
    const options = [day.pick, ...day.alternatives].filter(Boolean);
    return options[(choice[day.date] || 0) % Math.max(options.length, 1)] || null;
  };
  const next = (day) => setChoice((current) => ({ ...current, [day.date]: (current[day.date] || 0) + 1 }));
  const picks = draft.map((day) => ({ date: day.date, pick: pickFor(day) })).filter((day) => day.pick);

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        if (!value) setChoice({});
        onOpenChange(value);
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[92vh] overflow-y-auto rounded-t-3xl border-border bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6"
      >
        <SheetTitle className="pr-12 text-title">Plan my week</SheetTitle>
        <SheetDescription className="mt-1 text-body text-ink-mid">
          A draft for the empty dinners, scored on who it fits, fewest swaps, cook time and variety. Change any
          day, then add it to your plan.
        </SheetDescription>

        {draft.length ? (
          <ul className="mt-4">
            {draft.map((day) => {
              const pick = pickFor(day);
              return (
                <li key={day.date} className="border-t border-border py-3">
                  <p className="text-small font-semibold text-ink-mid">{longDate(day.date)}</p>
                  {pick ? (
                    <div className="mt-2 flex items-center gap-3">
                      {pick.recipe.image_url ? (
                        <Image src={pick.recipe.image_url} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                      ) : (
                        <span className="h-16 w-16 shrink-0 rounded-2xl bg-sand" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-semibold">{pick.recipe.title}</p>
                        <p className="text-small text-ink-soft">{pick.why.join(" · ")}</p>
                        <FitDots table={pick.table} className="mt-0.5" />
                      </div>
                      <button
                        type="button"
                        onClick={() => next(day)}
                        aria-label={`Show another dish for ${longDate(day.date)}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sand text-ink"
                      >
                        <RefreshCw className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-body text-ink-mid">Nothing left in your library for this day.</p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl bg-sand p-4 text-body text-ink-soft">
            Every dinner this week is already planned.
          </p>
        )}

        {picks.length ? (
          <Pill className="mt-5 w-full" disabled={busy} onClick={() => onAccept(picks)}>
            Add {picks.length} {picks.length === 1 ? "dinner" : "dinners"} to the plan
          </Pill>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
