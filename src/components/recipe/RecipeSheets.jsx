import { Check, ChevronLeft, ChevronRight, Heart, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import Pill from "@/components/Pill";
import { addDays, parseISODate } from "@/lib/slots";
import { cn } from "@/lib/utils";

const sheetClass =
  "max-h-[92vh] overflow-y-auto rounded-t-3xl border-border bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6";

const DAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** Pick a day and a meal; the batch goes on the plan with this table and these swaps. */
export function AddToPlanSheet({ open, onOpenChange, today, onSave, busy, summary }) {
  const [date, setDate] = useState(today);
  const [type, setType] = useState("dinner");
  useEffect(() => {
    if (open) setDate(today);
  }, [open, today]);
  const days = Array.from({ length: 8 }, (_, index) => addDays(today, index));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={sheetClass}>
        <SheetTitle className="pr-12 text-title">Add to plan</SheetTitle>
        <SheetDescription className="mt-1 text-body text-ink-mid">{summary}</SheetDescription>

        <p className="mt-5 text-small font-medium text-ink-mid">Day</p>
        <div className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1">
          {days.map((day, index) => (
            <button
              key={day}
              type="button"
              onClick={() => setDate(day)}
              aria-pressed={date === day}
              className={cn(
                "h-11 shrink-0 rounded-full px-4 text-body font-medium",
                date === day ? "bg-primary text-primary-foreground" : "bg-sand text-ink",
              )}
            >
              {index === 0 ? "Today" : index === 1 ? "Tomorrow" : DAY.format(parseISODate(day))}
            </button>
          ))}
        </div>

        <p className="mt-5 text-small font-medium text-ink-mid">Meal</p>
        <div className="mt-2 flex gap-2">
          {["lunch", "dinner"].map((meal) => (
            <button
              key={meal}
              type="button"
              onClick={() => setType(meal)}
              aria-pressed={type === meal}
              className={cn(
                "h-11 flex-1 rounded-full text-body font-medium capitalize",
                type === meal ? "bg-primary text-primary-foreground" : "bg-sand text-ink",
              )}
            >
              {meal}
            </button>
          ))}
        </div>

        <Pill className="mt-6 w-full" disabled={busy} onClick={() => onSave(date, type)}>
          Add to plan
        </Pill>
      </SheetContent>
    </Sheet>
  );
}

/** Favourites and your own collections, each a toggle; plus a new one by name. */
export function SaveSheet({ open, onOpenChange, collections, favourite, onFavourite, onToggle, onCreate, recipeId }) {
  const [name, setName] = useState("");
  const own = collections.filter((item) => !item.automatic && item.system !== "favourites");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={sheetClass}>
        <SheetTitle className="pr-12 text-title">Save to a collection</SheetTitle>
        <SheetDescription className="mt-1 text-body text-ink-mid">Tap to add or take it out.</SheetDescription>

        <ul className="mt-4">
          <li>
            <button
              type="button"
              onClick={onFavourite}
              className="flex min-h-[52px] w-full items-center gap-3 border-t border-border py-2 text-left"
            >
              <Heart className={cn("h-5 w-5", favourite ? "fill-primary text-primary" : "text-ink-mid")} aria-hidden="true" />
              <span className="flex-1 text-body font-medium">Favourites</span>
              {favourite ? <Check className="h-5 w-5 text-primary" aria-label="Saved" /> : null}
            </button>
          </li>
          {own.map((item) => {
            const inside = (item.recipe_ids || []).includes(recipeId);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onToggle(item)}
                  className="flex min-h-[52px] w-full items-center gap-3 border-t border-border py-2 text-left"
                >
                  <span className="flex-1 text-body font-medium">{item.name}</span>
                  <span className="text-small text-ink-mid">{(item.recipe_ids || []).length}</span>
                  {inside ? <Check className="h-5 w-5 text-primary" aria-label="In this collection" /> : null}
                </button>
              </li>
            );
          })}
        </ul>

        <form
          className="mt-4 flex gap-2 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            onCreate(name);
            setName("");
          }}
        >
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New collection, e.g. Sunday lunch"
            aria-label="New collection name"
            className="h-12 min-w-0 flex-1 rounded-full bg-sand px-4 text-body outline-none placeholder:text-ink-mid focus-visible:ring-2 focus-visible:ring-primary"
          />
          <Pill type="submit" size="sm" variant="soft" disabled={!name.trim()} aria-label="Create collection">
            <Plus className="h-5 w-5" aria-hidden="true" />
          </Pill>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/** One step at a time in big text, with the batch's ingredients a tap away. */
export function CookModeSheet({ open, onOpenChange, title, steps = [], ingredients = [], onCooked, busy, notes = null }) {
  const [index, setIndex] = useState(-1);
  useEffect(() => {
    if (open) setIndex(-1);
  }, [open]);
  const last = steps.length - 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[100dvh] flex-col border-border bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
        <SheetTitle className="pr-12 text-heading">{title}</SheetTitle>
        <SheetDescription className="mt-1 text-small text-ink-mid">
          {index < 0 ? "Get these ready first" : `Step ${index + 1} of ${steps.length}`}
        </SheetDescription>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {notes}
          {index < 0 ? (
            <ul className="mt-3">
              {ingredients.map((row) => (
                <li key={row.key} className="flex items-baseline justify-between gap-3 border-t border-border py-2.5">
                  <span className="text-body">
                    {row.name}
                    {row.scopeText ? <span className="block text-small text-ink-mid">{row.scopeText}</span> : null}
                  </span>
                  <span className="num shrink-0 text-body font-medium">{row.amount}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-title font-normal leading-9">{steps[index]}</p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Pill
            variant="soft"
            onClick={() => setIndex((value) => Math.max(-1, value - 1))}
            disabled={index < 0}
            aria-label="Previous step"
            className="w-[52px] shrink-0 px-0"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Pill>
          {index < last ? (
            <Pill className="flex-1" onClick={() => setIndex((value) => value + 1)}>
              {index < 0 ? "Start cooking" : "Next step"} <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Pill>
          ) : (
            <Pill className="flex-1" disabled={busy} onClick={onCooked}>
              <Check className="h-5 w-5" aria-hidden="true" /> Cooked it
            </Pill>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
