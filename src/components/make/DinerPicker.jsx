import { useState } from "react";
import { Plus } from "lucide-react";

export default function DinerPicker({ members = [], selected = [], onToggle, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await onAdd(trimmed);
    setName("");
    setAdding(false);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {members.map((member) => {
          const active = selected.includes(member.id);
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onToggle(member.id)}
              className={`rounded-full border px-3 py-1.5 text-small font-medium transition-colors ${
                active ? "border-ink bg-ink text-background" : "border-border text-ink-soft hover:border-ink-mid"
              }`}
            >
              {member.is_self ? `${member.name} (you)` : member.name}
            </button>
          );
        })}
        {adding ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-black/20 px-2 py-1">
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
                if (event.key === "Escape") setAdding(false);
              }}
              placeholder="Name"
              className="w-20 bg-transparent text-small outline-none placeholder:text-ink-faint"
            />
            <button type="button" onClick={submit} className="text-small font-semibold uppercase tracking-[0.1em] text-chili">
              Add
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-black/25 px-3 py-1.5 text-small font-medium text-ink-mid"
          >
            <Plus className="h-3 w-3" strokeWidth={2.2} /> Add diner
          </button>
        )}
      </div>
    </div>
  );
}