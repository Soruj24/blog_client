"use client";

import { Clock, FileText, Search, Tag, X, ArrowRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { SearchHighlight } from "@/src/components/blog/SearchHighlight";
import { useSuggestArticlesQuery } from "@/src/store/api/contentApi";
import { cx, focusRing } from "@/src/components/ui/shared";
import { clearRecentSearches, getRecentSnapshot, saveRecentSearch } from "@/src/lib/recent-searches";

function subscribeToStorage(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

interface SuggestionItem {
  key: string;
  href: string;
  label: string;
  kind: "post" | "tag";
}

/**
 * Search combobox: debounced URL sync, typeahead suggestions with full
 * keyboard support, recent history. Parent remounts it via key when the
 * URL query changes underneath (back/forward).
 */
export function SearchBox({ initialQ }: { initialQ: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQ);
  const [debounced, setDebounced] = useState(initialQ);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const storedRecent = useSyncExternalStore(subscribeToStorage, getRecentSnapshot, () => []);
  const [historyCleared, setHistoryCleared] = useState(false);
  const recent = historyCleared ? [] : storedRecent;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = "search-suggestions";

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(value);
      setCursor(-1);
    }, 300);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const term = debounced.trim();
  const { data: suggestions } = useSuggestArticlesQuery(term, {
    skip: term.length < 2,
  });

  const items: SuggestionItem[] = [
    ...(suggestions?.posts.map((p) => ({
      key: `post:${p.slug}`,
      href: `/blog/${p.slug}`,
      label: p.title,
      kind: "post" as const,
    })) ?? []),
    ...(suggestions?.tags.map((t) => ({
      key: `tag:${t.slug}`,
      href: `/blog?tag=${t.slug}`,
      label: `#${t.name}`,
      kind: "tag" as const,
    })) ?? []),
  ];

  const showDropdown = open && (items.length > 0 || (value.trim() === "" && recent.length > 0));

  const submit = (raw: string) => {
    const q = raw.trim();
    const p = new URLSearchParams(searchParams.toString());
    if (q) {
      p.set("q", q);
      p.delete("page");
    } else {
      p.delete("q");
      p.delete("page");
    }
    if (q) {
      saveRecentSearch(q);
    }
    setOpen(false);
    const url = p.toString() ? `${pathname}?${p.toString()}` : pathname;
    router.replace(url, { scroll: false });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" && items.length > 0) {
      e.preventDefault();
      setOpen(true);
      setCursor((c) => (c + 1) % items.length);
    } else if (e.key === "ArrowUp" && items.length > 0) {
      e.preventDefault();
      setCursor((c) => (c - 1 + items.length) % items.length);
    } else if (e.key === "Enter" && cursor >= 0 && items[cursor]) {
      e.preventDefault();
      setOpen(false);
      router.push(items[cursor].href);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
      >
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
          />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls={listId}
            aria-activedescendant={cursor >= 0 && items[cursor] ? items[cursor].key : undefined}
            aria-label="Search articles"
            autoComplete="off"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search articles, authors, topics…"
            className="h-14 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-24 text-base shadow-soft outline-none transition-colors duration-150 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-500 dark:hover:border-zinc-700 dark:focus:border-zinc-600 dark:focus:ring-zinc-100/10"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
            {value && (
              <button
                type="button"
                onClick={() => {
                  setValue("");
                  setDebounced("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
                className={cx(
                  "inline-flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300",
                  focusRing,
                )}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            )}
            <button
              type="submit"
              aria-label="Search"
              className={cx(
                "inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white transition-colors hover:bg-zinc-800 active:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:active:bg-zinc-300",
                focusRing,
              )}
            >
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </form>

      {showDropdown && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-overlay dark:border-zinc-800/70 dark:bg-zinc-950">
          {items.length > 0 ? (
            <ul id={listId} role="listbox" aria-label="Suggestions" className="max-h-80 overflow-y-auto py-2">
              {items.map((item, i) => (
                <li key={item.key} id={item.key} role="option" aria-selected={i === cursor}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      router.push(item.href);
                    }}
                    onMouseEnter={() => setCursor(i)}
                    className={cx(
                      "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm outline-none transition-colors focus-visible:bg-zinc-100 dark:focus-visible:bg-zinc-900",
                      i === cursor
                        ? "bg-zinc-100 dark:bg-zinc-900"
                        : "hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-900/60 dark:active:bg-zinc-900",
                      focusRing,
                    )}
                  >
                    {item.kind === "post" ? (
                      <FileText className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                    ) : (
                      <Tag className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                    )}
                    <span className="truncate">
                      {item.kind === "post" ? (
                        <SearchHighlight text={item.label} query={term} />
                      ) : (
                        item.label
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-2">
              <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Recent searches
              </p>
              <ul>
                {recent.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setValue(r);
                        submit(r);
                      }}
                      className={cx(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm outline-none transition-colors hover:bg-zinc-50 active:bg-zinc-100 focus-visible:bg-zinc-100 dark:hover:bg-zinc-900/60 dark:active:bg-zinc-900 dark:focus-visible:bg-zinc-900",
                        focusRing,
                      )}
                    >
                      <Clock className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
                      <span className="truncate">{r}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  clearRecentSearches();
                  setHistoryCleared(true);
                }}
                className={cx(
                  "w-full px-4 py-2 text-left text-xs font-medium text-zinc-400 outline-none transition-colors hover:text-zinc-600 active:text-zinc-800 focus-visible:text-zinc-800 dark:hover:text-zinc-300 dark:active:text-zinc-100 dark:focus-visible:text-zinc-100",
                  focusRing,
                )}
              >
                Clear history
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
