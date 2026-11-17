import { householdRules, suggestionFor } from "@/lib/foodInfo";

/**
 * Why this version is being offered, and a single confirm. Nothing switches
 * unless the cook accepts it.
 */
export default function VersionSuggestion({ recipe, versionKey, household, onUseVersion }) {
  const rules = householdRules(household);
  const suggestion = suggestionFor(recipe, rules);
  if (!suggestion) return null;
  if (suggestion.kind === "version" && suggestion.key === versionKey) return null;

  return (
    <div className="mt-4 border-l-2 border-oxblood pl-3">
      <p className="text-small font-semibold uppercase tracking-[0.14em] text-oxblood">
        Suggested for your household
      </p>
      <p className="mt-1 text-small leading-snug text-ink-soft">{suggestion.why}</p>
      {suggestion.kind === "version" ? (
        <button
          type="button"
          onClick={() => onUseVersion(suggestion.key)}
          className="mt-2 rounded-full border border-oxblood px-3 py-1 text-small font-semibold uppercase tracking-[0.1em] text-oxblood"
        >
          Use {suggestion.label}
        </button>
      ) : (
        <p className="mt-1 text-small leading-snug text-ink-mid">
          Choose {suggestion.label} in the ingredient list below to clear it.
        </p>
      )}
    </div>
  );
}