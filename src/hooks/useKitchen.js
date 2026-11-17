import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

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
      const rows = await base44.entities.Recipe.filter({});
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
      const rows = await base44.entities.Household.list();
      return rows?.[0] || null;
    },
  });
}

export function usePlannedMeals() {
  return useQuery({
    queryKey: ["planned-meals"],
    queryFn: () => base44.entities.PlannedMeal.filter({}),
  });
}

export function useSavedVersions() {
  return useQuery({
    queryKey: ["saved-versions"],
    queryFn: () => base44.entities.SavedVersion.filter({}),
  });
}

export function useGroceryItems() {
  return useQuery({
    queryKey: ["grocery-items"],
    queryFn: () => base44.entities.GroceryItem.filter({}),
  });
}

export async function ensureHousehold(user) {
  const rows = await base44.entities.Household.list();
  if (rows?.[0]) return rows[0];
  return await base44.entities.Household.create({
    name: `${firstNameOf(user)}’s kitchen`,
    members: [selfMember(user)],
  });
}

export function membersOf(household, user) {
  const members = household?.members?.length ? household.members : [selfMember(user)];
  return members;
}