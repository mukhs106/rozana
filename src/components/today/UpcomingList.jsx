import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { Image } from "@/components/ui/image";
import { portionPhrase } from "@/lib/allocations";
import { versionAddsInfo } from "@/lib/foodInfo";
import { slotPhrase } from "@/lib/slots";

/** The rest of the plan, one row per batch, so no dish repeats itself. */
export default function UpcomingList({ batches = [], title = "Later in your plan" }) {
  if (!batches.length) return null;

  return (
    <section className="mt-9">
      <h2 className="text-heading leading-tight">{title}</h2>
      <ul className="mt-1">
        {batches.map((batch) => {
          const meal = batch.meals[0];
          const version = versionAddsInfo(batch.recipe_title, batch.version_name);
          return (
            <li key={batch.key} className="border-t border-border">
              <Link
                to="/recipes/$recipeId"
                params={{ recipeId: batch.recipe_id }}
                search={{ version: batch.version_key, portions: meal.servings }}
                className="flex items-center gap-3 py-3"
              >
                <Image src={batch.image_url} alt={batch.recipe_title} className="h-12 w-12 shrink-0 rounded-[6px] object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block text-body font-medium leading-tight">{batch.recipe_title}</span>
                  <span className="mt-0.5 block text-small leading-snug text-ink-mid">
                    {batch.meals.map((item) => slotPhrase(item.scheduled_date, item.meal_type)).join(" + ")}
                    {" · "}
                    {portionPhrase(meal)}
                  </span>
                  {version && batch.meals.length === 1 ? (
                    <span className="mt-0.5 block text-small text-ink-mid">{version}</span>
                  ) : null}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-mid" strokeWidth={2} />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}