import { useEffect, useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import Pill from "@/components/Pill";
import { LANGUAGES } from "@/lib/settings";
import { UNIT_SYSTEMS } from "@/lib/units";
import { cn } from "@/lib/utils";

const sheetClass =
  "max-h-[92vh] overflow-y-auto rounded-t-3xl border-border bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6";

function Choice({ selected, onClick, label, hint }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className="flex min-h-[64px] w-full items-center gap-3 border-t border-border py-3 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-body font-medium">{label}</span>
        {hint ? <span className="block text-small text-ink-mid">{hint}</span> : null}
      </span>
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-ink-mid",
        )}
      >
        {selected ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : null}
      </span>
    </button>
  );
}

/** A sheet with one draft value and a Save button, so nothing changes until you mean it. */
function SettingSheet({ open, onOpenChange, title, description, initial, onSave, children }) {
  const [draft, setDraft] = useState(initial);
  // Start from the saved value each time the sheet opens (and only then, so
  // typing isn't reset when the parent re-renders).
  const seed = JSON.stringify(initial);
  useEffect(() => {
    if (open) setDraft(JSON.parse(seed));
  }, [open, seed]);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={sheetClass}>
        <SheetTitle className="pr-12 text-title">{title}</SheetTitle>
        {description ? <SheetDescription className="mt-1 text-body text-ink-mid">{description}</SheetDescription> : null}
        <div className="mt-4">{children(draft, setDraft)}</div>
        <Pill
          className="mt-6 w-full"
          onClick={async () => {
            await onSave(draft);
            onOpenChange(false);
          }}
        >
          Save
        </Pill>
      </SheetContent>
    </Sheet>
  );
}

export function UnitsSheet({ open, onOpenChange, value, onSave }) {
  return (
    <SettingSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Units"
      description="Weights convert to weights and volumes to volumes. Spoons and counts like “2 onions” stay as written."
      initial={value}
      onSave={onSave}
    >
      {(draft, setDraft) => (
        <div role="radiogroup" aria-label="Units">
          {UNIT_SYSTEMS.map((system) => (
            <Choice key={system.key} selected={draft === system.key} onClick={() => setDraft(system.key)} label={system.label} hint={system.hint} />
          ))}
        </div>
      )}
    </SettingSheet>
  );
}

export function ServingsSheet({ open, onOpenChange, servings, autoScale, onSave }) {
  return (
    <SettingSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Servings"
      initial={{ servings, autoScale }}
      onSave={onSave}
    >
      {(draft, setDraft) => (
        <>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border p-4">
            <span>
              <span className="block text-body font-semibold">Scale recipes to my table</span>
              <span className="block text-small text-ink-mid">Each batch starts at the portions of the people eating.</span>
            </span>
            <Switch
              checked={draft.autoScale}
              onCheckedChange={(checked) => setDraft({ ...draft, autoScale: checked })}
              aria-label="Scale recipes to my table"
            />
          </div>
          <div className={cn("mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border p-4", draft.autoScale && "opacity-50")}>
            <span>
              <span className="block text-body font-semibold">Default batch size</span>
              <span className="block text-small text-ink-mid">Used when scaling is off</span>
            </span>
            <div className="inline-flex items-center rounded-full bg-sand">
              <button
                type="button"
                disabled={draft.autoScale || draft.servings <= 1}
                onClick={() => setDraft({ ...draft, servings: draft.servings - 1 })}
                aria-label="Fewer servings"
                className="flex h-11 w-11 items-center justify-center disabled:opacity-30"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span className="num w-8 text-center text-body font-semibold">{draft.servings}</span>
              <button
                type="button"
                disabled={draft.autoScale || draft.servings >= 24}
                onClick={() => setDraft({ ...draft, servings: draft.servings + 1 })}
                aria-label="More servings"
                className="flex h-11 w-11 items-center justify-center disabled:opacity-30"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </>
      )}
    </SettingSheet>
  );
}

export function LanguageSheet({ open, onOpenChange, value, onSave }) {
  return (
    <SettingSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Recipe language"
      description="Your choice is saved now. Translating recipes needs a translation service, so it’s coming soon; recipes stay in their own language until then."
      initial={value}
      onSave={onSave}
    >
      {(draft, setDraft) => (
        <div role="radiogroup" aria-label="Recipe language">
          {LANGUAGES.map((language) => (
            <Choice
              key={language.key}
              selected={draft === language.key}
              onClick={() => setDraft(language.key)}
              label={language.label}
              hint={language.key === "en" ? "Recipes as written" : "Coming soon"}
            />
          ))}
        </div>
      )}
    </SettingSheet>
  );
}

export function StaplesSheet({ open, onOpenChange, value = [], onSave }) {
  const [entry, setEntry] = useState("");
  return (
    <SettingSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Pantry staples"
      description="Things you always have. They count towards Cook from my pantry and are never added to the grocery list."
      initial={value}
      onSave={onSave}
    >
      {(draft, setDraft) => (
        <>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const word = entry.trim().toLowerCase();
              if (word && !draft.includes(word)) setDraft([...draft, word]);
              setEntry("");
            }}
          >
            <input
              value={entry}
              onChange={(event) => setEntry(event.target.value)}
              placeholder="e.g. mustard oil"
              aria-label="Add a staple"
              className="h-12 min-w-0 flex-1 rounded-full bg-sand px-4 text-body outline-none placeholder:text-ink-mid focus-visible:ring-2 focus-visible:ring-primary"
            />
            <Pill type="submit" size="sm" variant="soft" disabled={!entry.trim()} aria-label="Add staple">
              <Plus className="h-5 w-5" aria-hidden="true" />
            </Pill>
          </form>
          <ul className="mt-3 flex flex-wrap gap-2">
            {draft.map((item) => (
              <li key={item} className="inline-flex h-11 items-center gap-1 rounded-full bg-sand pl-4 pr-1 text-body">
                {item}
                <button
                  type="button"
                  onClick={() => setDraft(draft.filter((word) => word !== item))}
                  aria-label={`Remove ${item}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                >
                  <X className="h-4 w-4 text-ink-mid" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </SettingSheet>
  );
}

export function PlainSheet({ open, onOpenChange, title, description, children }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={sheetClass}>
        <SheetTitle className="pr-12 text-title">{title}</SheetTitle>
        {description ? <SheetDescription className="mt-1 text-body text-ink-mid">{description}</SheetDescription> : null}
        <div className="mt-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
