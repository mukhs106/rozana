import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDownUp, Plus, Search, SlidersHorizontal } from "lucide-react";
import AppShell from "@/components/AppShell";
import AddRecipeSheet from "@/components/recipes/AddRecipeSheet";
import Pill from "@/components/Pill";
import { Image } from "@/components/ui/image";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { FitDots } from "@/components/table/FitBadge";
import { membersOf, useCollections, useCookLog, useHousehold, useRecipes } from "@/hooks/useKitchen";
import { allCollections, createCollection } from "@/lib/collections";
import { FIT, fitForDiner, fitForTable } from "@/lib/fit";
import { cookMinutes } from "@/lib/suggest";
import { todayISO } from "@/lib/slots";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authed/recipes/")({
  ssr: false,
  validateSearch: (search) => ({ tab: search.tab === "collections" ? "collections" : "recipes" }),
  head: () => ({ meta: [{ title: "Recipes · Rozana" }] }),
  component: RecipesPage,
});

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "quickest", label: "Quickest" },
  { key: "fits", label: "Fits my table" },
];

// Diet filters ask: could someone with only this rule eat it (with swaps)?
const DIETS = [
  { key: "vegetarian", label: "Vegetarian", member: { diet: ["vegetarian"] } },
  { key: "vegan", label: "Vegan", member: { diet: ["vegan"] } },
  { key: "jain", label: "Jain", member: { diet: ["vegetarian", "jain"] } },
  { key: "gluten-free", label: "Gluten-free", member: { diet: ["gluten-free"] } },
  { key: "dairy-free", label: "Dairy-free", member: { diet: ["dairy-free"] } },
  { key: "nut-free", label: "Nut-free", member: { diet: ["nut-free"] } },
];

function searchText(recipe) {
  return [recipe.title, recipe.subtitle, ...(recipe.tags || []), ...(recipe.base_ingredients || []).map((item) => item.name)]
    .join(" ")
    .toLowerCase();
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-11 shrink-0 rounded-full px-4 text-body font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-sand text-ink hover:bg-sand/70",
      )}
    >
      {children}
    </button>
  );
}

function RecipesPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { data: recipes = [], isLoading } = useRecipes();
  const { data: household } = useHousehold();
  const { data: stored = [] } = useCollections();
  const { data: cookLog = [] } = useCookLog();
  const members = membersOf(household, user);

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [dinerFilter, setDinerFilter] = useState([]);
  const [dietFilter, setDietFilter] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const tables = useMemo(
    () => new Map(recipes.map((recipe) => [recipe.id, fitForTable(recipe, members)])),
    [recipes, members],
  );

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    const list = recipes.filter((recipe) => {
      if (words.length && !words.every((word) => searchText(recipe).includes(word))) return false;
      const table = tables.get(recipe.id);
      if (dinerFilter.some((id) => table.people.find((person) => person.member.id === id)?.status === FIT.CANT)) return false;
      if (dietFilter.some((key) => fitForDiner(recipe, DIETS.find((diet) => diet.key === key).member).status === FIT.CANT)) return false;
      return true;
    });
    const by = {
      newest: (a, b) => String(b.created_date || "").localeCompare(String(a.created_date || "")),
      quickest: (a, b) => (cookMinutes(a) ?? 999) - (cookMinutes(b) ?? 999),
      fits: (a, b) => {
        const x = tables.get(a.id);
        const y = tables.get(b.id);
        return y.fits - x.fits || x.cant - y.cant || x.swapCount - y.swapCount;
      },
    };
    return [...list].sort((a, b) => by[sort](a, b) || String(a.title).localeCompare(String(b.title)));
  }, [recipes, query, sort, dinerFilter, dietFilter, tables]);

  const collections = allCollections(stored, cookLog, todayISO());
  const filterCount = dinerFilter.length + dietFilter.length;
  const toggle = (list, setList, key) => setList(list.includes(key) ? list.filter((item) => item !== key) : [...list, key]);

  return (
    <AppShell>
      <div role="tablist" aria-label="Library" className="flex gap-6 border-b border-border">
        {[
          ["recipes", "Recipes"],
          ["collections", "Collections"],
        ].map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => navigate({ search: { tab: key }, replace: true })}
            className={cn(
              "-mb-px h-12 border-b-2 text-heading",
              tab === key ? "border-primary text-ink" : "border-transparent font-medium text-ink-mid",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "recipes" ? (
        <>
          <label className="mt-4 flex h-12 items-center gap-2 rounded-full bg-sand px-4">
            <Search className="h-5 w-5 shrink-0 text-ink-mid" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search dishes or ingredients"
              aria-label="Search recipes"
              className="w-full bg-transparent text-body outline-none placeholder:text-ink-mid"
            />
          </label>

          <div className="-mx-5 mt-3 flex items-center gap-2 overflow-x-auto px-5 pb-1">
            <span className="flex shrink-0 items-center text-ink-mid" aria-hidden="true">
              <ArrowDownUp className="h-5 w-5" />
            </span>
            {SORTS.map((item) => (
              <Chip key={item.key} active={sort === item.key} onClick={() => setSort(item.key)}>
                {item.label}
              </Chip>
            ))}
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-border px-4 text-body font-medium"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Filter{filterCount ? ` · ${filterCount}` : ""}
            </button>
          </div>

          <p className="mt-2 text-small text-ink-mid" aria-live="polite">
            {isLoading ? "Loading…" : `${shown.length} ${shown.length === 1 ? "dish" : "dishes"}`}
          </p>

          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-5">
            <li>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-mid/40 bg-sand/50 text-ink"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-background">
                  <Plus className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="text-body font-semibold">Add a recipe</span>
                <span className="text-small text-ink-mid">From a link or by hand</span>
              </button>
            </li>
            {shown.map((recipe) => {
              const minutes = cookMinutes(recipe);
              return (
                <li key={recipe.id}>
                  <Link to="/recipes/$recipeId" params={{ recipeId: recipe.id }} className="block">
                    <span className="relative block">
                      {recipe.image_url ? (
                        <Image src={recipe.image_url} alt="" className="aspect-square w-full rounded-2xl bg-sand object-cover" />
                      ) : (
                        <span className="block aspect-square w-full rounded-2xl bg-sand" />
                      )}
                      {minutes ? (
                        <span className="absolute bottom-2 left-2 rounded-full bg-background px-2.5 py-0.5 text-small font-semibold">
                          {minutes} min
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-2 line-clamp-2 block text-body font-semibold leading-5">{recipe.title}</span>
                    <FitDots table={tables.get(recipe.id)} className="mt-1" />
                  </Link>
                </li>
              );
            })}
          </ul>

          {!isLoading && !shown.length ? (
            <div className="mt-6 rounded-2xl bg-sand p-4">
              <p className="text-body">No dish matches those filters.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setDinerFilter([]);
                  setDietFilter([]);
                }}
                className="mt-1 h-11 text-body font-semibold text-primary"
              >
                Clear search and filters
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-5">
            {collections.map((collection) => {
              const photos = (collection.recipe_ids || [])
                .map((id) => recipes.find((recipe) => recipe.id === id)?.image_url)
                .filter(Boolean)
                .slice(0, 4);
              return (
                <li key={collection.id}>
                  <Link to="/collections/$collectionId" params={{ collectionId: collection.id }} className="block">
                    <span className="grid aspect-square w-full grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-2xl bg-sand">
                      {photos.map((src, index) => (
                        <Image
                          key={src + index}
                          src={src}
                          alt=""
                          className={cn("h-full w-full object-cover", photos.length === 1 && "col-span-2 row-span-2")}
                        />
                      ))}
                    </span>
                    <span className="mt-2 block text-body font-semibold">{collection.name}</span>
                    <span className="block text-small text-ink-mid">
                      {(collection.recipe_ids || []).length} {(collection.recipe_ids || []).length === 1 ? "dish" : "dishes"}
                      {collection.automatic ? " · automatic" : ""}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <form
            className="mt-8 flex gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!newName.trim()) return;
              await createCollection(newName);
              await queryClient.invalidateQueries({ queryKey: ["collections"] });
              toast.success(`Made ${newName.trim()}`);
              setNewName("");
            }}
          >
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="New collection, e.g. Tiffin rotation"
              aria-label="New collection name"
              className="h-12 min-w-0 flex-1 rounded-full bg-sand px-4 text-body outline-none placeholder:text-ink-mid focus-visible:ring-2 focus-visible:ring-primary"
            />
            <Pill type="submit" size="sm" disabled={!newName.trim()}>
              Create
            </Pill>
          </form>
          <p className="mt-2 text-small text-ink-mid">
            Favourites fills from the heart on any recipe. Cooked recently fills from “Cooked it”.
          </p>
        </>
      )}

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[88vh] overflow-y-auto rounded-t-3xl border-border bg-background px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6"
        >
          <SheetTitle className="pr-12 text-title">Filter</SheetTitle>
          <SheetDescription className="mt-1 text-body text-ink-mid">
            Show dishes these people can eat, with swaps if needed.
          </SheetDescription>
          <p className="mt-5 text-small font-medium text-ink-mid">Who’s eating</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {members.map((member) => (
              <Chip key={member.id} active={dinerFilter.includes(member.id)} onClick={() => toggle(dinerFilter, setDinerFilter, member.id)}>
                {member.name}
              </Chip>
            ))}
          </div>
          <p className="mt-5 text-small font-medium text-ink-mid">Diet</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DIETS.map((diet) => (
              <Chip key={diet.key} active={dietFilter.includes(diet.key)} onClick={() => toggle(dietFilter, setDietFilter, diet.key)}>
                {diet.label}
              </Chip>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <Pill
              variant="soft"
              className="flex-1"
              onClick={() => {
                setDinerFilter([]);
                setDietFilter([]);
              }}
            >
              Clear
            </Pill>
            <Pill className="flex-1" onClick={() => setFiltersOpen(false)}>
              Show {shown.length}
            </Pill>
          </div>
        </SheetContent>
      </Sheet>

      <AddRecipeSheet open={addOpen} onOpenChange={setAddOpen} />
    </AppShell>
  );
}
