"use client";

import { useState } from "react";
import { Search, SearchX } from "lucide-react";
import type { Category } from "@/src/store/api/contentApi";
import { CategoryCard } from "./CategoryCard";
import { EmptyState } from "@/src/components/ui/EmptyState";

/**
 * Client-side directory filter. The full active taxonomy (~50 items)
 * ships with the page — filtering locally avoids a round-trip per
 * keystroke and keeps back/forward instant (no URL state to sync).
 */
export function CategoryDirectory({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const visible =
    q === ""
      ? categories
      : categories.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            (c.description ?? "").toLowerCase().includes(q),
        );

  return (
    <div>
      <div className="relative mx-auto max-w-xl" role="search">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics…"
          aria-label="Search categories"
          className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:focus:border-zinc-600 dark:focus:ring-zinc-100/10"
        />
      </div>
      <p className="mt-4 text-center text-sm tabular-nums text-zinc-500 dark:text-zinc-400" aria-live="polite">
        {visible.length === categories.length
          ? `${categories.length} ${categories.length === 1 ? "topic" : "topics"}`
          : `${visible.length} of ${categories.length} topics`}
      </p>
      {visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<SearchX className="h-5 w-5" aria-hidden />}
            title={`No topics match “${query.trim()}”`}
            description="Try a different keyword, or clear the search to browse everything."
            action={
              <button
                type="button"
                onClick={() => setQuery("")}
                className="inline-flex h-10 items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors outline-none hover:bg-zinc-800 active:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:active:bg-zinc-300 dark:focus-visible:outline-zinc-100"
              >
                Clear search
              </button>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((category) => (
            <li key={category._id}>
              <CategoryCard category={category} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
