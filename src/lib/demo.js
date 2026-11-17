// Demo mode: "Explore Rozana" on the login screen opens the app with sample data
// kept only in this browser. Nothing in demo mode reaches Base44.
import { buildDemoData } from "@/lib/demoSeed";
import { DEMO_FLAG_KEY as FLAG_KEY, isDemo } from "@/lib/demoFlag";

export { isDemo };
export const DEMO_DB_KEY = "rozana.demo.db";

export const DEMO_USER = {
  id: "demo-user",
  full_name: "Suhani (demo)",
  email: "demo@rozana.example",
  role: "user",
  is_demo: true,
};

/** Seeds fresh sample data and turns demo mode on. */
export function enterDemo() {
  window.localStorage.setItem(DEMO_DB_KEY, JSON.stringify(buildDemoData()));
  window.localStorage.setItem(FLAG_KEY, "1");
}

/** Turns demo mode off and removes the sample data. */
export function leaveDemo() {
  try {
    window.localStorage.removeItem(FLAG_KEY);
    window.localStorage.removeItem(DEMO_DB_KEY);
  } catch {
    /* storage blocked: nothing was stored either */
  }
}
