import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { portionPhrase } from "@/lib/allocations";
import { slotPhrase } from "@/lib/slots";

/** "Also covers lunch tomorrow · 1 portion for Suhani" — a connection, not another dish. */
export default function BatchConnectionRow({ meal }) {
  return (
    <Link
      to="/recipes/$recipeId"
      params={{ recipeId: meal.recipe_id }}
      search={{ version: meal.version_key, portions: meal.servings }}
      className="flex items-center gap-2 py-2.5 text-body"
    >
      <span className="min-w-0 flex-1 leading-snug text-ink-soft">
        Also covers <span className="font-medium text-ink">{slotPhrase(meal.scheduled_date, meal.meal_type).toLowerCase()}</span>
        {" · "}
        {portionPhrase(meal)}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-mid" strokeWidth={2} />
    </Link>
  );
}