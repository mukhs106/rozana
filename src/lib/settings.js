// Kitchen settings: one row per person. Kept in this browser until Supabase
// (see src/api/db.js, LOCAL_ONLY), so they do not follow you between devices yet.
import { db } from "@/api/db";

export async function saveSettings(patch) {
  const rows = await db.UserSettings.list();
  if (rows?.[0]) return db.UserSettings.update(rows[0].id, patch);
  return db.UserSettings.create(patch);
}

export const LANGUAGES = [
  { key: "en", label: "English" },
  { key: "hi", label: "हिन्दी (Hindi)" },
  { key: "bn", label: "বাংলা (Bengali)" },
  { key: "ta", label: "தமிழ் (Tamil)" },
  { key: "gu", label: "ગુજરાતી (Gujarati)" },
  { key: "mr", label: "मराठी (Marathi)" },
  { key: "ar", label: "العربية (Arabic)" },
];

/** Consecutive days with a "Cooked it", ending today (or yesterday, so today isn't lost yet). */
export function currentStreak(cookLog = [], today, addDays) {
  const days = new Set(cookLog.map((entry) => entry.cooked_on));
  let day = days.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (days.has(day)) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}
