// Building PlannedMeal rows the same way everywhere (Plan my week, "Plan it for
// tonight", the demo seed): diner ids next to names, portions from each
// person's usual portion size, quantities resolved from the recipe.
import { resolveIngredients } from "@/lib/mealMath";

export function plannedMealFor(recipe, members, date, type, { stamp, swapKeys = [], versionKey = null } = {}) {
  const portions = members.map((member) => ({
    diner_id: member.id,
    diner_name: member.name,
    servings: Number(member.portion) || 1,
  }));
  const total = portions.reduce((sum, portion) => sum + portion.servings, 0);
  const row = {
    recipe_id: recipe.id,
    recipe_title: recipe.title,
    image_url: recipe.image_url,
    version_key: versionKey,
    version_name: recipe.title,
    scheduled_date: date,
    meal_type: type,
    servings: total,
    diner_names: members.map((member) => member.name),
    portions,
    swap_keys: swapKeys,
    swap_names: [],
    ingredients: resolveIngredients(recipe, versionKey, total, swapKeys).map(({ name, qty, unit, allergens }) => ({
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
