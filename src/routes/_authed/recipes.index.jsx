import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import AppShell from "@/components/AppShell";
import RecipeCard from "@/components/recipes/RecipeCard";
import AddRecipeSheet from "@/components/recipes/AddRecipeSheet";
import { calloutFor, householdRules } from "@/lib/foodInfo";
import { useHousehold, useRecipes } from "@/hooks/useKitchen";

export const Route = createFileRoute("/_authed/recipes/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Recipes · Rozana" }] }),
  component: RecipesPage,
});

function RecipesPage() {
  const { data: recipes = [], isLoading } = useRecipes();
  const { data: household } = useHousehold();
  const rules = householdRules(household);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <AppShell surface="paper">
      <h1 className="max-w-[16ch] text-display leading-[1.02] text-oxblood">Familiar dishes, ready to adapt</h1>

      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className="mt-5 flex w-full items-center gap-3 border-y border-border py-3 text-left"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border">
          <Plus className="h-4 w-4" strokeWidth={2.4} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body font-medium leading-tight">Add recipe</span>
          <span className="mt-0.5 block text-small text-ink-mid">Paste a link or add it by hand</span>
        </span>
      </button>

      <div className="mt-6 grid grid-cols-2 gap-x-3.5 gap-y-6">
        {isLoading
          ? [0, 1, 2, 3].map((key) => (
              <div key={key} className="animate-pulse">
                <div className="aspect-square w-full rounded-[8px] bg-secondary" />
                <div className="mt-3 h-3 w-2/3 rounded bg-secondary" />
              </div>
            ))
          : recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} callout={calloutFor(recipe, rules)} />
            ))}
      </div>

      {!isLoading && !recipes.length ? (
        <p className="mt-6 border-t border-border pt-4 text-body leading-relaxed text-ink-mid">
          No recipes yet. Add the first one and it becomes the dish Today suggests.
        </p>
      ) : null}

      <AddRecipeSheet open={addOpen} onOpenChange={setAddOpen} />
    </AppShell>
  );
}