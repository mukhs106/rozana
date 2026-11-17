import { useEffect } from "react";
import { usePlannedMeals } from "@/hooks/useKitchen";
import { usePrefs } from "@/hooks/usePrefs";
import { dinerNamesOf, mealPortions } from "@/lib/allocations";
import { parseISODate } from "@/lib/slots";

/**
 * Prep and lunchbox reminders. They fire through the browser's notification
 * API, on this device's clock, and only while Rozana is open: there is no push
 * service behind the web build yet. Every schedule is rebuilt whenever a meal
 * moves, a meal is removed, or a reminder is switched off, so nothing stale
 * survives.
 */
function reminderTime(meal, kind) {
  const day = parseISODate(meal.scheduled_date);
  if (Number.isNaN(day.getTime())) return null;
  if (kind === "prep" && meal.meal_type === "dinner") {
    day.setHours(17, 30, 0, 0);
    return day;
  }
  if (kind === "lunchbox" && meal.meal_type === "lunch") {
    day.setDate(day.getDate() - 1);
    day.setHours(21, 0, 0, 0);
    return day;
  }
  return null;
}

function reminderBody(meal) {
  const total = mealPortions(meal);
  const names = dinerNamesOf(meal);
  const who = names.length === 1 ? ` for ${names[0]}` : names.length ? ` for ${names.length} people` : "";
  return `${total} ${total === 1 ? "portion" : "portions"}${who}. Open Rozana for the prep steps.`;
}

export function useReminders() {
  const { prefs } = usePrefs();
  const { data: meals = [] } = usePlannedMeals();
  const prep = Boolean(prefs.notifications.prep);
  const lunchbox = Boolean(prefs.notifications.lunchbox);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!("Notification" in window) || Notification.permission !== "granted") return undefined;
    if (!prep && !lunchbox) return undefined;

    const now = Date.now();
    const horizon = now + 36 * 60 * 60 * 1000;
    const timers = [];

    const schedule = (meal, kind, title) => {
      const at = reminderTime(meal, kind);
      if (!at) return;
      const when = at.getTime();
      if (when <= now || when > horizon) return;
      timers.push(
        window.setTimeout(() => {
          try {
            new Notification(title, { body: reminderBody(meal), tag: `${kind}-${meal.id}` });
          } catch {
            /* the device refused the notification; the plan itself is unchanged */
          }
        }, when - now),
      );
    };

    meals.forEach((meal) => {
      if (prep) schedule(meal, "prep", `${meal.recipe_title} tonight`);
      if (lunchbox) schedule(meal, "lunchbox", `Pack ${meal.recipe_title} for tomorrow`);
    });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [meals, prep, lunchbox]);
}