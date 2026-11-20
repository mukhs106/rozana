// Collections: the ones you make, plus two that keep themselves up to date.
// Favourites is a stored collection marked `system: "favourites"`; "Cooked
// recently" is worked out from the cook log and never stored.
import { db } from "@/api/db";
import { addDays } from "@/lib/slots";

export const FAVOURITES = "favourites";
export const RECENT = "recent";

export function favouritesOf(collections = []) {
  return collections.find((item) => item.system === FAVOURITES) || null;
}

export function isFavourite(collections, recipeId) {
  return Boolean(favouritesOf(collections)?.recipe_ids?.includes(recipeId));
}

/** Recipes cooked in the last 30 days, most recent first, each once. */
export function recentlyCookedIds(cookLog = [], today) {
  const since = addDays(today, -30);
  const seen = new Set();
  return [...cookLog]
    .filter((entry) => entry.cooked_on >= since)
    .sort((a, b) => String(b.cooked_on).localeCompare(String(a.cooked_on)))
    .map((entry) => entry.recipe_id)
    .filter((id) => (seen.has(id) ? false : seen.add(id)));
}

/** Every collection to show: automatic ones first, then yours by name. */
export function allCollections(collections = [], cookLog = [], today) {
  const favourites = favouritesOf(collections);
  return [
    { id: FAVOURITES, name: "Favourites", recipe_ids: favourites?.recipe_ids || [], automatic: true },
    { id: RECENT, name: "Cooked recently", recipe_ids: recentlyCookedIds(cookLog, today), automatic: true },
    ...collections.filter((item) => item.system !== FAVOURITES),
  ];
}

export async function toggleInCollection(collection, recipeId) {
  const ids = collection.recipe_ids || [];
  const next = ids.includes(recipeId) ? ids.filter((id) => id !== recipeId) : [...ids, recipeId];
  return db.Collection.update(collection.id, { recipe_ids: next });
}

export async function toggleFavourite(collections, recipeId) {
  const favourites = favouritesOf(collections);
  if (!favourites) return db.Collection.create({ name: "Favourites", system: FAVOURITES, recipe_ids: [recipeId] });
  return toggleInCollection(favourites, recipeId);
}

export async function createCollection(name, recipeIds = []) {
  return db.Collection.create({ name: name.trim(), recipe_ids: recipeIds });
}

/** "Cooked it": one entry in the cook log, which feeds the streak. */
export async function logCooked(recipeId, today, plannedMealId = null) {
  return db.CookLog.create({ recipe_id: recipeId, cooked_on: today, planned_meal_id: plannedMealId });
}
