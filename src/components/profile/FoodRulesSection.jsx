import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { AllergenChip } from "@/components/AllergenSummary";
import Stepper from "@/components/Stepper";
import { allergenKey } from "@/lib/allergenKey";
import { allergenLabel } from "@/lib/foodInfo";

/** Food & household: allergies, diet presets, rules, goals and default servings. */
export default function FoodRulesSection({
  members,
  household,
  saved = [],
  onEdit,
  onAdd,
  onSaveHousehold,
}) {
  const defaultServings = Number(household?.default_servings) || 4;

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between">
        <p className="eyebrow">Food &amp; household</p>
        <button
          type="button"
          onClick={onAdd}
          className="text-small font-semibold uppercase tracking-[0.12em] text-oxblood"
        >
          Add diner
        </button>
      </div>

      <ul className="mt-1">
        {members.map((member) => {
          const allergyKeys = Array.from(new Set((member.allergies || []).map(allergenKey).filter(Boolean)));
          const custom = (member.allergies || []).filter(
            (item) => !["dairy", "nuts", "gluten", "soy", "egg", "fish", "shellfish", "sesame"].includes(
              String(item).toLowerCase(),
            ),
          );
          const goals = Object.entries(member.goals || {})
            .filter(([, value]) => value === true)
            .map(([key]) => key.replace("_", " "));

          return (
            <li key={member.id} className="border-t border-border">
              <button
                type="button"
                onClick={() => onEdit(member)}
                className="flex w-full items-start justify-between gap-3 py-3 text-left"
              >
                <span className="min-w-0">
                  <span className="block text-body font-medium leading-tight">
                    {member.name}
                    {member.is_self ? " (you)" : ""}
                  </span>

                  {allergyKeys.length || custom.length ? (
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {allergyKeys.map((key) => (
                        <AllergenChip key={key} kind={key} />
                      ))}
                      {custom.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-oxblood px-2 py-[3px] text-small font-medium text-oxblood"
                        >
                          {item}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="mt-0.5 block text-small text-ink-mid">No allergies listed</span>
                  )}

                  <span className="mt-1 block text-small leading-snug text-ink-mid">
                    {[
                      (member.diet || []).join(", "),
                      (member.avoid || []).length ? `rules: ${(member.avoid || []).slice(0, 4).join(", ")}` : null,
                      member.spice ? `${member.spice} spice` : null,
                      goals.length ? goals.join(", ") : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "No preferences set"}
                  </span>
                </span>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-ink-faint" strokeWidth={2} />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
        <div>
          <p className="text-body leading-snug">Default servings</p>
          <p className="mt-0.5 text-small leading-snug text-ink-mid">Where a new batch starts.</p>
        </div>
        <Stepper
          value={defaultServings}
          onChange={(value) => onSaveHousehold({ default_servings: value })}
          min={1}
          max={12}
          unit="servings"
        />
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <p className="text-body leading-snug">Saved swaps</p>
        {saved.length ? (
          <ul className="mt-1">
            {saved.slice(0, 4).map((version) => (
              <li key={version.id}>
                <Link
                  to="/recipes/$recipeId"
                  params={{ recipeId: version.recipe_id }}
                  search={{ version: version.version_key }}
                  className="flex items-center justify-between gap-3 py-1.5 text-small text-ink-mid"
                >
                  <span className="min-w-0 truncate">
                    {version.recipe_title} · {version.version_name}
                  </span>
                  <span className="shrink-0 text-small uppercase tracking-[0.1em] text-ink-faint">
                    {(version.swap_names || []).length ? version.swap_names.join(", ") : "no swaps"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-small text-ink-mid">Saved versions stay here for a one-tap repeat.</p>
        )}
      </div>

      <p className="mt-2 text-small leading-relaxed text-ink-faint">
        Allergies block a batch. Rules and preferences only shape what we suggest. {allergenLabel("dairy")} and the
        rest are matched on every ingredient.
      </p>
    </section>
  );
}