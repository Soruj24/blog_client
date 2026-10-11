"use client";

import { useEffect } from "react";

/**
 * Print in the light theme. Dark-mode screen styles would otherwise print
 * light text on a white page (browsers ignore background colors by
 * default, but not text colors). We drop the `dark` class for the print
 * job and restore it afterwards — next-themes re-applies from storage on
 * next navigation regardless, so this is purely presentational.
 */
export function PrintThemeGuard() {
  useEffect(() => {
    const root = document.documentElement;
    let removed = false;

    const beforePrint = () => {
      if (root.classList.contains("dark")) {
        root.classList.remove("dark");
        removed = true;
      }
    };
    const afterPrint = () => {
      if (removed) {
        root.classList.add("dark");
        removed = false;
      }
    };

    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  return null;
}
