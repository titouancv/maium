"use client";

import { useEffect } from "react";
import { useThemeStore, type Theme } from "@/stores/useThemeStore";

function resolveTheme(theme: Theme): "light" | "dark" | null {
  if (theme === "system") return null;
  if (theme === "day-cycle") {
    const hour = new Date().getHours();
    return hour >= 7 && hour < 20 ? "light" : "dark";
  }
  return theme;
}

export function ThemeApplier() {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(theme);
      const html = document.documentElement;
      if (resolved) {
        html.setAttribute("data-theme", resolved);
      } else {
        html.removeAttribute("data-theme");
      }
    };

    apply();

    if (theme === "day-cycle") {
      const interval = setInterval(apply, 60_000);
      return () => clearInterval(interval);
    }
  }, [theme]);

  return null;
}
