"use client";

import { Clock, SearchX, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { clearRecentSearches, getRecentSnapshot } from "@/src/lib/recent-searches";
import { cx, focusRing } from "@/src/components/ui/shared";

function subscribeToStorage(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const SUGGESTIONS = [
  "typography",
  "deep work",
  "design systems",
  "serverless",
  "web development",
  "creative process",
];

/**
 * Standalone history panel for the empty-query state. useSyncExternalStore
 * keeps SSR HTML ([]) and hydrated state consistent — no effects needed.
 */
export function RecentSearches() {
  const recent = useSyncExternalStore(subscribeToStorage, getRecentSnapshot, () => []);
  const [cleared, setCleared] = useState(false);
  const visible = cleared ? [] : recent;

  return (
    <div className="py-8">
      {/* Recent searches */}
      {visible.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Recent searches
            </h2>
            <button
              type="button"
              onClick={() => {
                clearRecentSearches();
                setCleared(true);
              }}
              className={cx(
                "rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300",
                focusRing,
              )}
            >
              Clear
            </button>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {visible.map((r) => (
              <li key={r}>
                <Link
                  href={`/search?q=${encodeURIComponent(r)}`}
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-full border border-zinc-200/70 bg-white px-4 py-2 text-sm text-zinc-700 transition-colors duration-150 outline-none hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:active:bg-zinc-800 dark:focus-visible:outline-zinc-100",
                    focusRing,
                  )}
                >
                  <Clock className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                  {r}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested searches */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          {visible.length > 0 ? "Try searching" : "Popular searches"}
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <li key={s}>
              <Link
                href={`/search?q=${encodeURIComponent(s)}`}
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-full border border-zinc-200/70 bg-white px-4 py-2 text-sm text-zinc-700 transition-colors duration-150 outline-none hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:active:bg-zinc-800 dark:focus-visible:outline-zinc-100",
                  focusRing,
                )}
              >
                <TrendingUp className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                {s}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Tips */}
      <div className="mt-12 rounded-2xl border border-zinc-200/70 bg-zinc-50/50 p-6 dark:border-zinc-800/70 dark:bg-zinc-900/30">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Search tips</h3>
        <ul className="mt-3 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            Search by <span className="font-medium text-zinc-700 dark:text-zinc-300">title</span>,{' '}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">author</span>,{' '}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">category</span>, or{' '}
            <span className="font-medium text-zinc-700 dark:text-zinc-300">tag</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            Use fewer words for broader results
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            Try different spellings or synonyms
          </li>
        </ul>
      </div>
    </div>
  );
}

/** Shown when the server returns zero hits for a real query. */
export function NoSearchResults({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white px-6 py-14 text-center dark:border-zinc-800/70 dark:bg-zinc-950 sm:px-10">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <SearchX className="h-6 w-6 text-zinc-400" aria-hidden />
      </div>
      <h2 className="headline mt-5 text-xl text-zinc-900 dark:text-zinc-100">
        No results for &ldquo;{query}&rdquo;
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        Check the spelling, try fewer words, or browse by topic instead — search covers
        titles, article bodies, authors, categories, and tags.
      </p>
      <p className="mt-6 flex flex-wrap justify-center gap-2">
        <Link
          href="/blog"
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors outline-none hover:bg-zinc-800 active:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:active:bg-zinc-300 dark:focus-visible:outline-zinc-100"
        >
          Browse all stories
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          href="/search"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition-colors outline-none hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:active:bg-zinc-800 dark:focus-visible:outline-zinc-100"
        >
          Clear search
        </Link>
      </p>
    </div>
  );
}
