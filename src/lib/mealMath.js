// Batch maths. Every number is recomputed from the recipe's base quantities at the
// current portion count, so repeated edits never compound rounding.
import { matchesSwap } from "@/lib/swapLibrary";

const FRACTIONS = { 0.25: "¼", 0.5: "½", 0.75: "¾", 0.2: "⅕", 0.33: "⅓", 0.67: "⅔" };
const PLURALS = { cup: "cups", clove: "cloves", can: "cans", bunch: "bunches", sprig: "sprigs", slice: "slices", pinch: "pinches" };
const MEAT_WORDS = ["chicken", "mutton", "lamb", "fish", "prawn", "shrimp", "beef", "pork", "egg", "keema"];

export function roundSmart(value, unit) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const u = (unit || "").toLowerCase();
  if (u === "g" || u === "ml") return value >= 40 ? Math.round(value / 5) * 5 : Math.round(value);
  if (u === "tsp" || u === "tbsp") return Math.round(value * 4) / 4;
  if (PLURALS[u] || u === "piece") return Math.round(value * 2) / 2;
  return Math.round(value * 10) / 10;
}

export function formatQty(qty) {
  if (!qty) return "0";
  const whole = Math.floor(qty + 1e-6);
  const frac = qty - whole;
  const key = Object.keys(FRACTIONS).find((k) => Math.abs(Number(k) - frac) < 0.03);
  if (key) return `${whole || ""}${FRACTIONS[key]}`;
  return String(Math.round(qty * 10) / 10);
}

export function unitLabel(qty, unit) {
  if (!unit || unit === "piece") return "";
  if (PLURALS[unit]) return qty > 1 ? PLURALS[unit] : unit;
  return unit;
}

export function formatAmount(qty, unit) {
  return [formatQty(qty), unitLabel(qty, unit)].filter(Boolean).join(" ");
}

/** The recipe swaps that can apply to one ingredient, in the order they were authored. */
export function swapsForIngredient(swaps = [], ingredientName = "") {
  return swaps.filter((swap) => matchesSwap(swap, ingredientName));
}

export function getVersion(recipe, versionKey) {
  return (recipe?.variations || []).find((v) => v.key === versionKey) || null;
}

export function versionIngredients(recipe, versionKey) {
  const version = getVersion(recipe, versionKey);
  return version?.ingredients?.length ? version.ingredients : recipe?.base_ingredients || [];
}

export function versionInstructions(recipe, versionKey) {
  const version = getVersion(recipe, versionKey);
  return version?.instructions?.length ? version.instructions : recipe?.base_instructions || [];
}

export function versionNutrition(recipe, versionKey) {
  const version = getVersion(recipe, versionKey);
  if (version?.nutrition?.kcal) return version.nutrition;
  if (recipe?.nutrition?.kcal) return recipe.nutrition;
  return null;
}

function mergeAllergens(list, swap) {
  if (!Array.isArray(list) || !swap) return list;
  const removed = (swap.removes || []).map((a) => a.toLowerCase());
  const next = list.filter((a) => !removed.includes(a.toLowerCase()));
  (swap.adds || []).forEach((a) => {
    if (!next.some((n) => n.toLowerCase() === a.toLowerCase())) next.push(a);
  });
  return next;
}

export function resolveIngredients(recipe, versionKey, portions, swapKeys = []) {
  const source = versionIngredients(recipe, versionKey);
  const baseServings = Number(recipe?.base_servings) || 4;
  const factor = (Number(portions) || baseServings) / baseServings;
  const swaps = (recipe?.swaps || []).filter((s) => swapKeys.includes(s.key));
  return source.map((ing, index) => {
    const swap = swaps.find((s) => matchesSwap(s, ing.name));
    const unit = swap?.unit || ing.unit;
    const qty = roundSmart((Number(ing.qty) || 0) * factor * (swap ? Number(swap.ratio ?? 1) : 1), unit);
    return {
      ...ing,
      key: `${ing.name}-${index}`,
      sourceName: ing.name,
      name: swap ? swap.to : ing.name,
      qty,
      unit,
      swap,
      allergens: mergeAllergens(ing.allergens, swap),
    };
  });
}

/**
 * Resolves a batch that leaves as more than one group (a meal with its own swaps).
 * Rows that differ only by group stay apart and carry the group labels.
 */
export function resolveBatch(recipe, versionKey, groups = []) {
  const merged = new Map();
  groups.forEach((group) => {
    resolveIngredients(recipe, versionKey, group.portions, group.swapKeys || []).forEach((row) => {
      const key = `${row.name.toLowerCase()}|${row.unit}`;
      const existing = merged.get(key);
      if (existing) {
        existing.qty += row.qty;
        if (!existing.labels.includes(group.label)) existing.labels.push(group.label);
        if (Array.isArray(existing.allergens) && Array.isArray(row.allergens)) {
          existing.allergens = Array.from(new Set([...existing.allergens, ...row.allergens]));
        } else {
          existing.allergens = undefined;
        }
      } else {
        merged.set(key, { ...row, labels: [group.label] });
      }
    });
  });
  const labels = groups.map((group) => group.label);
  return Array.from(merged.entries()).map(([key, row]) => ({
    ...row,
    key,
    qty: roundSmart(row.qty, row.unit),
    scope: labels.length > 1 && row.labels.length < labels.length ? row.labels : null,
  }));
}

export function availableSwaps(recipe, versionKey) {
  const ingredients = versionIngredients(recipe, versionKey);
  return (recipe?.swaps || []).filter((s) => ingredients.some((i) => matchesSwap(s, i.name)));
}

export function findConflicts(ingredients, diners = []) {
  const conflicts = [];
  const missing = ingredients.filter((i) => !Array.isArray(i.allergens)).map((i) => i.name);

  diners.forEach((person) => {
    const allergies = (person.allergies || []).map((a) => a.toLowerCase());
    const diet = (person.diet || []).map((d) => d.toLowerCase());
    const avoid = (person.avoid || []).map((a) => a.toLowerCase());
    if (diet.includes("jain")) ["onion", "garlic", "potato"].forEach((rule) => {
      if (!avoid.includes(rule)) avoid.push(rule);
    });
    ingredients.forEach((ing) => {
      const allergens = (ing.allergens || []).map((a) => a.toLowerCase());
      const name = ing.name.toLowerCase();
      allergies.forEach((allergen) => {
        if (allergens.includes(allergen)) {
          conflicts.push({ kind: "allergy", who: person.name, label: allergen, ingredient: ing.name });
        }
      });
      if ((diet.includes("vegan") || diet.includes("dairy-free")) && allergens.includes("dairy")) {
        conflicts.push({
          kind: "diet",
          who: person.name,
          label: diet.includes("vegan") ? "vegan" : "dairy-free",
          ingredient: ing.name,
        });
      }
      if ((diet.includes("vegan") || diet.includes("vegetarian")) && MEAT_WORDS.some((w) => name.includes(w))) {
        conflicts.push({
          kind: "diet",
          who: person.name,
          label: diet.includes("vegan") ? "vegan" : "vegetarian",
          ingredient: ing.name,
        });
      }
      if (diet.includes("gluten-free") && allergens.includes("gluten")) {
        conflicts.push({ kind: "diet", who: person.name, label: "gluten-free", ingredient: ing.name });
      }
      if (diet.includes("nut-free") && allergens.includes("nuts")) {
        conflicts.push({ kind: "diet", who: person.name, label: "nut-free", ingredient: ing.name });
      }
      avoid.forEach((rule) => {
        if (rule && name.includes(rule)) {
          conflicts.push({ kind: "rule", who: person.name, label: rule, ingredient: ing.name });
        }
      });
    });
  });

  const seen = new Set();
  const unique = conflicts.filter((c) => {
    const key = `${c.kind}|${c.who}|${c.ingredient}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { conflicts: unique, missing };
}

export function batchNutrition(perServing, portions) {
  if (!perServing?.kcal) return null;
  const factor = Number(portions) || 1;
  return {
    kcal: Math.round(perServing.kcal * factor),
    protein: Math.round((perServing.protein || 0) * factor),
    carbs: Math.round((perServing.carbs || 0) * factor),
    fat: Math.round((perServing.fat || 0) * factor),
    fiber: perServing.fiber ? Math.round(perServing.fiber * factor) : null,
  };
}

function normalizeUnit(qty, unit) {
  const u = (unit || "").toLowerCase();
  if (u === "kg") return { qty: qty * 1000, unit: "g" };
  if (u === "l") return { qty: qty * 1000, unit: "ml" };
  return { qty, unit: u };
}

function prettify(qty, unit) {
  if (unit === "g" && qty >= 1000) return { qty: Math.round((qty / 1000) * 100) / 100, unit: "kg" };
  if (unit === "ml" && qty >= 1000) return { qty: Math.round((qty / 1000) * 100) / 100, unit: "l" };
  return { qty, unit };
}

/** Combines rows that share a name and a compatible unit; keeps incompatible ones apart. */
export function combineItems(items = []) {
  const groups = new Map();
  items.forEach((item) => {
    const label = (item.display_name || item.name || "").trim();
    if (!label) return;
    const norm = normalizeUnit(Number(item.quantity) || 0, item.unit);
    const key = `${label.toLowerCase()}|${norm.unit}`;
    const existing = groups.get(key);
    if (existing) {
      existing.qty += norm.qty;
      existing.ids.push(item.id);
    } else {
      groups.set(key, { key, ids: [item.id], label, qty: norm.qty, unit: norm.unit, note: item.note });
    }
  });
  return Array.from(groups.values()).map((group) => ({ ...group, ...prettify(group.qty, group.unit) }));
}