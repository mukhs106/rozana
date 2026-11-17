// Meal slots. Dates are local calendar days kept as YYYY-MM-DD strings.
const pad = (n) => String(n).padStart(2, "0");

export const MEAL_TYPES = ["lunch", "dinner"];

export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function parseISODate(value) {
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(value, days) {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function mealLabel(type) {
  return type === "lunch" ? "Lunch" : "Dinner";
}

/** The next meal someone would cook: dinner tonight, or lunch tomorrow once it is late. */
export function nextSlot(now = new Date()) {
  if (now.getHours() < 20) return { date: toISODate(now), type: "dinner" };
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { date: toISODate(tomorrow), type: "lunch" };
}

export function followingSlot(slot) {
  return slot.type === "dinner" ? { date: addDays(slot.date, 1), type: "lunch" } : { date: slot.date, type: "dinner" };
}

export function slotLabel(dateISO, type, today = todayISO()) {
  const diff = Math.round((parseISODate(dateISO) - parseISODate(today)) / 86400000);
  let day;
  if (diff === 0) day = type === "dinner" ? "Tonight" : "Today";
  else if (diff === 1) day = "Tomorrow";
  else day = parseISODate(dateISO).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
  return `${day} · ${mealLabel(type)}`;
}

/** "Dinner tonight", "Lunch tomorrow" — one phrase, no folio separator. */
export function slotPhrase(dateISO, type, today = todayISO()) {
  const diff = Math.round((parseISODate(dateISO) - parseISODate(today)) / 86400000);
  const meal = mealLabel(type);
  if (diff === 0) return type === "dinner" ? "Dinner tonight" : "Lunch today";
  if (diff === 1) return `${meal} tomorrow`;
  if (diff === -1) return `${meal} yesterday`;
  const day = parseISODate(dateISO).toLocaleDateString("en-US", { weekday: "long" });
  return `${meal} on ${day}`;
}

export function compareSlots(a, b) {
  const byDate = String(a.scheduled_date).localeCompare(String(b.scheduled_date));
  if (byDate !== 0) return byDate;
  return MEAL_TYPES.indexOf(a.meal_type) - MEAL_TYPES.indexOf(b.meal_type);
}

export function longDate(dateISO) {
  return parseISODate(dateISO).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function dinerSummary(names = []) {
  if (!names.length) return "Just you";
  if (names.length === 1) return `For ${names[0]}`;
  if (names.length === 2) return `For ${names[0]} and ${names[1]}`;
  return `For ${names[0]} + ${names.length - 1} others`;
}