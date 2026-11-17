// The demo switch on its own, with no imports, so the Base44 client can read it.
export const DEMO_FLAG_KEY = "rozana.demo";

/** True when this browser is exploring the demo. Always false on the server. */
export function isDemo() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(DEMO_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}
