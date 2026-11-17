/**
 * The one shape the AI returns ingredient data in, shared by the recipe reader
 * (import) and the library tools, so imported, enriched and drafted recipes all
 * describe ingredients the same way.
 */
export const ALLERGENS = [
  "gluten",
  "dairy",
  "egg",
  "tree_nuts",
  "peanut",
  "soy",
  "sesame",
  "mustard",
  "fish",
  "shellfish",
  "celery",
];

export const UNITS = ["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "piece", "pinch", "clove", "bunch", ""];

const UNIT_ALIASES = {
  teaspoon: "tsp",
  teaspoons: "tsp",
  tsps: "tsp",
  t: "tsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tbsps: "tbsp",
  tbsp: "tbsp",
  cups: "cup",
  c: "cup",
  gram: "g",
  grams: "g",
  gms: "g",
  kilogram: "kg",
  kilograms: "kg",
  kilos: "kg",
  millilitre: "ml",
  milliliter: "ml",
  millilitres: "ml",
  milliliters: "ml",
  litre: "l",
  liter: "l",
  litres: "l",
  liters: "l",
  cloves: "clove",
  bunches: "bunch",
  pieces: "piece",
  pinch: "pinch",
  pinches: "pinch",
  can: "piece",
  cans: "piece",
  tin: "piece",
  tins: "piece",
  slice: "piece",
  slices: "piece",
  sprig: "bunch",
  sprigs: "bunch",
};

export const DIET_FLAGS = ["vegetarian", "vegan", "jain", "satvik", "contains_onion_garlic"];

const DIET_PROPS = Object.fromEntries(DIET_FLAGS.map((flag) => [flag, { type: "boolean" }]));

export const INGREDIENT_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    qty: { type: "number" },
    unit: { type: "string", enum: UNITS },
    prep: { type: "string" },
    allergens: { type: "array", items: { type: "string", enum: ALLERGENS } },
    diet: { type: "object", properties: DIET_PROPS, required: DIET_FLAGS },
    confidence: { type: "number" },
  },
  required: ["name", "qty", "unit", "prep", "allergens", "diet", "confidence"],
};

export const NUTRITION_SCHEMA = {
  type: "object",
  properties: {
    kcal: { type: "number" },
    protein: { type: "number" },
    carbs: { type: "number" },
    fat: { type: "number" },
    fibre: { type: "number" },
  },
  required: ["kcal", "protein", "carbs", "fat", "fibre"],
};

export const INGREDIENT_LIST_SCHEMA = {
  type: "object",
  properties: { ingredients: { type: "array", items: INGREDIENT_SCHEMA } },
  required: ["ingredients"],
};

export const ENRICH_SCHEMA = {
  type: "object",
  properties: {
    ingredients: { type: "array", items: INGREDIENT_SCHEMA },
    nutrition: NUTRITION_SCHEMA,
  },
  required: ["ingredients", "nutrition"],
};

export const IMPORT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    servings: { type: "number" },
    cook_minutes: { type: "number" },
    image_url: { type: "string" },
    ingredients: { type: "array", items: INGREDIENT_SCHEMA },
    instructions: { type: "array", items: { type: "string" } },
  },
  required: ["title", "ingredients", "instructions"],
};

export const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    subtitle: { type: "string" },
    description: { type: "string" },
    servings: { type: "number" },
    cook_minutes: { type: "number" },
    heat_level: { type: "number" },
    ingredients: { type: "array", items: INGREDIENT_SCHEMA },
    instructions: { type: "array", items: { type: "string" } },
    nutrition: NUTRITION_SCHEMA,
    adapts_for: { type: "string" },
  },
  required: ["title", "ingredients", "instructions", "adapts_for"],
};

/** Draft dishes the owner can add to the library, in one pass. */
export const DRAFT_LIBRARY = [
  "rajma",
  "chole",
  "sambar",
  "rasam",
  "khichdi",
  "kadhi",
  "baingan bharta",
  "bhindi masala",
  "matar paneer",
  "egg curry",
  "chicken curry",
  "keema",
  "poha",
  "upma",
  "lemon rice",
  "jeera rice",
  "raita",
  "aloo paratha",
  "vegetable pulao",
  "moong dal",
];

/** "1 1/2", "½", "1 to 2" and 2 all become one number. */
export function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const raw = String(value ?? "").trim();
  if (!raw) return 0;
  const range = raw.match(/(\d+(?:[.,]\d+)?)\s*(?:to|-|–|—)\s*(\d+(?:[.,]\d+)?)/i);
  if (range) return Number(range[2].replace(",", ".")) || 0;
  const mixed = raw.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = raw.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fraction && Number(fraction[2])) return Number(fraction[1]) / Number(fraction[2]);
  const plain = raw.match(/\d+(?:[.,]\d+)?/);
  return plain ? Number(plain[0].replace(",", ".")) || 0 : 0;
}

export function normalizeUnit(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return "";
  if (UNITS.includes(raw)) return raw;
  return UNIT_ALIASES[raw] ?? "";
}

const allergenKey = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

/** One ingredient from the model, clamped to the allowed units, allergens and flags. */
export function normalizeIngredient(raw = {}) {
  const diet = {};
  DIET_FLAGS.forEach((flag) => {
    diet[flag] = Boolean(raw.diet?.[flag]);
  });
  const allergens = Array.isArray(raw.allergens)
    ? Array.from(new Set(raw.allergens.map(allergenKey).filter((item) => ALLERGENS.includes(item))))
    : [];
  const confidence = Number(raw.confidence);
  return {
    name: String(raw.name ?? "").trim(),
    qty: toNumber(raw.qty),
    unit: normalizeUnit(raw.unit),
    prep: String(raw.prep ?? "").trim(),
    allergens,
    diet,
    confidence: Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0,
  };
}

/** Per-serving nutrition, with anything the model left out stored as 0 (shown as unavailable). */
export function normalizeNutrition(raw = {}) {
  const number = (value) => {
    const qty = toNumber(value);
    return qty > 0 ? Math.round(qty * 10) / 10 : 0;
  };
  return {
    kcal: number(raw?.kcal),
    protein: number(raw?.protein),
    carbs: number(raw?.carbs),
    fat: number(raw?.fat),
    fibre: number(raw?.fibre),
  };
}

export const needsReview = (ingredients = []) => ingredients.some((item) => !(item.confidence >= 0.8));

/**
 * A structured ingredient as the app's own ingredient row. An empty allergen
 * list is left off entirely, which the app reads as "no allergen information",
 * never as a claim that the ingredient is free of them.
 */
export function baseIngredientFrom(raw) {
  const ingredient = normalizeIngredient(raw);
  const row = { name: ingredient.name, qty: ingredient.qty, unit: ingredient.unit };
  if (ingredient.prep) row.note = ingredient.prep;
  if (ingredient.allergens.length) row.allergens = ingredient.allergens;
  return row;
}

/** A dish counts as present when a library title and the requested name contain each other. */
export function alreadyInLibrary(name, titles = []) {
  const want = String(name || "").toLowerCase().trim();
  if (!want) return true;
  return titles.some((title) => {
    const have = String(title || "").toLowerCase().trim();
    return Boolean(have) && (have.includes(want) || want.includes(have));
  });
}

const RULES = `Rules for every ingredient:
- name: the shopping name, with no amounts or prep words.
- qty: one number. Fractions become decimals (1/2 -> 0.5, 1 1/2 -> 1.5). For ranges ("1 to 2", "2-3", "2 or 3") use the upper value. "to taste" -> 1 with unit "pinch".
- unit: exactly one of g, kg, ml, l, tsp, tbsp, cup, piece, pinch, clove, bunch, or "" when there is no unit. teaspoon -> tsp, tablespoon -> tbsp, cups -> cup, cloves -> clove, bunches -> bunch.
- prep: a short prep note such as "finely chopped", or "" when there is none.
- allergens: only from gluten, dairy, egg, tree_nuts, peanut, soy, sesame, mustard, fish, shellfish, celery. Flag the hidden ones: hing or asafoetida usually carries wheat flour (gluten); ghee, paneer, curd, yogurt, cream and milk are dairy; ghee is never vegan; gram flour and semolina and wheat flour are gluten; soy sauce carries gluten and soy; mustard seeds are mustard; peanuts are peanut; cashew, almond and pistachio are tree_nuts. The words "eggplant", "egg-free" and "eggless" are not egg. Return an empty list only when you are confident the ingredient holds none of these, and never guess egg from a dish name.
- diet: booleans vegetarian, vegan (no dairy, ghee, honey or egg), jain (no onion, garlic, egg, meat, and no root vegetables such as potato, carrot, beetroot, radish), satvik (vegetarian, no onion, no garlic), contains_onion_garlic.
- confidence: 0 to 1 for the qty, unit and allergen reading of that line.`;

export function enrichPrompt({ title, servings, lines, method }) {
  return [
    "You are structuring ingredient lines from an Indian home recipe for a meal-planning app.",
    `Dish: ${title || "Untitled"}. The recipe makes ${servings || "an unstated number of"} servings.`,
    "",
    "Ingredient lines, one per line:",
    ...lines.map((line) => `- ${line}`),
    "",
    method ? `Method, for context only:\n${method}` : "",
    "",
    RULES,
    "",
    'Return one ingredient object per line above, in the same order, with the same count. Do not add or merge lines.',
    "Also return nutrition per serving for the finished dish as cooked: kcal, protein, carbs, fat, fibre (fibre in grams). Estimate from the amounts, not from claims in the text.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function ingredientPrompt(lines) {
  return [
    "You are structuring ingredient lines read from a recipe page for a meal-planning app.",
    "Convert each line exactly as written. Do not invent amounts that the line does not give; if a line has no amount, return qty 0.",
    "",
    "Ingredient lines, one per line:",
    ...lines.map((line) => `- ${line}`),
    "",
    RULES,
    "",
    "Return one ingredient object per line above, in the same order, with the same count.",
  ].join("\n");
}

export function draftPrompt(name) {
  return [
    `Write a complete everyday Indian home recipe for "${name}" for a meal-prep app where people cook in batches.`,
    "Use a normal Indian pantry and amounts that scale cleanly. Be practical, not restaurant-styled.",
    "",
    "Return:",
    "- title: the dish name, capitalised normally.",
    "- subtitle: one short line about the dish.",
    "- description: two sentences a cook would recognise the dish by.",
    "- servings: 4.",
    "- cook_minutes: realistic total time.",
    "- heat_level: 0 for none, 1 mild, 2 medium, 3 hot.",
    "- instructions: 6 to 10 short steps in order, each one sentence a cook can follow.",
    "- adapts_for: one or two sentences naming the exact swaps that make this dish vegan, Jain, dairy-free or gluten-free (for example \"Vegan with coconut oil instead of ghee; Jain without onion and garlic and with paneer left out; gluten-free as written\").",
    "- nutrition per serving for the finished dish: kcal, protein, carbs, fat, fibre (fibre in grams).",
    "",
    RULES,
  ].join("\n");
}