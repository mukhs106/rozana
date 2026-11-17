import { useEffect, useState } from "react";

const STORAGE_KEY = "rozana.prefs";
const SYNC_EVENT = "rozana:prefs";

export const PREF_DEFAULTS = {
  notifications: { prep: false, lunchbox: false },
  autoplay: false,
  appearance: "system",
};

function read() {
  if (typeof window === "undefined") return PREF_DEFAULTS;
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      ...PREF_DEFAULTS,
      ...stored,
      notifications: { ...PREF_DEFAULTS.notifications, ...(stored.notifications || {}) },
    };
  } catch {
    return PREF_DEFAULTS;
  }
}

/**
 * Device preferences: kept on this device, not in the app database. Every
 * consumer listens for the sync event, so the theme and reminders follow the
 * setting the moment it changes.
 */
export function usePrefs() {
  const [prefs, setPrefs] = useState(PREF_DEFAULTS);

  useEffect(() => {
    const sync = () => setPrefs(read());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(SYNC_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(SYNC_EVENT, sync);
    };
  }, []);

  const update = (patch) => {
    const current = read();
    const next = {
      ...current,
      ...patch,
      notifications: { ...current.notifications, ...(patch.notifications || {}) },
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked: the setting simply does not survive a reload */
    }
    setPrefs(next);
    window.dispatchEvent(new Event(SYNC_EVENT));
  };

  return { prefs, update };
}