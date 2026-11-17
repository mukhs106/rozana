import { useEffect } from "react";
import { usePrefs } from "@/hooks/usePrefs";

/**
 * System, Light and Dark, applied to the shared colour tokens. Every screen,
 * sheet and nav reads those tokens, so one class on <html> switches the app.
 */
export function useApplyTheme() {
  const { prefs } = usePrefs();
  const mode = prefs.appearance || "system";

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const dark = mode === "dark" || (mode === "system" && media.matches);
      root.classList.toggle("dark", dark);
      root.style.colorScheme = dark ? "dark" : "light";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", dark ? "#17130f" : "#ffffff");
    };

    apply();
    if (mode !== "system") return undefined;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [mode]);
}