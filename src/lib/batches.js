// A batch is one cooking session that can land in more than one meal slot.
// Meals saved together share a signature; Plan and Today count the batch once.
import { compareSlots, mealLabel } from "@/lib/slots";
import { mealPortions } from "@/lib/allocations";
import { resolveBatch } from "@/lib/mealMath";

// Portions are left out on purpose: tonight's dinner and tomorrow's lunch from one
// cook often have different portions, and every total here sums per meal anyway.
export function batchKey(meal) {
  const stamp = String(meal.created_date || "").slice(0, 16);
  const swaps = (meal.swap_keys || []).slice().sort().join("+");
  return [meal.recipe_id, meal.version_key || "", swaps, stamp].join("|");
}

export function groupBatches(meals = []) {
  const groups = new Map();
  meals.forEach((meal) => {
    const key = batchKey(meal);
    const group =
      groups.get(key) ||
      {
        key,
        recipe_id: meal.recipe_id,
        recipe_title: meal.recipe_title,
        version_key: meal.version_key,
        version_name: meal.version_name,
        image_url: meal.image_url,
        swap_keys: meal.swap_keys || [],
        meals: [],
      };
    group.meals.push(meal);
    groups.set(key, group);
  });

  return Array.from(groups.values())
    .map((group) => {
      const sorted = [...group.meals].sort(compareSlots);
      return {
        ...group,
        meals: sorted,
        servings: sorted.reduce((total, meal) => total + mealPortions(meal), 0),
      };
    })
    .sort((a, b) => compareSlots(a.meals[0], b.meals[0]));
}

/**
 * Grocery quantities come from the saved portions and swaps, resolved against
 * the recipe, so a batch that covers dinner and lunch is measured once.
 */
export function batchIngredients(batch, recipe) {
  if (recipe) {
    return resolveBatch(
      recipe,
      batch.version_key,
      batch.meals.map((meal) => ({
        label: mealLabel(meal.meal_type),
        portions: mealPortions(meal),
        swapKeys: meal.swap_keys || [],
      })),
    );
  }
  return batch.meals[0]?.ingredients || [];
}

/** "Dinner tonight + lunch tomorrow" for a batch that spans slots. */
export function batchSlots(batch, phrase) {
  return batch.meals.map((meal) => phrase(meal.scheduled_date, meal.meal_type)).join(" + ");
}