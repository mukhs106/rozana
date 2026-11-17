import { Link } from "@tanstack/react-router";
import { Image } from "@/components/ui/image";
import { FitDots } from "@/components/table/FitBadge";
import { cookMinutes } from "@/lib/suggest";

/** One category shelf: a heading and a sideways row of large photo cards. */
export default function Shelf({ shelf }) {
  return (
    <section aria-labelledby={`shelf-${shelf.key}`} className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <h2 id={`shelf-${shelf.key}`} className="text-title">
          {shelf.title}
        </h2>
        <Link to="/recipes" className="flex h-11 shrink-0 items-center text-body font-medium text-primary">
          See all
        </Link>
      </div>
      <ul className="-mx-5 mt-2 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-1">
        {shelf.rows.map(({ recipe, table }) => {
          const minutes = cookMinutes(recipe);
          return (
            <li key={recipe.id} className="w-[232px] shrink-0 snap-start">
              <Link to="/recipes/$recipeId" params={{ recipeId: recipe.id }} className="block">
                {recipe.image_url ? (
                  <Image src={recipe.image_url} alt="" className="aspect-[4/3] w-full rounded-2xl bg-sand object-cover" />
                ) : (
                  <span className="block aspect-[4/3] w-full rounded-2xl bg-sand" />
                )}
                <span className="mt-2 block text-body font-semibold">{recipe.title}</span>
                <span className="flex flex-wrap items-center gap-x-2">
                  {minutes ? <span className="text-small text-ink-mid">{minutes} min ·</span> : null}
                  <FitDots table={table} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
