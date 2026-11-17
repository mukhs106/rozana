import { Link } from "@tanstack/react-router";
import Pill from "@/components/Pill";
import { Image } from "@/components/ui/image";
import BatchConnectionRow from "@/components/today/BatchConnectionRow";
import { portionPhrase } from "@/lib/allocations";
import { versionAddsInfo } from "@/lib/foodInfo";
import { slotPhrase } from "@/lib/slots";

/**
 * The next planned meal: one short crop, the dish named once, then the context
 * that decides whether someone starts cooking now.
 */
export default function PlannedMealCard({ meal, siblings = [] }) {
  const version = versionAddsInfo(meal.recipe_title, meal.version_name);

  return (
    <section>
      <div className="-mx-5 overflow-hidden bg-secondary">
        <Image
          src={meal.image_url}
          alt={meal.recipe_title}
          className="h-[200px] w-full object-cover object-center sm:h-[250px]"
        />
      </div>

      <h1 className="mt-4 font-semibold text-display leading-[1.03]">{meal.recipe_title}</h1>
      <p className="mt-1.5 text-body leading-snug text-ink-soft">
        {slotPhrase(meal.scheduled_date, meal.meal_type)} · {portionPhrase(meal)}
      </p>
      {version ? <p className="mt-1 text-body text-ink-mid">{version}</p> : null}

      <Pill
        as={Link}
        to="/recipes/$recipeId"
        params={{ recipeId: meal.recipe_id }}
        search={{ version: meal.version_key, portions: meal.servings }}
        className="mt-4 w-full"
      >
        View prep
      </Pill>

      {siblings.length ? (
        <div className="mt-3 border-t border-border">
          {siblings.map((sibling) => (
            <BatchConnectionRow key={sibling.id} meal={sibling} />
          ))}
        </div>
      ) : null}
    </section>
  );
}