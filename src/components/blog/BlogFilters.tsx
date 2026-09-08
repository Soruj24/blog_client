"use client";

import { Search, Star, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Select } from "@/src/components/ui/Select";
import { cx, focusRing } from "@/src/components/ui/shared";
import type {
  Category,
  PopularAuthor,
} from "@/src/store/api/contentApi";
import type { Tag } from "@/src/lib/server-api";

export interface BlogFiltersProps {
  categories: Category[];
  tags: Tag[];
  authors: PopularAuthor[];
  initial: {
    q: string;
    category: string;
    tag: string;
    author: string;
    sort: string;
    featured: boolean;
  };
}

const SORT_OPTIONS = [
  { value: "latest", label: "Latest first" },
  { value: "popular", label: "Most read" },
  { value: "liked", label: "Most loved" },
];

/**
 * Filter bar — URL is the source of truth. Selects/toggle write through
 * immediately (replace); the search box mirrors locally and syncs
 * debounced, remounting via key when the URL changes underneath it
 * (back/forward navigation).
 */
export function BlogFilters({ categories, tags, authors, initial }: BlogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initial.q);

  const setParams = (mutate: (p: URLSearchParams) => void, push = false) => {
    const p = new URLSearchParams(searchParams.toString());
    mutate(p);
    p.delete("page"); // any filter change resets to page 1
    const url = p.toString() ? `${pathname}?${p.toString()}` : pathname;
    if (push) router.push(url, { scroll: false });
    else router.replace(url, { scroll: false });
  };

  const setOne = (key: string, value: string) =>
    setParams((p) => {
      if (value) p.set(key, value);
      else p.delete(key);
    });

  // Debounced search → URL. Reads window.location at fire time (not the
  // render closure) so a concurrent filter navigation can't be clobbered.
  // The key remount above keeps the box in sync with back/forward.
  useEffect(() => {
    const current = new URLSearchParams(window.location.search).get("q") ?? "";
    if (query === current) return;
    const t = setTimeout(() => {
      const p = new URLSearchParams(window.location.search);
      if (query.trim()) p.set("q", query.trim());
      else p.delete("q");
      p.delete("page");
      const url = p.toString() ? `${pathname}?${p.toString()}` : pathname;
      router.replace(url, { scroll: false });
    }, 400);
    return () => clearTimeout(t);
  }, [query, pathname, router]);

  const hasActive =
    initial.q !== "" ||
    initial.category !== "" ||
    initial.tag !== "" ||
    initial.author !== "" ||
    initial.sort !== "latest" ||
    initial.featured;

  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-soft sm:p-5 dark:border-zinc-800/70 dark:bg-zinc-950">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="relative md:col-span-2 lg:col-span-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          />
          <input
            key={initial.q}
            type="search"
            defaultValue={initial.q}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles…"
            aria-label="Search articles"
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:focus:border-zinc-600"
          />
        </div>
        <Select
          aria-label="Filter by category"
          value={initial.category}
          onChange={(e) => setOne("category", e.target.value)}
          options={[
            { value: "", label: "All categories" },
            ...categories.map((c) => ({ value: c.slug, label: `${c.name} (${c.postCount})` })),
          ]}
        />
        <Select
          aria-label="Filter by tag"
          value={initial.tag}
          onChange={(e) => setOne("tag", e.target.value)}
          options={[
            { value: "", label: "All tags" },
            ...tags.map((t) => ({ value: t.slug, label: `#${t.name} (${t.postCount})` })),
          ]}
        />
        <div className="flex gap-3 md:col-span-2 lg:col-span-1">
          <div className="flex-1">
            <Select
              aria-label="Filter by author"
              value={initial.author}
              onChange={(e) => setOne("author", e.target.value)}
              options={[
                { value: "", label: "All authors" },
                ...authors.map((a) => ({ value: a.username, label: a.displayName })),
              ]}
            />
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="flex-1">
          <Select
            aria-label="Sort articles"
            value={initial.sort}
            onChange={(e) => setOne("sort", e.target.value)}
            options={SORT_OPTIONS}
            className="sm:max-w-48"
          />
        </div>
        <button
          type="button"
          aria-pressed={initial.featured}
          onClick={() => setOne("featured", initial.featured ? "" : "true")}
          className={cx(
            "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
            focusRing,
            initial.featured
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
              : "border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900",
          )}
        >
          <Star className="h-3.5 w-3.5" aria-hidden />
          Featured
        </button>
        {hasActive && (
          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className={cx(
              "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
              focusRing,
            )}
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
