// "At the table": one batch, cooked once, with each person's portion and swaps.
//
// A swap is either split by portion (paneer cubes for most plates, tofu cubes
// for Arjun's) or whole-pot (ghee for oil in the tempering can't be split). A
// split swap applies only to the people who need it; a whole-pot swap changes
// the batch for everyone, and the page says so.
import { fitForDiner, hasPhrase } from "@/lib/fit";
import { resolveBatch } from "@/lib/mealMath";
import { librarySwapsFor } from "@/lib/swapLibrary";
import { versionIngredients } from "@/lib/mealMath";
import { formatServings } from "@/lib/allocations";

// Ingredients you can cook or add separately for one plate.
const SPLITTABLE = ["paneer", "tofu", "chicken", "egg", "potato", "chickpea", "cashew", "peanut", "soya chunk",
  "almond", "prawn", "fish", "mushroom", "rice", "roti", "papad", "raita", "curd", "yogurt topping"];

export function isSplittable(swap) {
  if (swap?.split === true) return true;
  if (swap?.split === false) return false;
  return SPLITTABLE.some((word) => hasPhrase(swap?.from, word));
}

/** The recipe with library swaps added, so every swap has a key the batch maths knows. */
export function withLibrarySwaps(recipe, versionKey) {
  const own = recipe?.swaps || [];
  const library = librarySwapsFor(versionIngredients(recipe, versionKey)).filter(
    (item) => !own.some((swap) => swap.key === item.key || (swap.from?.toLowerCase() === item.from && swap.to?.toLowerCase() === item.to.toLowerCase())),
  );
  return { ...recipe, swaps: [...own, ...library] };
}

/**
 * Per-person needs for the people seated. Returns rows of
 * { member, portion, fit, needed: [swap keys], fixedBy: whether all needed swaps are on }.
 */
export function tableRows(recipe, seated, portions, chosen, versionKey) {
  return seated.map((member) => {
    const fit = fitForDiner(recipe, member, versionKey);
    const needed = fit.swaps.filter((swap) => swap.kind !== "version").map((swap) => swap.key).filter(Boolean);
    return {
      member,
      portion: portions[member.id] ?? (Number(member.portion) || 1),
      fit,
      needed,
      fixedBy: needed.length > 0 && needed.every((key) => chosen.includes(key)),
    };
  });
}

/**
 * The ingredient list for the whole batch. Each person is a group with their own
 * swaps; spare portions (for tomorrow's tiffin) cook as the pot does.
 */
export function batchIngredients(recipe, rows, chosen, spare, versionKey) {
  const swaps = recipe.swaps || [];
  const whole = chosen.filter((key) => {
    const swap = swaps.find((item) => item.key === key);
    return swap && !isSplittable(swap);
  });
  const split = chosen.filter((key) => !whole.includes(key));
  // A split swap someone turned on by hand (from an ingredient) with nobody
  // needing it goes to the whole pot.
  const unclaimed = split.filter((key) => !rows.some((row) => row.needed.includes(key)));

  const groups = rows.map((row) => ({
    label: row.member.name,
    portions: row.portion,
    swapKeys: [...whole, ...unclaimed, ...split.filter((key) => row.needed.includes(key))],
  }));
  if (spare > 0) groups.push({ label: "Spare", portions: spare, swapKeys: [...whole, ...unclaimed] });
  if (!groups.length) return [];
  // Keep the recipe's order, with a swapped row right under the one it replaces.
  const order = versionIngredients(recipe, versionKey).map((item) => item.name);
  const position = (row) => order.indexOf(row.sourceName) + (row.swap ? 0.5 : 0);
  return resolveBatch(recipe, versionKey, groups).sort((a, b) => position(a) - position(b));
}

/** "Suhani 1½ + Arjun 1 + Meera ½ = 3 portions. The recipe makes 4, so × 0.75." */
export function batchMaths(rows, spare, baseServings) {
  const people = rows.reduce((total, row) => total + row.portion, 0);
  const total = people + spare;
  const factor = baseServings ? total / baseServings : 1;
  const parts = rows.map((row) => `${row.member.name} ${formatServings(row.portion)}`);
  if (spare > 0) parts.push(`${formatServings(spare)} spare`);
  return {
    people,
    total,
    factor,
    sum: `${parts.join(" + ")} = ${formatServings(total)} ${total === 1 ? "portion" : "portions"}`,
    scale: baseServings
      ? `The recipe makes ${formatServings(baseServings)}, so everything is × ${formatServings(Math.round(factor * 100) / 100)}.`
      : "",
  };
}
