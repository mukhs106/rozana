import { useQuery } from "@tanstack/react-query";
import { db } from "@/api/db";

export function firstNameOf(user) {
  const raw = user?.full_name?.trim() || user?.email?.split("@")[0] || "You";
  return raw.split(" ")[0];
}

export function selfMember(user) {
  return { id: "self", name: firstNameOf(user) || "You", is_self: true, allergies: [], diet: [], goals: {} };
}

export function useRecipes() {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const rows = await db.Recipe.filter({});
      // Drafts written for review are not part of the cook's library yet.
      return [...rows.filter((row) => row.status !== "draft")].sort(
        (a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99) || String(a.title).localeCompare(String(b.title)),
      );
    },
  });
}

export function useHousehold() {
  return useQuery({
    queryKey: ["household"],
    queryFn: async () => {
      const rows = await db.Household.list();
      return rows?.[0] || null;
    },
  });
}

export function usePlannedMeals() {
  return useQuery({
    queryKey: ["planned-meals"],
    queryFn: () => db.PlannedMeal.filter({}),
  });
}

export function useSavedVersions() {
  return useQuery({
    queryKey: ["saved-versions"],
    queryFn: () => db.SavedVersion.filter({}),
  });
}

export function useGroceryItems() {
  return useQuery({
    queryKey: ["grocery-items"],
    queryFn: () => db.GroceryItem.filter({}),
  });
}

export async function ensureHousehold(user) {
  const rows = await db.Household.list();
  if (rows?.[0]) return rows[0];
  return await db.Household.create({
    name: `${firstNameOf(user)}’s kitchen`,
    members: [selfMember(user)],
  });
}

export function membersOf(household, user) {
  const members = household?.members?.length ? household.members : [selfMember(user)];
  return members;
}
export const SETTINGS_DEFAULTS = {
  units: "recipe",
  default_servings: 4,
  auto_scale: true,
  recipe_language: "en",
  staples: ["salt", "oil", "cumin seeds", "turmeric", "red chilli powder", "garam masala"],
};

/** Kitchen settings (one row). Kept in this browser until Supabase; see src/api/db.js. */
export function useUserSettings() {
  return useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const rows = await db.UserSettings.list();
      return { ...SETTINGS_DEFAULTS, ...(rows?.[0] || {}) };
    },
  });
}

/** Every "Cooked it": feeds the streak and keeps Plan my week from repeating. */
export function useCookLog() {
  return useQuery({ queryKey: ["cook-log"], queryFn: () => db.CookLog.list("-cooked_on") });
}

/** Collections the cook made, plus the Favourites one (created on first heart). */
export function useCollections() {
  return useQuery({ queryKey: ["collections"], queryFn: () => db.Collection.list("name") });
}
