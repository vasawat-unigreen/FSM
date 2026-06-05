"use client";

import { useEffect, useState } from "react";
import { t } from "@/i18n";

type Theme = "light" | "dark";

// Toggles between day/night themes by setting data-theme on <html> and
// persisting the choice. Defaults to light when nothing is stored.
export function ThemeToggle() {
  // null until mounted — the stored theme is only known on the client.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    // Reading localStorage can only happen after mount (no SSR access).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(localStorage.getItem("theme") === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.dataset.theme = "dark";
    } else {
      delete document.documentElement.dataset.theme;
    }
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ignore storage errors (private mode, etc.)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t.themeToggle}
      title={theme === "dark" ? t.dayMode : t.nightMode}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/15 text-base hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
    >
      {/* Neutral icon until mounted to avoid a hydration mismatch. */}
      {theme === null ? "🌗" : theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
