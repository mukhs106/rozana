import AllergenSummary from "@/components/AllergenSummary";
import Pill from "@/components/Pill";
import { allergenKey } from "@/lib/allergenKey";
import { allergenLabel, allergenReport, heatOf, householdRules, suggestionFor } from "@/lib/foodInfo";
import { versionIngredients } from "@/lib/mealMath";

/**
 * The allergen treatment: personal conflicts first, then a compact row of
 * labelled ingredient marks, then the full list on request. "Check
 * ingredients" appears wherever the data cannot answer for an ingredient.
 */
export default function AllergenPanel({ recipe, versionKey, household, onPickVersion }) {
  const report = allergenReport(recipe, versionKey);
  const rules = householdRules(household);
  const suggestion = suggestionFor(recipe, rules);
  const heat = heatOf(recipe, versionKey);
  const ingredients = versionIngredients(recipe, versionKey);

  const mine = [];
  rules.members.forEach((member) => {
    (member.allergies || []).forEach((raw) => {
      const key = allergenKey(raw);
      if (key && report.contains.includes(key)) mine.push(`${allergenLabel(key)} for ${member.name}`);
    });
  });

  const checkNames = report.unknown.slice(0, 3).map((item) => item.name);

  return (
    <section className="mt-5 border-t border-border pt-4">
      {mine.length ? (
        <div className="mb-3 rounded-[8px] border border-oxblood/40 p-3">
          <p className="text-body font-semibold leading-snug text-oxblood">
            On your household list: {mine.join(", ")}.
          </p>
          {suggestion?.kind === "version" ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Pill variant="outline" size="sm" onClick={() => onPickVersion(suggestion.key)}>
                Preview {suggestion.label}
              </Pill>
              <span className="text-small leading-snug text-ink-mid">{suggestion.why}</span>
            </div>
          ) : suggestion ? (
            <p className="mt-1 text-small leading-snug text-ink-mid">{suggestion.why}</p>
          ) : (
            <p className="mt-1 text-small leading-snug text-ink-mid">
              No version of this dish clears it. Swap an ingredient below or pick another dish.
            </p>
          )}
        </div>
      ) : null}

      <AllergenSummary report={report} />

      <p className="mt-2 text-small leading-snug text-ink-mid">
        {report.none ? (
          <>
            <span className="font-semibold text-ink">Check ingredients:</span> nothing in this dish carries an
            allergen record, including {checkNames.join(", ")}. It is not cleared for anyone.
          </>
        ) : report.partial ? (
          <>
            <span className="font-semibold text-ink">Check ingredients:</span> {report.unknown.length} ingredients
            have no allergen recorded ({checkNames.join(", ")}
            {report.unknown.length > checkNames.length ? ` and ${report.unknown.length - checkNames.length} more` : ""}
            ). Contains lists only what is recorded.
          </>
        ) : (
          <>Every ingredient carries an allergen record for this version.</>
        )}
      </p>

      {rules.spice === "mild" && heat.level > 1 ? (
        <p className="mt-1.5 text-small leading-snug text-ink-mid">
          Spice tolerance is set to mild: this dish is {heat.label.toLowerCase()}, so use less chilli for the household
          portions and finish yours separately.
        </p>
      ) : null}

      <details className="mt-2">
        <summary className="cursor-pointer text-body font-medium text-ink">Full ingredient information</summary>
        <ul className="mt-2">
          {ingredients.map((ingredient, index) => (
            <li
              key={`${ingredient.name}-${index}`}
              className="flex items-start justify-between gap-3 border-t border-border py-1.5 text-small"
            >
              <span className="min-w-0">{ingredient.name}</span>
              <span className="shrink-0 text-right text-ink-mid">
                {Array.isArray(ingredient.allergens) && ingredient.allergens.length
                  ? ingredient.allergens.map(allergenLabel).join(", ")
                  : "No allergen recorded"}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}