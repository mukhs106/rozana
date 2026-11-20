// Shortcuts and shelves. Every list here is a filter or a score over the data the
// household already has: diners, recipes, the plan, the pantry, what was cooked.
// Same inputs, same answer. No AI. The rules are written out in
// docs/REDESIGN-PLAN.md §4 and §5.
import { FIT, fitForTable, hasPhrase, wordsOf } from "@/lib/fit";
import { versionIngredients } from "@/lib/mealMath";
import { addDays, parseISODate, toISODate } from "@/lib/slots";

// Ingredients too basic to count when matching a pantry.
const TRIVIAL = ["water", "salt", "sugar", "oil", "ice"];

export function cookMinutes(recipe) {
  const value = Number(recipe?.cook_minutes);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Library order first, then title: the tie-break every list uses. */
function stableOrder(a, b) {
  return (a.sort_order ?? 99) - (b.sort_order ?? 99) || String(a.title).localeCompare(String(b.title));
}

/** Recipes nobody at this table is blocked from (or at most `allowBlocked` people). */
function eatable(recipes, members, allowBlocked = 0) {
  return recipes
    .map((recipe) => ({ recipe, table: fitForTable(recipe, members) }))
    .filter((row) => row.table.cant <= allowBlocked);
}

/** Names of the people who can't eat a dish, for an honest line on the card. */
export function blockedNames(table) {
  return table.people.filter((person) => person.status === FIT.CANT).map((person) => person.member.name);
}

// ---------------------------------------------------------------------------
// Feeds everyone

/** Recipes everyone can eat, fewest swaps first, then fewest checks, then quickest. */
export function feedsEveryone(recipes, members) {
  return eatable(recipes, members).sort(
    (a, b) =>
      a.table.swapCount - b.table.swapCount ||
      a.table.check - b.table.check ||
      (cookMinutes(a.recipe) ?? 999) - (cookMinutes(b.recipe) ?? 999) ||
      stableOrder(a.recipe, b.recipe),
  );
}

// ---------------------------------------------------------------------------
// Cook from my pantry

/** Pantry = staples from settings + grocery items marked "have". */
export function pantryOf(groceries = [], staples = []) {
  const fromList = groceries
    .filter((item) => item.status === "have")
    .map((item) => item.display_name || item.name)
    .filter(Boolean);
  return Array.from(new Set([...staples, ...fromList].map((item) => String(item).toLowerCase())));
}

function inPantry(ingredientName, pantry) {
  return pantry.some((item) => hasPhrase(ingredientName, item) || hasPhrase(item, ingredientName));
}

/** How much of a recipe the pantry covers, ignoring water, salt and the like. */
export function pantryMatch(recipe, pantry) {
  const counted = versionIngredients(recipe).filter((item) => !TRIVIAL.some((word) => hasPhrase(item.name, word)));
  const have = counted.filter((item) => inPantry(item.name, pantry));
  const missing = counted.filter((item) => !inPantry(item.name, pantry)).map((item) => item.name);
  return { have: have.length, total: counted.length, share: counted.length ? have.length / counted.length : 0, missing };
}

// Pantry and Use it up also show dishes one person can't eat (ranked after the
// rest and labelled), because a strict diet, like Jain, can rule out almost
// everything and leave these lists empty.
export function cookFromPantry(recipes, members, pantry) {
  return eatable(recipes, members, 1)
    .map((row) => ({ ...row, pantry: pantryMatch(row.recipe, pantry) }))
    .filter((row) => row.pantry.have > 0)
    .sort(
      (a, b) =>
        a.table.cant - b.table.cant ||
        b.pantry.share - a.pantry.share ||
        a.pantry.missing.length - b.pantry.missing.length ||
        a.table.swapCount - b.table.swapCount ||
        stableOrder(a.recipe, b.recipe),
    );
}

// ---------------------------------------------------------------------------
// Use it up

/** Pantry items marked leftover or use soon, with how urgent each is. */
export function itemsToUseSoon(groceries = [], today) {
  return groceries
    .filter((item) => item.status === "have" && (item.use_soon || item.leftover))
    .map((item) => {
      const name = item.display_name || item.name;
      const urgent = item.use_by ? item.use_by <= addDays(today, 2) : false;
      return { name, urgent, leftover: Boolean(item.leftover), use_by: item.use_by || null };
    });
}

export function rankUseItUp(recipes, members, items) {
  return eatable(recipes, members, 1)
    .map((row) => {
      const ingredients = versionIngredients(row.recipe);
      const used = items.filter((item) => ingredients.some((ing) => hasPhrase(ing.name, item.name) || hasPhrase(item.name, ing.name)));
      const score = used.reduce((total, item) => total + (item.urgent ? 2 : 1), 0);
      return { ...row, used, score };
    })
    .filter((row) => row.score > 0)
    .sort(
      (a, b) =>
        a.table.cant - b.table.cant ||
        b.score - a.score ||
        a.table.swapCount - b.table.swapCount ||
        (cookMinutes(a.recipe) ?? 999) - (cookMinutes(b.recipe) ?? 999) ||
        stableOrder(a.recipe, b.recipe),
    );
}

// ---------------------------------------------------------------------------
// Variety helpers

const MAINS = [
  ["dal", ["dal", "lentil", "toor", "masoor", "moong", "urad", "arhar"]],
  ["beans", ["rajma", "kidney bean", "chickpea", "chana", "lobia"]],
  ["paneer", ["paneer"]],
  ["soya", ["soya", "tofu"]],
  ["chicken", ["chicken"]],
  ["egg", ["egg"]],
  ["fish", ["fish", "prawn"]],
  ["rice", ["rice", "basmati"]],
];

/** The ingredient a dish is "about", for spreading a week out. */
export function mainOf(recipe) {
  const text = `${recipe?.title || ""} ${(versionIngredients(recipe)[0] || {}).name || ""}`;
  const hit = MAINS.find(([, words]) => words.some((word) => hasPhrase(text, word)));
  return hit ? hit[0] : wordsOf(recipe?.title)[0] || "other";
}

// ---------------------------------------------------------------------------
// Shelves

const tagged = (recipe, ...tags) => (recipe.tags || []).some((tag) => tags.includes(String(tag).toLowerCase()));
const mentions = (recipe, words) =>
  words.some((word) => hasPhrase(recipe.title, word) || versionIngredients(recipe).some((item) => hasPhrase(item.name, word)));

export const SHELVES = [
  {
    key: "weeknight-dal-chawal",
    title: "Weeknight dal-chawal",
    test: (recipe) =>
      tagged(recipe, "everyday") && (cookMinutes(recipe) ?? 99) <= 40 && mentions(recipe, ["dal", "lentil", "rice", "khichdi"]),
  },
  { key: "tiffin-ready", title: "Tiffin-ready", test: (recipe) => tagged(recipe, "lunchbox") || (tagged(recipe, "everyday") && !mentions(recipe, ["water", "stock", "milk"]) && (cookMinutes(recipe) ?? 99) <= 35) },
  {
    key: "better-on-day-two",
    title: "Better on day two",
    test: (recipe) => tagged(recipe, "comfort", "one pot") && (cookMinutes(recipe) ?? 0) >= 30,
  },
  { key: "one-pot-every-plate", title: "One pot, every plate", test: (recipe, ctx) => ctx.table(recipe).fits === ctx.table(recipe).total },
  {
    key: "sabzi-on-the-side",
    title: "Sabzi on the side",
    test: (recipe) =>
      tagged(recipe, "vegan", "vegetarian") &&
      !mentions(recipe, ["dal", "lentil", "rajma", "chicken", "egg", "paneer", "rice"]) &&
      (cookMinutes(recipe) ?? 99) <= 40,
  },
  { key: "twenty-minute-tadka", title: "Twenty-minute tadka", test: (recipe) => (cookMinutes(recipe) ?? 99) <= 20 || tagged(recipe, "quick") },
  {
    key: "protein-for-the-table",
    title: "Protein for the whole table",
    test: (recipe, ctx) => tagged(recipe, "high protein") && ctx.table(recipe).canEat >= ctx.table(recipe).total - 1,
  },
  { key: "sunday-slow-cooks", title: "Sunday slow cooks", test: (recipe) => tagged(recipe, "weekend") || (cookMinutes(recipe) ?? 0) >= 60 },
  {
    key: "down-south",
    title: "Down south",
    test: (recipe) => tagged(recipe, "south indian") || /kerala|tamil|udupi|andhra|chettinad/i.test(`${recipe.cuisine} ${recipe.title}`),
  },
  { key: "festive-and-mithai", title: "Festive and mithai", test: (recipe) => tagged(recipe, "festive", "sweet", "mithai") },
];

/** Shelves with at least `min` recipes, each sorted by who it fits, then speed. */
export function buildShelves(recipes, members, min = 3) {
  const cache = new Map();
  const table = (recipe) => {
    if (!cache.has(recipe.id)) cache.set(recipe.id, fitForTable(recipe, members));
    return cache.get(recipe.id);
  };
  const ctx = { table };
  return SHELVES.map((shelf) => {
    const rows = recipes
      .filter((recipe) => shelf.test(recipe, ctx))
      .map((recipe) => ({ recipe, table: table(recipe) }))
      .sort(
        (a, b) =>
          b.table.fits - a.table.fits ||
          a.table.cant - b.table.cant ||
          (cookMinutes(a.recipe) ?? 999) - (cookMinutes(b.recipe) ?? 999) ||
          stableOrder(a.recipe, b.recipe),
      );
    return { ...shelf, rows };
  }).filter((shelf) => shelf.rows.length >= min);
}

// ---------------------------------------------------------------------------
// Plan my week

/** Monday of the week that holds `dateISO`. */
export function weekStart(dateISO) {
  const date = parseISODate(dateISO);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return toISODate(date);
}

export function weekDays(dateISO) {
  const monday = weekStart(dateISO);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

function isWeekend(dateISO) {
  const day = parseISODate(dateISO).getDay();
  return day === 0 || day === 6;
}

/**
 * Fills each empty dinner from today to Sunday. For each day, every recipe nobody
 * is blocked from gets a score, the best wins, and the week so far feeds the
 * next day's variety penalty. Returns [{ date, pick, alternatives, why }].
 *
 * Score = 100
 *   − 15 per swap needed − 10 per person who needs a check
 *   − 1 per 3 minutes over 40 on a weekday
 *   − 40 if cooked or planned in the last 7 days
 *   − 20 if its main ingredient is already in this week
 *   − 10 if it shares a shelf with a dish already this week
 *   + 5 if the pantry covers at least half of it
 *   − 5 per person who dislikes something in it
 *   − 50 per person who can't eat it (only matters when nothing suits everyone)
 * A dish is never picked twice in one draft.
 */
export function planWeek({ recipes, members, meals = [], cookLog = [], pantry = [], today }) {
  const days = weekDays(today).filter((day) => day >= today);
  const taken = new Set(meals.filter((meal) => meal.meal_type === "dinner").map((meal) => meal.scheduled_date));
  const empty = days.filter((day) => !taken.has(day));

  const recentIds = new Set([
    ...cookLog.filter((entry) => entry.cooked_on >= addDays(today, -7)).map((entry) => entry.recipe_id),
    ...meals.filter((meal) => meal.scheduled_date >= addDays(today, -7)).map((meal) => meal.recipe_id),
  ]);
  const thisWeek = meals.filter((meal) => days.includes(meal.scheduled_date) || meal.scheduled_date >= weekStart(today));
  const weekRecipes = thisWeek.map((meal) => recipes.find((recipe) => recipe.id === meal.recipe_id)).filter(Boolean);
  // Only shelves that need no table context, so the week is judged on the dish itself.
  const shelvesOf = (recipe) =>
    SHELVES.filter((shelf) => shelf.test.length < 2 && shelf.test(recipe)).map((shelf) => shelf.key);

  const candidates = recipes.map((recipe) => ({ recipe, table: fitForTable(recipe, members) }));
  const chosen = [...weekRecipes];
  const usedIds = new Set(recentIds);

  return empty.map((date) => {
    const mains = new Set(chosen.map(mainOf));
    const shelfKeys = new Set(chosen.flatMap(shelvesOf));
    const draftIds = new Set(chosen.slice(weekRecipes.length).map((recipe) => recipe.id));
    const scored = candidates
      .filter(({ recipe }) => !draftIds.has(recipe.id))
      .map(({ recipe, table }) => {
        const minutes = cookMinutes(recipe);
        const why = [];
        let score = 100;
        score -= 50 * table.cant;
        score -= 15 * table.swapCount;
        score -= 10 * table.check;
        score -= 5 * table.people.filter((person) => person.dislikes.length).length;
        if (!isWeekend(date) && minutes && minutes > 40) score -= Math.floor((minutes - 40) / 3);
        if (usedIds.has(recipe.id)) score -= 40;
        if (mains.has(mainOf(recipe))) score -= 20;
        if (shelvesOf(recipe).some((key) => shelfKeys.has(key))) score -= 10;
        const cover = pantryMatch(recipe, pantry);
        if (cover.share >= 0.5) {
          score += 5;
          why.push("mostly in your pantry");
        }
        const blocked = blockedNames(table);
        if (blocked.length) why.unshift(`${blocked.join(" and ")} can't eat this`);
        else if (table.fits === table.total) why.unshift("fits everyone");
        else if (table.swapCount) why.unshift(`${table.swapCount} ${table.swapCount === 1 ? "swap" : "swaps"}`);
        if (minutes) why.push(`${minutes} min`);
        return { recipe, table, score, why };
      })
      .sort((a, b) => b.score - a.score || stableOrder(a.recipe, b.recipe));

    const pick = scored[0] || null;
    if (pick) {
      chosen.push(pick.recipe);
      usedIds.add(pick.recipe.id);
    }
    return { date, pick, alternatives: scored.slice(1, 6) };
  });
}

export { FIT };
