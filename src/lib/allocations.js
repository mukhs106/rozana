// Portion allocation. A meal holds one servings value per diner, so a single
// person can eat 1.5 while everyone else eats 1.
import { mealLabel } from "@/lib/slots";
import { formatQty } from "@/lib/mealMath";

/** Portions as people say them: 1½, 3¾, 2. */
export function formatServings(value) {
  const n = Math.round((Number(value) || 0) * 100) / 100;
  return Number.isInteger(n) ? String(n) : formatQty(n);
}

export function sumServings(portions = {}) {
  return Object.values(portions).reduce((total, value) => total + (Number(value) || 0), 0);
}

export function mealPortions(meal) {
  if (Array.isArray(meal?.portions)) {
    return meal.portions.reduce((total, portion) => total + (Number(portion.servings) || 0), 0);
  }
  if (meal?.portions && typeof meal.portions === "object") return sumServings(meal.portions);
  return Number(meal?.servings) || 0;
}

export function dinerNamesOf(meal) {
  if (Array.isArray(meal?.portions)) return meal.portions.map((portion) => portion.diner_name);
  return meal?.diner_names || [];
}

/** "1 portion for Suhani" — the useful half of a meal row. */
export function portionPhrase(meal) {
  const total = mealPortions(meal);
  const count = `${formatServings(total)} ${total === 1 ? "portion" : "portions"}`;
  const names = dinerNamesOf(meal);
  if (!names.length) return `${count} for you`;
  if (names.length === 1) return `${count} for ${names[0]}`;
  if (names.length === 2) return `${count} for ${names[0]} and ${names[1]}`;
  return `${count} for ${names[0]} and ${names.length - 1} more`;
}

export function batchPortions(meals = []) {
  return meals.reduce((total, meal) => total + mealPortions(meal), 0);
}

export function portionsByType(meals = []) {
  const rows = [];
  meals.forEach((meal) => {
    const found = rows.find((row) => row.type === meal.type);
    if (found) found.portions += mealPortions(meal);
    else rows.push({ type: meal.type, portions: mealPortions(meal) });
  });
  return rows;
}

/** "2 dinner · 2.5 lunch" */
export function typeBreakdown(meals = []) {
  return portionsByType(meals)
    .map((row) => `${formatServings(row.portions)} ${mealLabel(row.type).toLowerCase()}`)
    .join(" · ");
}

/** "You 1.5× · Ana" */
export function dinersLine(meal, diners = []) {
  if (!diners.length) return "No one yet";
  return diners
    .map((diner) => {
      const servings = Number(meal?.portions?.[diner.id] ?? 1);
      return servings === 1 ? diner.name : `${diner.name} ${formatServings(servings)}×`;
    })
    .join(" · ");
}

/** Keeps every meal's portion map in step with who is eating. */
export function withDiners(meals, dinerIds) {
  return meals.map((meal) => {
    const portions = {};
    dinerIds.forEach((id) => {
      portions[id] = meal.portions?.[id] ?? 1;
    });
    return { ...meal, portions };
  });
}