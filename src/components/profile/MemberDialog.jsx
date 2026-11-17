import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Pill from "@/components/Pill";
import { ALLERGENS, DIET_PRESETS, NUTRITION_GOALS, SPICE_LEVELS, presetByKey } from "@/lib/diet";

const blank = () => ({
  id: crypto.randomUUID(),
  name: "",
  is_self: false,
  allergies: [],
  diet: [],
  avoid: [],
  dislikes: [],
  spice: "medium",
  portion: 1,
  goals: {},
});

const PORTIONS = [0.5, 0.75, 1, 1.5, 2];
const PORTION_WORDS = { 0.5: "½", 0.75: "¾", 1: "1", 1.5: "1½", 2: "2" };

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={Boolean(active)}
      className={`h-11 rounded-full px-4 text-body font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-sand text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function AddEntry({ placeholder, onAdd }) {
  const [value, setValue] = useState("");
  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onAdd(text);
    setValue("");
  };
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        className="h-11 min-w-0 flex-1 rounded-full bg-sand px-4 text-body outline-none placeholder:text-ink-mid focus-visible:ring-2 focus-visible:ring-primary"
      />
      <button
        type="button"
        onClick={submit}
        className="h-11 shrink-0 rounded-full px-4 text-body font-semibold text-primary"
      >
        Add
      </button>
    </div>
  );
}

function Tag({ children, onRemove }) {
  return (
    <span className="inline-flex h-11 items-center gap-1 rounded-full bg-sand pl-4 pr-1 text-body text-ink">
      {children}
      {onRemove ? (
        <button type="button" onClick={onRemove} aria-label={`Remove ${children}`} className="flex h-9 w-9 items-center justify-center rounded-full">
          <X className="h-4 w-4 text-ink-mid" strokeWidth={2.4} />
        </button>
      ) : null}
    </span>
  );
}

export default function MemberDialog({ open, onOpenChange, member, onSave, onDelete }) {
  const [draft, setDraft] = useState(blank);

  useEffect(() => {
    if (!open) return;
    setDraft(member ? { ...blank(), ...member, goals: { ...(member.goals || {}) } } : blank());
  }, [open, member]);

  const toggleIn = (field, value) => {
    const list = draft[field] || [];
    setDraft({
      ...draft,
      [field]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
    });
  };

  const addTo = (field, value) => {
    const list = draft[field] || [];
    if (list.some((item) => item.toLowerCase() === value.toLowerCase())) return;
    setDraft({ ...draft, [field]: [...list, value] });
  };

  const removeFrom = (field, value) => {
    setDraft({ ...draft, [field]: (draft[field] || []).filter((item) => item !== value) });
  };

  const applyPreset = (preset) => {
    setDraft({
      ...draft,
      diet: Array.from(new Set([...(draft.diet || []), ...preset.diet])),
      avoid: Array.from(new Set([...(draft.avoid || []), ...preset.avoid])),
    });
  };

  const activePreset = (preset) => preset.diet.every((tag) => (draft.diet || []).includes(tag));

  const save = () => {
    const name = draft.name.trim();
    if (!name) return;
    onSave({ ...draft, name });
  };

  const customAllergies = (draft.allergies || []).filter(
    (item) => !ALLERGENS.includes(item),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px] rounded-3xl border-border p-0">
        <div className="max-h-[84vh] overflow-y-auto px-5 pb-5 pt-6">
          <p className="eyebrow">{member ? "Edit diner" : "Add a diner"}</p>
          <DialogTitle className="mt-2 text-title font-semibold tracking-[-0.02em]">
            <input
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="Name"
              className="w-full bg-transparent outline-none placeholder:text-ink-faint"
            />
          </DialogTitle>

          <div className="mt-5">
            <p className="eyebrow">Usual portion</p>
            <p className="mt-1 text-small leading-snug text-ink-faint">
              How much of one standard serving they eat. A child might be ½, a big appetite 1½.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PORTIONS.map((value) => (
                <Chip key={value} active={(Number(draft.portion) || 1) === value} onClick={() => setDraft({ ...draft, portion: value })}>
                  {PORTION_WORDS[value]}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="eyebrow">Allergies</p>
            <p className="mt-1 text-small leading-snug text-ink-faint">
              Kept separate from preferences: these block a batch.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ALLERGENS.map((allergen) => (
                <Chip
                  key={allergen}
                  active={(draft.allergies || []).includes(allergen)}
                  onClick={() => toggleIn("allergies", allergen)}
                >
                  {allergen}
                </Chip>
              ))}
              {customAllergies.map((item) => (
                <Tag key={item} onRemove={() => removeFrom("allergies", item)}>
                  {item}
                </Tag>
              ))}
            </div>
            <AddEntry placeholder="Add your own allergy" onAdd={(value) => addTo("allergies", value)} />
          </div>

          <div className="mt-5">
            <p className="eyebrow">Diet presets</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DIET_PRESETS.map((preset) => (
                <Chip key={preset.key} active={activePreset(preset)} onClick={() => applyPreset(preset)}>
                  {preset.label}
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-small leading-snug text-ink-faint">
              Presets only fill in the rules below. Edit them freely, including the Jain onion, garlic and root
              vegetable rules.
            </p>
          </div>

          <div className="mt-5">
            <p className="eyebrow">Ingredient rules</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(draft.avoid || []).length ? (
                (draft.avoid || []).map((rule) => (
                  <Tag key={rule} onRemove={() => removeFrom("avoid", rule)}>
                    {rule}
                  </Tag>
                ))
              ) : (
                <p className="text-small text-ink-mid">No ingredient rules yet.</p>
              )}
            </div>
            <AddEntry placeholder="e.g. onion" onAdd={(value) => addTo("avoid", value)} />
          </div>

          <div className="mt-5">
            <p className="eyebrow">Doesn’t like</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(draft.dislikes || []).map((item) => (
                <Tag key={item} onRemove={() => removeFrom("dislikes", item)}>
                  {item}
                </Tag>
              ))}
            </div>
            <AddEntry placeholder="e.g. coriander" onAdd={(value) => addTo("dislikes", value)} />
          </div>

          <div className="mt-5">
            <p className="eyebrow">Spice tolerance</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SPICE_LEVELS.map((level) => (
                <Chip key={level} active={draft.spice === level} onClick={() => setDraft({ ...draft, spice: level })}>
                  {level}
                </Chip>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="eyebrow">Nutrition goals</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {NUTRITION_GOALS.map((goal) => (
                <Chip
                  key={goal.key}
                  active={Boolean(draft.goals?.[goal.key])}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      goals: { ...draft.goals, [goal.key]: !draft.goals?.[goal.key] },
                    })
                  }
                >
                  {goal.label}
                </Chip>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <label className="flex h-11 flex-1 items-center gap-2 rounded-full bg-sand px-4">
                <input
                  type="number"
                  min="0"
                  value={draft.goals?.kcal || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, goals: { ...draft.goals, kcal: Number(event.target.value) } })
                  }
                  placeholder="0"
                  className="num w-full bg-transparent text-body outline-none placeholder:text-ink-faint"
                />
                <span className="text-small uppercase tracking-[0.1em] text-ink-faint">kcal</span>
              </label>
              <label className="flex h-11 flex-1 items-center gap-2 rounded-full bg-sand px-4">
                <input
                  type="number"
                  min="0"
                  value={draft.goals?.protein || ""}
                  onChange={(event) =>
                    setDraft({ ...draft, goals: { ...draft.goals, protein: Number(event.target.value) } })
                  }
                  placeholder="0"
                  className="num w-full bg-transparent text-body outline-none placeholder:text-ink-faint"
                />
                <span className="text-small uppercase tracking-[0.1em] text-ink-faint">g protein</span>
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2">
            {member && !member.is_self ? (
              <button
                type="button"
                onClick={() => onDelete(draft)}
                className="h-11 px-2 text-body font-medium text-status-cant"
              >
                Remove
              </button>
            ) : null}
            <Pill className="ml-auto" onClick={save}>
              Save diner
            </Pill>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}