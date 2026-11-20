// The fit engine: for one recipe and one person, does the dish fit them, need a
// swap, need a check, or is it something they can't eat? Every answer is a rule
// you could follow by hand. No AI, no guessing.
//
// Safety rules (docs/REDESIGN-PLAN.md §5):
// - An ingredient with no allergen data is UNKNOWN, never clear.
// - People are matched by id, never by name.
// - Names match whole words: "egg" never matches "eggplant", "nut" never "nutmeg".
// - The interface never calls a dish "safe".
import { versionIngredients } from "@/lib/mealMath";
import { SWAP_LIBRARY } from "@/lib/swapLibrary";
import { DIET_PRESETS } from "@/lib/diet";

export const FIT = { FITS: "fits", SWAP: "swap", CHECK: "check", CANT: "cant" };

export const FIT_LABELS = {
  fits: "Fits",
  swap: "Needs a swap",
  check: "Needs a check",
  cant: "Can't eat this",
};

// ---------------------------------------------------------------------------
// Words

/** Lowercase words of a name: "Rajma (kidney beans)" → ["rajma", "kidney", "beans"]. */
export function wordsOf(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function singular(word) {
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith("oes")) return word.slice(0, -2);
  if (word.endsWith("es") && /(ch|sh|x|ss)es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

/**
 * Whole-word (and whole-phrase) match, tolerant of plurals.
 * hasPhrase("Aubergine / eggplant", "egg") → false; hasPhrase("2 boiled eggs", "egg") → true.
 */
export function hasPhrase(text, phrase) {
  const words = wordsOf(text).map(singular);
  const target = wordsOf(phrase).map(singular);
  if (!target.length || words.length < target.length) return false;
  for (let i = 0; i + target.length <= words.length; i += 1) {
    if (target.every((word, j) => words[i + j] === word)) return true;
  }
  return false;
}

const anyPhrase = (text, phrases) => phrases.some((phrase) => hasPhrase(text, phrase));

// ---------------------------------------------------------------------------
// What an ingredient contains. A small, hand-written dictionary of South Asian
// pantry words. Anything it does not know, and that carries no tags, is unknown.

const CONTAINS = {
  dairy: ["milk", "cream", "malai", "ghee", "butter", "paneer", "chhena", "yogurt", "yoghurt", "curd", "dahi",
    "khoya", "khoa", "mawa", "cheese", "buttermilk", "chaas", "lassi", "condensed milk", "whey", "makhan"],
  gluten: ["wheat", "atta", "maida", "semolina", "sooji", "suji", "rava", "barley", "rye", "bread", "roti",
    "naan", "pasta", "noodle", "seitan", "dalia", "vermicelli", "sevai",
    // Most hing sold in South Asian shops is cut with wheat flour.
    "hing", "asafoetida"],
  nuts: ["cashew", "kaju", "almond", "badam", "pistachio", "pista", "walnut", "akhrot", "chironji", "charoli",
    "hazelnut", "pecan", "macadamia"],
  peanuts: ["peanut", "groundnut", "moongphali", "mungfali"],
  soy: ["soy", "soya", "tofu", "tempeh", "edamame", "soy sauce"],
  egg: ["egg", "anda"],
  fish: ["fish", "salmon", "tuna", "rohu", "hilsa", "ilish", "pomfret", "surmai", "bangda", "mackerel",
    "sardine", "anchovy", "fish sauce"],
  shellfish: ["prawn", "shrimp", "jhinga", "crab", "lobster", "mussel", "clam", "squid"],
  sesame: ["sesame", "til", "tahini", "gingelly"],
};

// Phrases whose words would otherwise mislead: "coconut milk" is not dairy,
// "peanut butter" is peanuts, not dairy. Each is read as the word on the right.
const READ_AS = [
  ["coconut milk", "coconut"],
  ["coconut cream", "coconut"],
  ["coconut yogurt", "coconut"],
  ["coconut yoghurt", "coconut"],
  ["oat milk", "oats"],
  ["rice milk", "rice"],
  ["almond milk", "almond"],
  ["cashew milk", "cashew"],
  ["cashew cream", "cashew"],
  ["soy milk", "soy"],
  ["soya milk", "soy"],
  ["peanut butter", "peanut"],
  ["cocoa butter", "cocoa"],
  ["vegan butter", "plant spread"],
  ["vegan cheese", "plant cheese"],
];

/** The name with misleading phrases rewritten, for matching only. */
function readableName(name) {
  let text = ` ${wordsOf(name).join(" ")} `;
  READ_AS.forEach(([phrase, as]) => {
    text = text.replace(new RegExp(` ${phrase.replace(/ /g, "s? ")}s? `, "g"), ` ${as} `);
  });
  return text.trim();
}

const MEAT = ["chicken", "mutton", "lamb", "goat", "beef", "pork", "keema", "bacon", "ham", "turkey", "duck",
  "gelatin", "stock cube"];
const HONEY = ["honey"];

// Known to contain none of the allergens above.
const KNOWN_CLEAR = [
  "water", "salt", "black salt", "sugar", "jaggery", "gur", "rice", "basmati", "poha", "onion", "shallot",
  "garlic", "ginger", "ginger garlic paste", "tomato", "potato", "sweet potato", "peas", "matar", "cauliflower",
  "gobi", "cabbage", "okra", "bhindi", "aubergine", "eggplant", "baingan", "brinjal", "spinach", "palak",
  "methi", "fenugreek", "carrot", "beetroot", "radish", "mooli", "pumpkin", "bottle gourd", "lauki", "karela",
  "bitter gourd", "capsicum", "bell pepper", "beans", "green beans", "kidney beans", "rajma", "chickpea",
  "chana", "kabuli chana", "lentil", "dal", "toor", "arhar", "masoor", "moong", "mung", "urad", "chana dal",
  "besan", "gram flour", "rice flour", "cornflour", "corn", "makki", "millet", "bajra", "jowar", "ragi",
  "coriander", "cilantro", "dhania", "mint", "pudina", "curry leaf", "curry leaves", "bay leaf", "cumin",
  "jeera", "mustard seed", "rai", "turmeric", "haldi", "chilli", "chili", "green chilli", "red chilli",
  "kashmiri chilli", "chilli powder", "paprika", "garam masala", "chaat masala", "kitchen king", "sambar powder",
  "pav bhaji masala", "coriander powder", "cumin powder", "fennel", "saunf", "ajwain", "carom", "cardamom",
  "elaichi", "clove", "laung", "cinnamon", "dalchini", "black pepper", "peppercorn", "nutmeg", "mace",
  "star anise", "kasuri methi", "amchur", "mango powder", "tamarind", "imli", "kokum", "lemon", "lime",
  "vinegar", "oil", "sunflower oil", "mustard oil", "vegetable oil", "olive oil",
  "coconut", "coconut milk", "coconut oil", "desiccated coconut", "mushroom", "cucumber", "zucchini", "apple",
  "banana", "mango", "raisin", "kishmish", "dates", "jackfruit", "drumstick", "yam", "arbi",
  "colocasia", "sweetcorn", "spring onion", "leek", "celery", "kale", "lettuce", "garlic paste", "ginger paste",
];

const DIET_ALLERGENS = {
  vegan: ["dairy", "egg", "fish", "shellfish"],
  "dairy-free": ["dairy"],
  "gluten-free": ["gluten"],
  "nut-free": ["nuts", "peanuts"],
};

/** Normalise an allergy or tag word to one of the keys above. */
export function allergenWord(raw) {
  const text = String(raw || "").toLowerCase().trim();
  if (!text) return null;
  if (CONTAINS[text]) return text;
  if (text === "tree nuts" || text === "tree nut" || text === "nut") return "nuts";
  if (text === "peanut") return "peanuts";
  if (text === "milk" || text === "lactose") return "dairy";
  if (text === "wheat" || text === "wheat / gluten" || text === "wheat/gluten") return "gluten";
  if (text === "eggs") return "egg";
  if (text === "soya") return "soy";
  for (const [key, words] of Object.entries(CONTAINS)) if (anyPhrase(text, words)) return key;
  return text;
}

/**
 * What one ingredient contains. `known` is false when nobody has recorded it and
 * the dictionary does not recognise it: that is "unknown", never "clear".
 */
export function ingredientFacts(ingredient) {
  const name = ingredient?.name || "";
  const read = readableName(name);
  const tagged = Array.isArray(ingredient?.allergens) ? ingredient.allergens.map(allergenWord).filter(Boolean) : [];
  const fromName = Object.entries(CONTAINS)
    .filter(([, words]) => anyPhrase(read, words))
    .map(([key]) => key);
  const allergens = Array.from(new Set([...tagged, ...fromName]));
  const meat = anyPhrase(read, MEAT);
  const known =
    allergens.length > 0 ||
    meat ||
    anyPhrase(read, KNOWN_CLEAR) ||
    anyPhrase(read, ["oats", "cocoa", "plant spread", "plant cheese"]) ||
    ingredient?.allergens_checked === true;
  return { name, allergens, known, meat, honey: anyPhrase(read, HONEY) };
}

// ---------------------------------------------------------------------------
// One person's rules

const JAIN_DEFAULT_AVOID = DIET_PRESETS.find((preset) => preset.key === "jain")?.avoid || [];

/** The hard rules (must hold) and soft ones (dislikes) for one diner. */
export function rulesFor(member) {
  const diet = (member?.diet || []).map((item) => String(item).toLowerCase());
  const allergies = new Set((member?.allergies || []).map(allergenWord).filter(Boolean));
  diet.forEach((key) => (DIET_ALLERGENS[key] || []).forEach((allergen) => allergies.add(allergen)));

  const vegan = diet.includes("vegan");
  const vegetarian = vegan || diet.includes("vegetarian") || diet.includes("jain");
  const eggOk = diet.includes("egg") && !vegan; // eggetarian
  const avoid = new Set((member?.avoid || []).map((item) => String(item).toLowerCase()).filter(Boolean));
  if (diet.includes("jain") && !avoid.size) JAIN_DEFAULT_AVOID.forEach((item) => avoid.add(item));
  if (diet.includes("no onion garlic") || diet.includes("no-onion-garlic")) ["onion", "garlic"].forEach((item) => avoid.add(item));

  return {
    allergies,
    vegetarian,
    vegan,
    eggOk,
    avoid: Array.from(avoid),
    dislikes: (member?.dislikes || []).map((item) => String(item).toLowerCase()).filter(Boolean),
    hasHardRules: allergies.size > 0 || vegetarian || avoid.size > 0,
  };
}

/** Every hard rule an ingredient breaks for these rules, as short reasons. */
function breaks(facts, rules) {
  const reasons = [];
  facts.allergens.forEach((allergen) => {
    if (rules.allergies.has(allergen)) reasons.push({ kind: "allergy", label: allergen });
  });
  if (rules.vegetarian && facts.meat) reasons.push({ kind: "diet", label: "meat" });
  if (rules.vegetarian && !rules.eggOk && facts.allergens.includes("egg") && !rules.allergies.has("egg")) {
    reasons.push({ kind: "diet", label: "egg" });
  }
  if (rules.vegetarian && facts.allergens.some((a) => a === "fish" || a === "shellfish") &&
      !rules.allergies.has("fish") && !rules.allergies.has("shellfish")) {
    reasons.push({ kind: "diet", label: "fish" });
  }
  if (rules.vegan && facts.honey) reasons.push({ kind: "diet", label: "honey" });
  rules.avoid.forEach((word) => {
    if (hasPhrase(facts.name, word)) reasons.push({ kind: "avoid", label: word });
  });
  return reasons;
}

// ---------------------------------------------------------------------------
// Swaps that could fix a broken rule

function swapMatches(swap, ingredientName) {
  if (!swap?.from || !ingredientName) return false;
  if ((swap.exclude || []).some((word) => hasPhrase(ingredientName, word))) return false;
  return hasPhrase(ingredientName, swap.from);
}

/** The ingredient as it would be after a swap: new name, allergens moved by removes/adds. */
function afterSwap(facts, swap) {
  const removes = (swap.removes || []).map(allergenWord);
  const adds = (swap.adds || []).map(allergenWord).filter(Boolean);
  const replacement = ingredientFacts({ name: swap.to });
  // What the swap says it removes wins over words in its own name ("Coconut
  // yogurt" removes dairy); what it says it adds always counts.
  const kept = [...replacement.allergens, ...facts.allergens].filter((allergen) => !removes.includes(allergen));
  return {
    ...replacement,
    allergens: Array.from(new Set([...kept, ...adds])),
    known: replacement.known || adds.length > 0 || removes.length > 0,
  };
}

function swapCandidates(recipe, ingredientName) {
  const own = (recipe?.swaps || []).filter((swap) => swapMatches(swap, ingredientName));
  const library = SWAP_LIBRARY.filter(
    (swap) => swapMatches(swap, ingredientName) && !own.some((item) => item.to === swap.to),
  );
  return [...own, ...library];
}

// ---------------------------------------------------------------------------
// The verdicts

/**
 * One person, one dish. Returns { status, reasons[], swaps[], unknown[], dislikes[] }.
 * - reasons: what breaks (before swaps)
 * - swaps: the first swap that fixes each broken ingredient
 * - unknown: ingredients nobody has recorded, when this person has rules they could break
 */
export function fitForDiner(recipe, member, versionKey) {
  return evaluate(recipe, member, versionKey, true);
}

function evaluate(recipe, member, versionKey, tryVersions) {
  const rules = rulesFor(member);
  const ingredients = versionIngredients(recipe, versionKey);
  const result = { memberId: member?.id, status: FIT.FITS, reasons: [], swaps: [], unknown: [], dislikes: [], blockers: [] };

  ingredients.forEach((ingredient) => {
    const facts = ingredientFacts(ingredient);
    rules.dislikes.forEach((word) => {
      if (hasPhrase(facts.name, word)) result.dislikes.push(facts.name);
    });
    if (!rules.hasHardRules) return;

    const broken = breaks(facts, rules);
    if (broken.length) {
      result.reasons.push(...broken.map((reason) => ({ ...reason, ingredient: facts.name })));
      const fix = swapCandidates(recipe, facts.name).find((swap) => {
        const next = afterSwap(facts, swap);
        return breaks(next, rules).length === 0;
      });
      if (fix) result.swaps.push({ ...fix, ingredient: facts.name });
      else result.blockers.push(facts.name);
      return;
    }
    if (!facts.known) result.unknown.push(facts.name);
  });

  // A whole version of the dish can also clear everything (e.g. "Tofu version").
  if (tryVersions && result.blockers.length && (recipe?.variations || []).length) {
    const version = recipe.variations.find((item) => {
      if (item.key === versionKey) return false;
      const other = evaluate(recipe, member, item.key, false);
      return other.status === FIT.FITS || other.status === FIT.CHECK;
    });
    if (version) {
      result.blockers = [];
      result.swaps = [{ key: version.key, kind: "version", to: version.name, from: recipe.title }];
    }
  }

  if (result.blockers.length) result.status = FIT.CANT;
  else if (result.swaps.length) result.status = FIT.SWAP;
  else if (result.unknown.length) result.status = FIT.CHECK;
  result.dislikes = Array.from(new Set(result.dislikes));
  return result;
}

/**
 * A whole table. Returns per-person verdicts (keyed by member id) and counts:
 * fits, swap, check, cant, swapCount (distinct swaps), and canEat (all but "can't").
 */
export function fitForTable(recipe, members = [], versionKey) {
  const people = members.map((member) => ({ member, ...fitForDiner(recipe, member, versionKey) }));
  const count = (status) => people.filter((person) => person.status === status).length;
  const swapKeys = new Set(people.flatMap((person) => person.swaps.map((swap) => swap.key || swap.to)));
  return {
    people,
    total: people.length,
    fits: count(FIT.FITS),
    swap: count(FIT.SWAP),
    check: count(FIT.CHECK),
    cant: count(FIT.CANT),
    swapCount: swapKeys.size,
    canEat: people.length - count(FIT.CANT),
  };
}

/** "Fits 3 of 4", "Fits all 4", plus swaps when they are needed. */
export function fitSummary(table) {
  if (!table?.total) return "";
  const head = table.fits === table.total ? `Fits all ${table.total}` : `Fits ${table.fits} of ${table.total}`;
  if (table.swapCount) return `${head} · ${table.swapCount} ${table.swapCount === 1 ? "swap" : "swaps"}`;
  return head;
}

/** Diners eating a planned meal: by id first, by name only for plans saved before ids existed. */
export function dinersOfMeal(meal, members = []) {
  const portions = Array.isArray(meal?.portions) ? meal.portions : [];
  const byId = portions.map((portion) => members.find((member) => member.id === portion.diner_id)).filter(Boolean);
  if (byId.length) return byId;
  const names = portions.length ? portions.map((portion) => portion.diner_name) : meal?.diner_names || [];
  return members.filter((member) => names.includes(member.name));
}
