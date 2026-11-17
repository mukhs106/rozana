import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { LunchboxIcon, PlateIcon } from "@/components/icons/AppIcons";
import ConflictRows from "@/components/make/ConflictRows";
import { Image } from "@/components/ui/image";
import { formatServings, portionPhrase } from "@/lib/allocations";
import { versionAddsInfo } from "@/lib/foodInfo";
import { slotPhrase } from "@/lib/slots";

/**
 * One cooking session, however many slots it fills. The dish is named once and
 * each meal it covers is a compact row underneath.
 */
export default function BatchGroup({ batch, conflicts = [], onRemove }) {
  const version = versionAddsInfo(batch.recipe_title, batch.version_name);

  return (
    <li className="border-t border-border py-4">
      <div className="flex gap-3">
        <Image
          src={batch.image_url}
          alt={batch.recipe_title}
          className="h-14 w-14 shrink-0 rounded-[6px] object-cover"
        />
        <div className="min-w-0 flex-1">
          <Link
            to="/recipes/$recipeId"
            params={{ recipeId: batch.recipe_id }}
            search={{ version: batch.version_key, portions: batch.meals[0]?.servings }}
            className="block font-serif text-[19px] leading-tight"
          >
            {batch.recipe_title}
          </Link>
          {version ? <p className="mt-0.5 text-[12.5px] text-ink-mid">{version}</p> : null}
          <p className="mt-0.5 text-[12.5px] text-ink-mid">
            {batch.meals.length > 1
              ? `One batch across ${batch.meals.length} meals · ${formatServings(batch.servings)} portions`
              : portionPhrase(batch.meals[0])}
          </p>
        </div>
      </div>

      <ul className="mt-1">
        {batch.meals.map((meal) => {
          const Icon = meal.meal_type === "lunch" ? LunchboxIcon : PlateIcon;
          return (
            <li key={meal.id} className="flex items-center gap-2 border-t border-border py-2 text-[13px]">
              <Icon className="h-4 w-4 shrink-0 text-ink-mid" />
              <span className="min-w-0 flex-1 leading-snug">
                {slotPhrase(meal.scheduled_date, meal.meal_type)}
                <span className="text-ink-mid"> · {portionPhrase(meal)}</span>
              </span>
              <button
                type="button"
                onClick={() => onRemove(meal)}
                aria-label={`Remove ${meal.recipe_title} from ${slotPhrase(meal.scheduled_date, meal.meal_type)}`}
                className="shrink-0 p-1 text-ink-mid transition-colors hover:text-chili"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </li>
          );
        })}
      </ul>

      {conflicts.length ? (
        <div className="mt-2">
          <ConflictRows conflicts={conflicts} />
        </div>
      ) : null}
    </li>
  );
}