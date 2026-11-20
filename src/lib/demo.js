// Demo mode: "Explore Rozana" on the login screen, or the demo stage at /, opens
// the app with sample data kept only in this browser. Nothing in demo mode reaches Base44.
import { buildDemoData } from "@/lib/demoSeed";
import { DEMO_FLAG_KEY as FLAG_KEY, isDemo } from "@/lib/demoFlag";

export { isDemo };
export const DEMO_DB_KEY = "rozana.demo.db";
const VERSION_KEY = "rozana.demo.version";
// Bump when the sample data changes, so open demos pick up the new seed.
const DEMO_SEED_VERSION = "6";

export const DEMO_USER = {
  id: "demo-user",
  full_name: "Suhani (demo)",
  email: "demo@rozana.example",
  role: "user",
  is_demo: true,
};

/**
 * Seeds fresh sample data and turns demo mode on. A scenario from the demo
 * stage passes its `setup`; without one this is the full sample kitchen.
 */
export function enterDemo(setup = null) {
  window.localStorage.setItem(DEMO_DB_KEY, JSON.stringify(buildDemoData(setup)));
  window.localStorage.setItem(VERSION_KEY, DEMO_SEED_VERSION);
  window.localStorage.setItem(FLAG_KEY, "1");
}

/** Reseeds a demo that was started with older sample data. */
export function refreshDemoIfStale() {
  try {
    if (isDemo() && window.localStorage.getItem(VERSION_KEY) !== DEMO_SEED_VERSION) enterDemo();
  } catch {
    /* storage blocked: the demo keeps whatever it has */
  }
}

/** Turns demo mode off and removes the sample data. */
export function leaveDemo() {
  try {
    window.localStorage.removeItem(FLAG_KEY);
    window.localStorage.removeItem(DEMO_DB_KEY);
    window.localStorage.removeItem(VERSION_KEY);
  } catch {
    /* storage blocked: nothing was stored either */
  }
}
