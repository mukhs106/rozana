import { Link } from "@tanstack/react-router";
import { Check, ChevronRight, Minus, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Image } from "@/components/ui/image";
import Pill from "@/components/Pill";
import DinerAvatar from "@/components/table/DinerAvatar";
import FitBadge, { FitDots } from "@/components/table/FitBadge";
import { formatServings } from "@/lib/allocations";
import { FIT, fitForDiner, fitForTable } from "@/lib/fit";
import { cookMinutes } from "@/lib/suggest";
import { mealLabel, parseISODate } from "@/lib/slots";
import { cn } from "@/lib/utils";

const sheetClass =
  "max-h-[92vh] overflow-y-auto rounded-t-3xl border-border bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6";
const DAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric" });

function Segmented({ value, options, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-2">
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "h-11 flex-1 rounded-full text-body font-medium",
            value === key ? "bg-primary text-primary-foreground" : "bg-sand text-ink",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/**
 * Pick a dish: the library ranked by who it fits at this table. Used for "+"
 * on a day and for "Swap dish" on a meal.
 */
export function PickDishSheet({ open, onOpenChange, title, description, recipes, members, onPick, busy, showMeal = true }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("dinner");
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const ranked = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return recipes
      .filter((recipe) => words.every((word) => `${recipe.title} ${(recipe.tags || []).join(" ")}`.toLowerCase().includes(word)))
      .map((recipe) => ({ recipe, table: fitForTable(recipe, members) }))
      .sort((a, b) => a.table.cant - b.table.cant || b.table.fits - a.table.fits || a.table.swapCount - b.table.swapCount || a.recipe.title.localeCompare(b.recipe.title));
  }, [recipes, members, query]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={sheetClass}>
        <SheetTitle className="pr-12 text-title">{title}</SheetTitle>
        {description ? <SheetDescription className="mt-1 text-body text-ink-mid">{description}</SheetDescription> : null}
        {showMeal ? (
          <div className="mt-4">
            <Segmented value={type} onChange={setType} label="Meal" options={[["lunch", "Lunch"], ["dinner", "Dinner"]]} />
          </div>
        ) : null}
        <label className="mt-3 flex h-12 items-center gap-2 rounded-full bg-sand px-4">
          <Search className="h-5 w-5 text-ink-mid" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your recipes"
            aria-label="Search your recipes"
            className="w-full bg-transparent text-body outline-none placeholder:text-ink-mid"
          />
        </label>
        <ul className="mt-3">
          {ranked.map(({ recipe, table }) => (
            <li key={recipe.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => onPick(recipe, type)}
                className="flex min-h-[72px] w-full items-center gap-3 border-t border-border py-2 text-left disabled:opacity-50"
              >
                {recipe.image_url ? (
                  <Image src={recipe.image_url} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
                ) : (
                  <span className="h-14 w-14 shrink-0 rounded-2xl bg-sand" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-semibold">{recipe.title}</span>
                  <span className="flex flex-wrap items-center gap-x-2">
                    <FitDots table={table} />
                    {cookMinutes(recipe) ? <span className="text-small text-ink-mid">· {cookMinutes(recipe)} min</span> : null}
                  </span>
                </span>
                <Plus className="h-5 w-5 shrink-0 text-ink-mid" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

function PortionStepper({ value, onChange, name }) {
  const set = (next) => onChange(Math.min(4, Math.max(0.5, Math.round(next * 2) / 2)));
  return (
    <div className="inline-flex items-center rounded-full bg-sand">
      <button type="button" onClick={() => set(value - 0.5)} disabled={value <= 0.5} aria-label={`Smaller portion for ${name}`} className="flex h-11 w-11 items-center justify-center disabled:opacity-30">
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="num w-8 text-center text-body font-semibold">{formatServings(value)}</span>
      <button type="button" onClick={() => set(value + 0.5)} disabled={value >= 4} aria-label={`Bigger portion for ${name}`} className="flex h-11 w-11 items-center justify-center disabled:opacity-30">
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Everything you can do to one planned meal, in one sheet: who's eating and
 * how much, swap the dish, move it, add its batch to groceries, a note,
 * Cooked it, remove.
 */
export function MealSheet({
  open,
  onOpenChange,
  meal,
  recipe,
  members,
  siblings = [],
  weekDays = [],
  onSaveTable,
  onSwapDish,
  onMove,
  onGroceries,
  onNote,
  onCooked,
  onRemove,
  busy,
}) {
  const [seat, setSeat] = useState({});
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!open || !meal) return;
    const current = {};
    (meal.portions || []).forEach((portion) => {
      const member = members.find((item) => item.id === portion.diner_id) || members.find((item) => item.name === portion.diner_name);
      if (member) current[member.id] = Number(portion.servings) || 1;
    });
    setSeat(current);
    setNote(meal.note || "");
    setConfirming(false);
  }, [open, meal, members]);

  if (!meal) return null;
  const original = JSON.stringify(
    Object.fromEntries(
      (meal.portions || []).map((portion) => [
        (members.find((item) => item.id === portion.diner_id) || members.find((item) => item.name === portion.diner_name))?.id,
        Number(portion.servings) || 1,
      ]),
    ),
  );
  const changed = JSON.stringify(seat) !== original;
  const total = Object.values(seat).reduce((sum, value) => sum + value, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={sheetClass}>
        <div className="flex items-center gap-3 pr-12">
          {meal.image_url ? <Image src={meal.image_url} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" /> : null}
          <div className="min-w-0">
            <SheetTitle className="text-heading">{meal.recipe_title}</SheetTitle>
            <SheetDescription className="text-small text-ink-mid">
              {meal.any_day ? "Any day this week" : DAY.format(parseISODate(meal.scheduled_date))} · {mealLabel(meal.meal_type)} ·{" "}
              {formatServings(total)} {total === 1 ? "portion" : "portions"}
            </SheetDescription>
          </div>
        </div>
        {recipe ? (
          <Link
            to="/recipes/$recipeId"
            params={{ recipeId: recipe.id }}
            search={{ diners: Object.keys(seat).join(",") }}
            className="mt-3 flex h-11 items-center gap-1 text-body font-medium text-primary"
          >
            Open the recipe for this table <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
        {siblings.length ? (
          <p className="mt-1 rounded-2xl bg-sand p-3 text-small text-ink-soft">
            Cooked once, eaten {siblings.length + 1} times: also{" "}
            {siblings.map((item) => `${item.any_day ? "any day" : DAY.format(parseISODate(item.scheduled_date))} ${item.meal_type}`).join(", ")}.
          </p>
        ) : null}

        <h3 className="mt-5 text-heading">Who’s eating</h3>
        <ul className="mt-2">
          {members.map((member) => {
            const seated = seat[member.id] !== undefined;
            const status = recipe ? fitForDiner(recipe, member).status : null;
            return (
              <li key={member.id} className="flex min-h-[60px] items-center gap-3 border-t border-border py-2">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={seated}
                  onClick={() =>
                    setSeat((current) => {
                      const next = { ...current };
                      if (seated) delete next[member.id];
                      else next[member.id] = Number(member.portion) || 1;
                      return Object.keys(next).length ? next : current;
                    })
                  }
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2", seated ? "border-primary bg-primary text-primary-foreground" : "border-ink-mid")}>
                    {seated ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : null}
                  </span>
                  <DinerAvatar member={member} size={36} />
                  <span className="min-w-0">
                    <span className="block truncate text-body font-medium">{member.name}</span>
                    {status ? <FitBadge status={status} short /> : null}
                  </span>
                </button>
                {seated ? (
                  <PortionStepper value={seat[member.id]} name={member.name} onChange={(value) => setSeat((current) => ({ ...current, [member.id]: value }))} />
                ) : null}
              </li>
            );
          })}
        </ul>
        {changed ? (
          <Pill className="mt-3 w-full" disabled={busy} onClick={() => onSaveTable(seat)}>
            Save who’s eating
          </Pill>
        ) : null}
        {Object.keys(seat).some((id) => recipe && fitForDiner(recipe, members.find((item) => item.id === id)).status === FIT.CANT) ? (
          <p className="mt-2 text-small text-status-cant">Someone seated can’t eat this dish. Swap the dish or take them off this meal.</p>
        ) : null}

        <h3 className="mt-6 text-heading">Day</h3>
        <div className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1">
          <button
            type="button"
            onClick={() => onMove({ anyDay: true, date: weekDays[0], type: meal.meal_type })}
            aria-pressed={Boolean(meal.any_day)}
            className={cn("h-11 shrink-0 rounded-full px-4 text-body font-medium", meal.any_day ? "bg-primary text-primary-foreground" : "bg-sand")}
          >
            Any day
          </button>
          {weekDays.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => onMove({ anyDay: false, date: day, type: meal.meal_type })}
              aria-pressed={!meal.any_day && meal.scheduled_date === day}
              className={cn(
                "h-11 shrink-0 rounded-full px-4 text-body font-medium",
                !meal.any_day && meal.scheduled_date === day ? "bg-primary text-primary-foreground" : "bg-sand",
              )}
            >
              {DAY.format(parseISODate(day))}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <Segmented
            value={meal.meal_type}
            label="Meal"
            options={[["lunch", "Lunch"], ["dinner", "Dinner"]]}
            onChange={(type) => onMove({ anyDay: Boolean(meal.any_day), date: meal.scheduled_date, type })}
          />
        </div>

        <h3 className="mt-6 text-heading">Note</h3>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          placeholder="e.g. Make extra for Arjun’s tiffin"
          aria-label="Note for this meal"
          className="mt-2 w-full resize-none rounded-2xl bg-sand px-4 py-3 text-body outline-none placeholder:text-ink-mid focus-visible:ring-2 focus-visible:ring-primary"
        />
        {note !== (meal.note || "") ? (
          <Pill size="sm" variant="soft" className="mt-2" onClick={() => onNote(note)}>
            Save note
          </Pill>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Pill variant="soft" onClick={onSwapDish}>
            Swap dish
          </Pill>
          <Pill variant="soft" disabled={busy} onClick={onGroceries}>
            Add to groceries
          </Pill>
        </div>
        <Pill className="mt-2 w-full" disabled={busy || Boolean(meal.cooked_on)} onClick={onCooked}>
          <Check className="h-5 w-5" aria-hidden="true" /> {meal.cooked_on ? "Cooked" : "Cooked it"}
        </Pill>

        {confirming ? (
          <div className="mt-4 rounded-2xl border border-border p-4">
            <p className="text-body">Take {meal.recipe_title} off the plan{siblings.length ? " for this meal only" : ""}?</p>
            <div className="mt-3 flex gap-2">
              <Pill variant="soft" className="flex-1" onClick={() => setConfirming(false)}>
                Keep it
              </Pill>
              <Pill className="flex-1" disabled={busy} onClick={onRemove}>
                Remove
              </Pill>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="mt-4 h-11 text-body font-medium text-status-cant">
            Remove from plan
          </button>
        )}
      </SheetContent>
    </Sheet>
  );
}
