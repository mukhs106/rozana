// Building PlannedMeal rows the same way everywhere (Plan my week, "Plan it for
// tonight", the recipe page, the plan's "+", the demo seed): diner ids next to
// names, portions from each person's usual size, and each person's own swaps,
// so the grocery list can say "+100 g tofu for Arjun".
import { resolveBatch } from "@/lib/mealMath";

/**
 * @param recipe   the recipe (with library swaps merged in when swaps are used)
 * @param members  people eating; `portion` on each is their portion for this meal
 * @param options  swapKeys: whole-pot swaps for everyone; personSwaps: { [memberId]: [keys] }
 */
export function plannedMealFor(
  recipe,
  members,
  date,
  type,
  { stamp, swapKeys = [], personSwaps = {}, versionKey = null, anyDay = false } = {},
) {
  const portions = members.map((member) => {
    const own = personSwaps[member.id] || [];
    return {
      diner_id: member.id,
      diner_name: member.name,
      servings: Number(member.portion) || 1,
      swap_keys: Array.from(new Set([...swapKeys, ...own])),
    };
  });
  const total = portions.reduce((sum, portion) => sum + portion.servings, 0);
  const allKeys = Array.from(new Set(portions.flatMap((portion) => portion.swap_keys)));
  const ingredients = resolveBatch(
    recipe,
    versionKey,
    portions.map((portion) => ({ label: portion.diner_name, portions: portion.servings, swapKeys: portion.swap_keys })),
  );

  const row = {
    recipe_id: recipe.id,
    recipe_title: recipe.title,
    image_url: recipe.image_url,
    version_key: versionKey,
    version_name: recipe.title,
    scheduled_date: date,
    any_day: anyDay,
    meal_type: type,
    servings: total,
    diner_names: members.map((member) => member.name),
    portions,
    swap_keys: allKeys,
    swap_names: (recipe.swaps || []).filter((swap) => allKeys.includes(swap.key)).map((swap) => `${swap.from} → ${swap.to}`),
    ingredients: ingredients.map(({ name, qty, unit, allergens }) => ({
      name,
      qty,
      unit,
      allergens: Array.isArray(allergens) ? allergens : null,
    })),
    nutrition: recipe.nutrition || {},
  };
  // Meals saved together share a timestamp: that is what groups them into one batch.
  if (stamp) {
    row.created_date = stamp;
    row.updated_date = stamp;
  }
  return row;
}
