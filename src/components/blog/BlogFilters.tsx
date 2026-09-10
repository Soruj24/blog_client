"use client";

import { ListFilter, Search, Star, X } from "lucide-react";
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

const SORT_LABELS: Record<string, string> = {
  latest: "Latest first",
  popular: "Most read",
  liked: "Most loved",
};

/**
 * Filter toolbar — URL is the source of truth. Selects/toggle write through
 * immediately (replace); the search box mirrors locally and syncs
 * debounced, remounting via key when the URL changes underneath it
 * (back/forward navigation).
 */
export function BlogFilters({ categories, tags, authors, initial }: BlogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initial.q);
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const categoryName =
    categories.find((c) => c.slug === initial.category)?.name ?? initial.category;
  const tagName = tags.find((t) => t.slug === initial.tag)?.name ?? initial.tag;
  const authorName =
    authors.find((a) => a.username === initial.author)?.displayName ?? initial.author;

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (initial.q !== "") {
    chips.push({ key: "q", label: `“${initial.q}”`, onRemove: () => setOne("q", "") });
  }
  if (initial.category !== "") {
    chips.push({ key: "category", label: categoryName, onRemove: () => setOne("category", "") });
  }
  if (initial.tag !== "") {
    chips.push({ key: "tag", label: `#${tagName}`, onRemove: () => setOne("tag", "") });
  }
  if (initial.author !== "") {
    chips.push({ key: "author", label: authorName, onRemove: () => setOne("author", "") });
  }
  if (initial.sort !== "latest") {
    chips.push({
      key: "sort",
      label: SORT_LABELS[initial.sort] ?? initial.sort,
      onRemove: () => setOne("sort", "latest"),
    });
  }
  if (initial.featured) {
    chips.push({ key: "featured", label: "Featured", onRemove: () => setOne("featured", "") });
  }

  const refineCount =
    (initial.category !== "" ? 1 : 0) +
    (initial.tag !== "" ? 1 : 0) +
    (initial.author !== "" ? 1 : 0);

  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-soft sm:p-5 dark:border-zinc-800/70 dark:bg-zinc-950">
      {/* Primary toolbar: search + sort + featured */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1" role="search">
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
            className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:focus:border-zinc-600 dark:focus:ring-zinc-100/10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="blog-refine-filters"
            onClick={() => setFiltersOpen((v) => !v)}
            className={cx(
              "inline-flex h-11 items-center gap-1.5 rounded-xl border px-4 text-sm font-medium transition-colors lg:hidden",
              focusRing,
              refineCount > 0
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:active:bg-zinc-800",
            )}
          >
            <ListFilter className="h-4 w-4" aria-hidden />
            Filters
            {refineCount > 0 && (
              <span
                aria-label={`${refineCount} filters active`}
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1 text-xs font-semibold dark:bg-zinc-900/10"
              >
                {refineCount}
              </span>
            )}
          </button>
          <div className="w-full min-w-40 flex-1 sm:w-48 sm:flex-none">
            <Select
              aria-label="Sort articles"
              value={initial.sort}
              onChange={(e) => setOne("sort", e.target.value)}
              options={SORT_OPTIONS}
            />
          </div>
          <button
            type="button"
            aria-pressed={initial.featured}
            onClick={() => setOne("featured", initial.featured ? "" : "true")}
            className={cx(
              "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-4 text-sm font-medium transition-colors",
              focusRing,
              initial.featured
                ? "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-700 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:active:bg-zinc-300"
                : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:active:bg-zinc-800",
            )}
          >
            <Star
              className="h-3.5 w-3.5"
              aria-hidden
              fill={initial.featured ? "currentColor" : "none"}
            />
            Featured
          </button>
        </div>
      </div>

      {/* Secondary refine row: labeled selects, collapsible on mobile */}
      <div
        id="blog-refine-filters"
        className={cx(
          "grid gap-3 pt-3 sm:grid-cols-3",
          !filtersOpen && "hidden lg:grid",
        )}
      >
        <Select
          label="Category"
          aria-label="Filter by category"
          value={initial.category}
          onChange={(e) => setOne("category", e.target.value)}
          options={[
            { value: "", label: "All categories" },
            ...categories.map((c) => ({ value: c.slug, label: `${c.name} (${c.postCount})` })),
          ]}
        />
        <Select
          label="Tag"
          aria-label="Filter by tag"
          value={initial.tag}
          onChange={(e) => setOne("tag", e.target.value)}
          options={[
            { value: "", label: "All tags" },
            ...tags.map((t) => ({ value: t.slug, label: `#${t.name} (${t.postCount})` })),
          ]}
        />
        <Select
          label="Author"
          aria-label="Filter by author"
          value={initial.author}
          onChange={(e) => setOne("author", e.target.value)}
          options={[
            { value: "", label: "All authors" },
            ...authors.map((a) => ({ value: a.username, label: a.displayName })),
          ]}
        />
      </div>

      {/* Active filter chips */}
      {chips.length > 0 && (
        <ul aria-label="Active filters" className="flex flex-wrap items-center gap-2 pt-3">
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`Remove ${chip.label} filter`}
                className={cx(
                  "group inline-flex h-8 max-w-60 items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 py-0 pl-3.5 pr-2.5 text-[13px] font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-100 active:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:active:bg-zinc-800",
                  focusRing,
                )}
              >
                <span className="truncate">{chip.label}</span>
                <X className="h-3.5 w-3.5 shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-700 dark:group-hover:text-zinc-200" aria-hidden />
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => router.replace(pathname, { scroll: false })}
              className={cx(
                "inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline active:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100 dark:active:text-zinc-200",
                focusRing,
              )}
            >
              Clear all
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
