import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Image } from "@/components/ui/image";
import { useRecipes } from "@/hooks/useKitchen";

/** Every word typed must appear somewhere in the dish: title, subtitle, tags or ingredients. */
function searchText(recipe) {
  return [
    recipe.title,
    recipe.subtitle,
    ...(recipe.tags || []),
    ...(recipe.base_ingredients || []).map((item) => item.name),
  ]
    .join(" ")
    .toLowerCase();
}

export default function SearchSheet({ open, onOpenChange }) {
  const { data: recipes = [] } = useRecipes();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return recipes.filter((recipe) => {
      const text = searchText(recipe);
      return words.every((word) => text.includes(word));
    });
  }, [query, recipes]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="max-h-[100vh] overflow-y-auto border-border bg-background px-5 pb-6 pt-5">
        <SheetTitle className="sr-only">Search recipes</SheetTitle>
        <SheetDescription className="sr-only">Search by dish, ingredient or tag</SheetDescription>
        <label className="mr-10 flex h-12 items-center gap-2 rounded-full bg-sand px-4">
          <Search className="h-5 w-5 shrink-0 text-ink-mid" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Dal, paneer, lunchbox…"
            aria-label="Search recipes"
            className="w-full bg-transparent text-body text-ink outline-none placeholder:text-ink-mid"
          />
        </label>

        {query && !results.length ? (
          <p className="mt-6 text-body text-ink-mid">No dish matches “{query}”.</p>
        ) : null}

        <ul className="mt-4">
          {results.map((recipe) => (
            <li key={recipe.id}>
              <Link
                to="/recipes/$recipeId"
                params={{ recipeId: recipe.id }}
                onClick={() => onOpenChange(false)}
                className="flex min-h-[64px] items-center gap-3 border-t border-border py-2"
              >
                {recipe.image_url ? (
                  <Image src={recipe.image_url} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="h-12 w-12 shrink-0 rounded-xl bg-sand" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-body font-medium">{recipe.title}</span>
                  {recipe.subtitle ? (
                    <span className="block truncate text-small text-ink-mid">{recipe.subtitle}</span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
