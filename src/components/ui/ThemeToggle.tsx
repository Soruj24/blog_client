"use client";

import { Moon, Sun } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { setThemeMode } from "@/src/store/slices/themeSlice";
import { useEffect } from "react";
import { cx, focusRing } from "./shared";

export function ThemeToggle() {
  const mode = useAppSelector((s) => s.theme.mode);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const dark = mode === "dark" || (mode === "system" && prefersDark);
    root.classList.toggle("dark", dark);
  }, [mode]);

  const next = mode === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label={`Switch to ${next} mode`}
      onClick={() => dispatch(setThemeMode(next))}
      className={cx(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 transition-colors duration-150",
        "hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800",
        focusRing,
      )}
    >
      <Sun className="hidden h-4 w-4 dark:block" aria-hidden />
      <Moon className="h-4 w-4 dark:hidden" aria-hidden />
    </button>
  );
}
