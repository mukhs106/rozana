// The shared grocery list. Everything here is plain sorting and adding up.
//
// - aisleOf(): which shelf of the shop an item lives on, from a word list.
// - planNeeds(): what the planned batches need that isn't on the list yet,
//   counting each batch once (dinner + tomorrow's lunch is one cook), with
//   per-person extras ("+100 g tofu for Arjun") kept on their own rows.
// - groupItems(): the list by aisle or by recipe.
import { hasPhrase } from "@/lib/fit";
import { resolveBatch } from "@/lib/mealMath";
import { withLibrarySwaps } from "@/lib/table";
import { formatAmount } from "@/lib/mealMath";
import { convertAmount } from "@/lib/units";

export const AISLES = [
  { key: "veg", label: "Vegetables and herbs", words: ["onion", "tomato", "potato", "garlic", "ginger", "chilli", "chili", "coriander", "cilantro", "mint", "curry leaf", "spinach", "palak", "methi", "okra", "bhindi", "aubergine", "eggplant", "baingan", "cauliflower", "gobi", "cabbage", "carrot", "peas", "beans", "capsicum", "pepper", "lemon", "lime", "cucumber", "pumpkin", "gourd", "lauki", "karela", "mushroom", "beetroot", "radish", "drumstick", "spring onion", "leaf", "leaves"] },
  { key: "dairy", label: "Dairy and paneer", words: ["milk", "paneer", "curd", "yogurt", "yoghurt", "dahi", "cream", "butter", "cheese", "buttermilk", "khoya"] },
  { key: "protein", label: "Tofu, soya, eggs and meat", words: ["tofu", "soya", "egg", "chicken", "mutton", "lamb", "fish", "prawn", "keema", "tempeh"] },
  { key: "grains", label: "Dals, rice and flours", words: ["dal", "lentil", "rice", "basmati", "rajma", "kidney bean", "chana", "chickpea", "moong", "masoor", "toor", "urad", "atta", "flour", "besan", "semolina", "sooji", "rava", "poha", "oats", "millet", "quinoa"] },
  { key: "spices", label: "Spices and masalas", words: ["masala", "cumin", "jeera", "turmeric", "haldi", "chilli powder", "coriander powder", "garam", "mustard seed", "fenugreek seed", "cardamom", "clove", "cinnamon", "bay leaf", "hing", "asafoetida", "pepper", "peppercorn", "fennel", "ajwain", "kasuri", "amchur", "saffron", "nutmeg", "star anise"] },
  { key: "oils", label: "Oils and ghee", words: ["oil", "ghee"] },
  { key: "nuts", label: "Nuts, seeds and dried fruit", words: ["cashew", "almond", "peanut", "pistachio", "walnut", "raisin", "seeds", "sesame", "coconut"] },
  { key: "pantry", label: "Tins, jars and everything else", words: [] },
];

/** The aisle for an item. Spices are checked before vegetables so "chilli powder" isn't a vegetable. */
export function aisleOf(name) {
  // Phrases whose words point at the wrong shelf.
  if (["coconut milk", "coconut cream", "tomato puree", "tomato paste", "soy sauce"].some((phrase) => hasPhrase(name, phrase))) {
    return "pantry";
  }
  const order = ["spices", "oils", "dairy", "protein", "grains", "nuts", "veg"];
  for (const key of order) {
    const aisle = AISLES.find((item) => item.key === key);
    if (aisle.words.some((word) => hasPhrase(name, word))) return aisle.key;
  }
  return "pantry";
}

const TRIVIAL = ["water", "ice"];

/**
 * Rows one batch needs. Each person on each meal is a group with their own
 * swaps; a swapped row that only some people get keeps their names.
 */
export function batchRows(batch, recipe) {
  if (!recipe) return [];
  const full = withLibrarySwaps(recipe, batch.version_key);
  const groups = [];
  batch.meals.forEach((meal) => {
    const portions = Array.isArray(meal.portions) && meal.portions.length ? meal.portions : [{ diner_name: "Everyone", servings: meal.servings || 1 }];
    portions.forEach((portion) => {
      const existing = groups.find((group) => group.label === portion.diner_name);
      const swapKeys = portion.swap_keys || meal.swap_keys || [];
      if (existing && existing.swapKeys.join() === swapKeys.join()) existing.portions += Number(portion.servings) || 0;
      else groups.push({ label: portion.diner_name, portions: Number(portion.servings) || 0, swapKeys });
    });
  });
  return resolveBatch(full, batch.version_key, groups).map((row) => ({
    name: row.name,
    qty: row.qty,
    unit: row.unit,
    forNames: row.swap && row.scope ? row.scope : null,
  }));
}

const keyOf = (name, unit, forNames) => `${String(name).toLowerCase()}|${unit || ""}|${(forNames || []).join("+")}`;

/**
 * What the plan needs that isn't already on the list or in the pantry.
 * Single batches count (an old bug skipped them); there is no cap.
 */
export function planNeeds({ batches = [], recipes = [], items = [], staples = [] }) {
  // Anything already on the list, in the pantry or dismissed counts as handled.
  const listed = new Set(items.map((item) => String(item.display_name || item.name).toLowerCase()));
  const staple = (name) => staples.some((word) => hasPhrase(name, word));
  const found = new Map();
  batches.forEach((batch) => {
    const recipe = recipes.find((item) => item.id === batch.recipe_id);
    batchRows(batch, recipe).forEach((row) => {
      if (!row.name || TRIVIAL.some((word) => hasPhrase(row.name, word)) || staple(row.name)) return;
      if (listed.has(row.name.toLowerCase())) return;
      const key = keyOf(row.name, row.unit, row.forNames);
      const entry = found.get(key) || { key, name: row.name, unit: row.unit, qty: 0, forNames: row.forNames, dishes: new Set() };
      entry.qty += Number(row.qty) || 0;
      entry.dishes.add(batch.recipe_title);
      found.set(key, entry);
    });
  });
  return Array.from(found.values())
    .map((entry) => ({ ...entry, dishes: Array.from(entry.dishes), aisle: aisleOf(entry.name) }))
    .sort((a, b) => AISLES.findIndex((x) => x.key === a.aisle) - AISLES.findIndex((x) => x.key === b.aisle) || a.name.localeCompare(b.name));
}

/** A grocery row ready to save. */
export function toGroceryItem(need, recipeTitle) {
  return {
    name: need.name.toLowerCase(),
    display_name: need.name,
    quantity: need.qty,
    unit: need.unit || "",
    status: "to_buy",
    for_diners: need.forNames || [],
    recipe_title: recipeTitle || (need.dishes || [])[0] || "",
    note: need.forNames?.length ? `For ${need.forNames.join(" and ")}` : "",
  };
}

/** Items to buy, merged when they're the same thing for the same people. */
export function mergeToBuy(items = []) {
  const merged = new Map();
  items
    .filter((item) => item.status === "to_buy")
    .forEach((item) => {
      const name = item.display_name || item.name || "";
      const forNames = item.for_diners?.length ? item.for_diners : null;
      const key = keyOf(name, item.unit, forNames);
      const entry =
        merged.get(key) ||
        { key, ids: [], name, unit: item.unit, qty: 0, forNames, recipes: new Set(), aisle: aisleOf(name) };
      entry.ids.push(item.id);
      entry.qty += Number(item.quantity) || 0;
      if (item.recipe_title) entry.recipes.add(item.recipe_title);
      merged.set(key, entry);
    });
  return Array.from(merged.values()).map((entry) => ({ ...entry, recipes: Array.from(entry.recipes) }));
}

/** [{ key, label, rows }] by aisle (shop order) or by recipe. */
export function groupItems(rows, mode = "aisle") {
  if (mode === "recipe") {
    const groups = new Map();
    rows.forEach((row) => {
      const label = row.recipes[0] || "Added by hand";
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(row);
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => (a === "Added by hand") - (b === "Added by hand") || a.localeCompare(b))
      .map(([label, list]) => ({ key: label, label, rows: list.sort((a, b) => a.name.localeCompare(b.name)) }));
  }
  return AISLES.map((aisle) => ({
    key: aisle.key,
    label: aisle.label,
    rows: rows.filter((row) => row.aisle === aisle.key).sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((group) => group.rows.length);
}

/** "200 g firm tofu", in the person's units. */
export function amountText(row, units) {
  if (!row.qty) return "";
  const { qty, unit } = convertAmount(row.qty, row.unit, units);
  return formatAmount(qty, unit);
}

/** Plain text for Copy and Share, grouped by aisle. */
export function listText(rows, units) {
  const lines = ["Rozana grocery list", ""];
  groupItems(rows, "aisle").forEach((group) => {
    lines.push(group.label);
    group.rows.forEach((row) => {
      const amount = amountText(row, units);
      const who = row.forNames?.length ? ` (for ${row.forNames.join(" and ")})` : "";
      lines.push(`- ${row.name}${amount ? `, ${amount}` : ""}${who}`);
    });
    lines.push("");
  });
  return lines.join("\n").trim();
}
