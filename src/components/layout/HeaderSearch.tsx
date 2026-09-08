"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cx, focusRing } from "@/src/components/ui/shared";

/**
 * Header search. Desktop: compact inline field ("/" focuses it).
 * Mobile: icon toggles a full-width row under the bar.
 * Plain GET form → /search?q=… works with zero JS too.
 */
export function HeaderSearch() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktopRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileOpen) mobileRef.current?.focus();
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        if (window.innerWidth >= 768) desktopRef.current?.focus();
        else {
          setMobileOpen(true);
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const field =
    "h-9 w-full rounded-full border border-zinc-200 bg-zinc-100/70 pl-9 pr-8 text-sm outline-none transition-all placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900/70 dark:hover:border-zinc-700 dark:focus:border-zinc-600 dark:focus:bg-zinc-950";

  return (
    <>
      {/* Desktop inline field */}
      <form
        action="/search"
        method="get"
        role="search"
        className="relative hidden md:block"
      >
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        />
        <input
          ref={desktopRef}
          type="search"
          name="q"
          autoComplete="off"
          placeholder="Search articles…"
          aria-label="Search articles"
          className={cx(field, "w-44 focus:w-64 lg:w-52 lg:focus:w-72", focusRing)}
        />
        <kbd
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-zinc-200 px-1 text-[11px] text-zinc-400 dark:border-zinc-700"
        >
          /
        </kbd>
      </form>

      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? "Close search" : "Open search"}
        className={cx(
          "inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-900",
          focusRing,
        )}
      >
        {mobileOpen ? (
          <X className="h-5 w-5" aria-hidden />
        ) : (
          <Search className="h-5 w-5" aria-hidden />
        )}
      </button>

      {/* Mobile full-width row */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full border-b border-zinc-200/70 bg-white/95 px-4 pb-3 pt-1 backdrop-blur md:hidden dark:border-zinc-800/70 dark:bg-zinc-950/95">
          <form action="/search" method="get" role="search" className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            />
            <input
              ref={mobileRef}
              type="search"
              name="q"
              autoComplete="off"
              placeholder="Search articles…"
              aria-label="Search articles"
              onKeyDown={(e) => {
                if (e.key === "Escape") setMobileOpen(false);
              }}
              className={cx(field, focusRing)}
            />
          </form>
        </div>
      )}
    </>
  );
}
