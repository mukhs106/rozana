// Food facts used by browse cards, recipe detail and the batch editor: what a
// dish actually contains, how hot it is, and which household rule it trips.
import { versionIngredients, getVersion } from "@/lib/mealMath";
import { allergenKey } from "@/lib/allergenKey";

export const ALLERGEN_LABELS = {
  dairy: "Dairy",
  soy: "Soy",
  peanuts: "Peanuts",
  nuts: "Tree nuts",
  gluten: "Wheat / gluten",
  oniongarlic: "Onion & garlic",
  sesame: "Sesame",
  egg: "Egg",
  fish: "Fish",
  shellfish: "Shellfish",
};

export function allergenLabel(key) {
  return ALLERGEN_LABELS[key] || String(key || "").replace(/^\w/, (c) => c.toUpperCase());
}

/** What a version contains, what it cannot tell us, and its onion/garlic rule. */
export function allergenReport(recipe, versionKey) {
  const ingredients = versionIngredients(recipe, versionKey);
  const contains = [];
  const rules = [];
  // An ingredient only counts as covered once it actually carries an allergen
  // word; an empty tag means nobody recorded anything for it.
  const declared = ingredients.filter((item) => Array.isArray(item.allergens) && item.allergens.length > 0);

  ingredients.forEach((item) => {
    (item.allergens || []).forEach((raw) => {
      const key = allergenKey(raw);
      if (key && !contains.includes(key)) contains.push(key);
    });
    if (/onion|garlic/i.test(item.name || "") && !rules.includes("oniongarlic")) rules.push("oniongarlic");
  });

  const unknown = declared.length
    ? ingredients.filter((item) => !(Array.isArray(item.allergens) && item.allergens.length > 0))
    : ingredients;

  return {
    contains,
    rules,
    unknown,
    incomplete: unknown.length > 0,
    partial: declared.length > 0 && unknown.length > 0,
    none: declared.length === 0,
    taggedCount: declared.length,
  };
}

const HEAT_WORDS = /chilli|chili|pepper|mirch/i;

export function heatOf(recipe, versionKey) {
  if (recipe?.heat_level) return { level: recipe.heat_level, label: heatLabel(recipe.heat_level) };
  const chillies = versionIngredients(recipe, versionKey).filter((item) => HEAT_WORDS.test(item.name || ""));
  const level = Math.min(3, Math.max(1, chillies.length));
  return { level, label: heatLabel(level) };
}

export function heatLabel(level) {
  if (level >= 3) return "Hot";
  if (level === 2) return "Medium";
  return "Mild";
}

export function cookMinutesOf(recipe) {
  return Number(recipe?.cook_minutes) || null;
}

/** Every rule the household carries, flattened for quick matching. */
export function householdRules(household) {
  const members = household?.members || [];
  const allergies = new Set();
  const diets = new Set();
  const avoids = new Set();
  const goals = new Set();
  let spice = null;
  members.forEach((member) => {
    (member.allergies || []).forEach((item) => allergies.add(allergenKey(item)));
    (member.diet || []).forEach((item) => diets.add(String(item).toLowerCase()));
    (member.avoid || []).forEach((item) => avoids.add(String(item).toLowerCase()));
    Object.entries(member.goals || {}).forEach(([key, value]) => {
      if (value === true) goals.add(key);
    });
    if (member.spice) spice = member.spice;
  });
  if (diets.has("jain")) ["onion", "garlic", "potato"].forEach((item) => avoids.add(item));
  return { allergies, diets, avoids, goals, spice, members };
}

/**
 * The version or swap that would clear a household rule, with the reason it is
 * being offered. Returns null when the dish already fits.
 */
export function suggestionFor(recipe, rules) {
  const base = allergenReport(recipe);
  const hits = base.contains.filter((key) => rules.allergies.has(key));
  if (!hits.length) return null;

  const version = (recipe.variations || []).find((item) => {
    const report = allergenReport(recipe, item.key);
    return hits.every((key) => !report.contains.includes(key));
  });

  if (version) {
    return {
      kind: "version",
      key: version.key,
      label: version.name,
      why: `${allergenLabel(hits[0])} is on your list. ${version.name} leaves it out.`,
    };
  }

  const swap = (recipe.swaps || []).find(
    (item) => (item.removes || []).map(allergenKey).some((key) => hits.includes(key)),
  );
  if (swap) {
    return {
      kind: "swap",
      key: swap.key,
      label: swap.to,
      why: `${allergenLabel(hits[0])} is on your list. Swap ${swap.from} for ${swap.to}.`,
    };
  }

  return null;
}

/** The one-line note a card shows, only when it changes the decision. */
export function calloutFor(recipe, rules) {
  const report = allergenReport(recipe);
  const hits = report.contains.filter((key) => rules.allergies.has(key));
  const onionRule = report.rules.includes("oniongarlic") && rules.avoids.has("onion");
  if (!hits.length && !onionRule) return null;

  const label = hits.length
    ? `Contains ${hits.map((key) => allergenLabel(key).toLowerCase()).join(" · ")}`
    : "Contains onion & garlic";
  const fix = suggestionFor(recipe, rules);
  return fix ? `${label} · ${fix.label} available` : label;
}

export function versionName(recipe, versionKey) {
  return getVersion(recipe, versionKey)?.name || recipe?.title;
}

/**
 * The version name only when it tells someone something the dish name already
 * does not, so a card never says "Palak paneer, Palak paneer".
 */
export function versionAddsInfo(title, version) {
  const base = String(title || "").trim().toLowerCase();
  const name = String(version || "").trim().toLowerCase();
  if (!name || name === base || name === "original recipe" || name === "base") return null;
  if (name.startsWith(base)) return null;
  return version;
}

/** The label for a version control: the distinguishing name, or "Original". */
export function versionChipLabel(title, version) {
  return versionAddsInfo(title, version) || "Original";
}

/** Nutrition for one serving of a version, or nulls where the data is missing. */
export function perServing(recipe, versionKey) {
  const version = getVersion(recipe, versionKey);
  const source = version?.nutrition?.kcal || version?.nutrition?.fiber ? version.nutrition : recipe?.nutrition;
  if (!source) return null;
  return {
    kcal: numberOrNull(source.kcal),
    protein: numberOrNull(source.protein),
    carbs: numberOrNull(source.carbs),
    fat: numberOrNull(source.fat),
    fiber: numberOrNull(source.fiber),
  };
}

function numberOrNull(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;
}

/** Fiber for a swapped version, scaled from the version estimate when it exists. */
export function fiberFor(recipe, versionKey, swapKeys = []) {
  const base = perServing(recipe, versionKey)?.fiber;
  if (!base) return null;
  if (!swapKeys.length) return base;
  return base;
}