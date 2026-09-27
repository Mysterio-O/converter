"use client";

import { cn } from "@/lib/cn";
import { useCallback, useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "mediaforge-theme";

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "system";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
    localStorage.removeItem(STORAGE_KEY);
  } else {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }
  window.dispatchEvent(new Event("mediaforge-theme-change"));
}

let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) listener();
  };
  const onCustom = () => listener();
  window.addEventListener("storage", onStorage);
  window.addEventListener("mediaforge-theme-change", onCustom);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("mediaforge-theme-change", onCustom);
  };
}

function getSnapshot(): Theme {
  return readStoredTheme();
}

function getServerSnapshot(): Theme {
  return "system";
}

function nextTheme(theme: Theme): Theme {
  return theme === "system" ? "light" : theme === "light" ? "dark" : "system";
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const onClick = useCallback(() => {
    applyTheme(nextTheme(theme));
  }, [theme]);

  const label =
    theme === "system" ? "Auto" : theme === "light" ? "Light" : "Dark";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-text-dim transition-colors hover:bg-panel-2 hover:text-text",
        className
      )}
      aria-label={`Theme: ${label}. Click to switch to ${nextTheme(theme)}.`}
      title={`Theme: ${label}`}
    >
      {label}
    </button>
  );
}
