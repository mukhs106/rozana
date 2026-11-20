import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Image } from "@/components/ui/image";
import { parseISODate } from "@/lib/slots";
import { weekDays } from "@/lib/suggest";
import { cn } from "@/lib/utils";

const DAY = new Intl.DateTimeFormat("en-GB", { weekday: "short" });

/** Monday to Sunday at a glance: tonight's dinner (or lunch) per day, or a gap to fill. */
export default function WeekStrip({ meals = [], today }) {
  const days = weekDays(today);
  const mealFor = (date) =>
    meals.find((meal) => meal.scheduled_date === date && meal.meal_type === "dinner") ||
    meals.find((meal) => meal.scheduled_date === date);

  return (
    <section aria-labelledby="week-title" className="mt-10">
      <div className="flex items-center justify-between gap-3">
        <h2 id="week-title" className="text-title">
          This week
        </h2>
        <Link to="/plan" className="flex h-11 shrink-0 items-center text-body font-medium text-primary">
          Open plan
        </Link>
      </div>
      <ul className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1">
        {days.map((date) => {
          const meal = mealFor(date);
          const isToday = date === today;
          const past = date < today;
          return (
            <li key={date} className={cn("w-[92px] shrink-0", past && "opacity-60")}>
              <Link to="/plan" className="block">
                <span className={cn("block text-small", isToday ? "font-semibold text-primary" : "text-ink-mid")}>
                  {isToday ? "Today" : DAY.format(parseISODate(date))} {parseISODate(date).getDate()}
                </span>
                {meal ? (
                  <>
                    {meal.image_url ? (
                      <Image src={meal.image_url} alt="" className="mt-1 aspect-square w-full rounded-2xl bg-sand object-cover" />
                    ) : (
                      <span className="mt-1 block aspect-square w-full rounded-2xl bg-sand" />
                    )}
                    <span className="mt-1 line-clamp-2 block text-small font-medium text-ink">{meal.recipe_title}</span>
                  </>
                ) : past ? (
                  <span className="mt-1 block aspect-square w-full rounded-2xl bg-sand" aria-label="Nothing was planned" />
                ) : (
                  <span className="mt-1 flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-ink-mid/40 text-ink-mid">
                    <Plus className="h-5 w-5" aria-label="Nothing planned yet" />
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
