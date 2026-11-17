import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, X } from "lucide-react";
import { db } from "@/api/db";
import AppShell from "@/components/AppShell";
import Pill from "@/components/Pill";
import { Image } from "@/components/ui/image";
import { FitDots } from "@/components/table/FitBadge";
import { membersOf, useCollections, useCookLog, useHousehold, useRecipes } from "@/hooks/useKitchen";
import { allCollections, FAVOURITES, favouritesOf, RECENT, toggleInCollection } from "@/lib/collections";
import { fitForTable } from "@/lib/fit";
import { cookMinutes } from "@/lib/suggest";
import { todayISO } from "@/lib/slots";

export const Route = createFileRoute("/_authed/collections/$collectionId")({
  ssr: false,
  head: () => ({ meta: [{ title: "Collection · Rozana" }] }),
  component: CollectionPage,
});

function CollectionPage() {
  const { collectionId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: recipes = [] } = useRecipes();
  const { data: stored = [], isLoading } = useCollections();
  const { data: cookLog = [] } = useCookLog();
  const { data: household } = useHousehold();
  const members = membersOf(household, user);
  const [confirming, setConfirming] = useState(false);

  const collection = allCollections(stored, cookLog, todayISO()).find((item) => item.id === collectionId);
  // The stored row behind Favourites, so removing a dish edits the real record.
  const storedRow = collectionId === FAVOURITES ? favouritesOf(stored) : stored.find((item) => item.id === collectionId);
  const editable = collectionId !== RECENT && Boolean(storedRow);
  const own = collectionId !== FAVOURITES && collectionId !== RECENT;
  const dishes = (collection?.recipe_ids || []).map((id) => recipes.find((recipe) => recipe.id === id)).filter(Boolean);

  const goBack = () =>
    router.history.canGoBack() ? router.history.back() : router.navigate({ to: "/recipes", search: { tab: "collections" } });

  const remove = async (recipeId) => {
    await toggleInCollection(storedRow, recipeId);
    await queryClient.invalidateQueries({ queryKey: ["collections"] });
  };

  const deleteCollection = async () => {
    await db.Collection.delete(storedRow.id);
    await queryClient.invalidateQueries({ queryKey: ["collections"] });
    toast.success(`Deleted ${storedRow.name}`);
    router.navigate({ to: "/recipes", search: { tab: "collections" } });
  };

  return (
    <AppShell>
      <button
        type="button"
        onClick={goBack}
        className="-ml-2 inline-flex h-11 items-center gap-1 rounded-full pl-1 pr-3 text-body font-medium"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" /> Collections
      </button>

      {!collection && !isLoading ? (
        <h1 className="mt-3 text-display">This collection is no longer here.</h1>
      ) : collection ? (
        <>
          <h1 className="mt-3 text-display">{collection.name}</h1>
          <p className="mt-1 text-body text-ink-mid">
            {dishes.length} {dishes.length === 1 ? "dish" : "dishes"}
            {collectionId === RECENT ? " cooked in the last 30 days" : ""}
          </p>

          {dishes.length ? (
            <ul className="mt-4">
              {dishes.map((recipe) => {
                const minutes = cookMinutes(recipe);
                return (
                  <li key={recipe.id} className="flex items-center gap-3 border-t border-border py-3">
                    <Link to="/recipes/$recipeId" params={{ recipeId: recipe.id }} className="flex min-w-0 flex-1 items-center gap-3">
                      {recipe.image_url ? (
                        <Image src={recipe.image_url} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                      ) : (
                        <span className="h-16 w-16 shrink-0 rounded-2xl bg-sand" />
                      )}
                      <span className="min-w-0">
                        <span className="block text-body font-semibold">{recipe.title}</span>
                        <span className="flex flex-wrap items-center gap-x-2">
                          {minutes ? <span className="text-small text-ink-mid">{minutes} min ·</span> : null}
                          <FitDots table={fitForTable(recipe, members)} />
                        </span>
                      </span>
                    </Link>
                    {editable ? (
                      <button
                        type="button"
                        onClick={() => remove(recipe.id)}
                        aria-label={`Remove ${recipe.title} from ${collection.name}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-mid hover:bg-sand"
                      >
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-6 rounded-2xl bg-sand p-4 text-body text-ink-soft">
              {collectionId === RECENT
                ? "Tap “Cooked it” on a recipe and it shows up here."
                : "Nothing here yet. Use Save on any recipe to add it."}
            </p>
          )}

          {own && storedRow ? (
            confirming ? (
              <div className="mt-8 rounded-2xl border border-border p-4">
                <p className="text-body">Delete “{storedRow.name}”? The recipes stay in your library.</p>
                <div className="mt-3 flex gap-2">
                  <Pill variant="soft" className="flex-1" onClick={() => setConfirming(false)}>
                    Keep it
                  </Pill>
                  <Pill className="flex-1" onClick={deleteCollection}>
                    Delete
                  </Pill>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="mt-8 h-11 text-body font-medium text-status-cant"
              >
                Delete this collection
              </button>
            )
          ) : null}
        </>
      ) : null}
    </AppShell>
  );
}
