"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx, focusRing } from "./shared";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

function pageWindow(page: number, total: number): Array<number | "..."> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const siblings = new Set([1, 2, page - 1, page, page + 1, total - 1, total]);
  const sorted = [...siblings].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out: Array<number | "..."> = [];
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) out.push("...");
    out.push(n);
    prev = n;
  }
  return out;
}

const navButton =
  "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-full px-2 text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-40";

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const clamp = (n: number) => Math.min(Math.max(1, n), totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onChange(clamp(page - 1))}
        disabled={page <= 1}
        aria-label="Go to previous page"
        className={cx(navButton, "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800", focusRing)}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        <span className="hidden pr-1 sm:inline">Prev</span>
      </button>

      <span className="px-2 text-sm text-zinc-500 sm:hidden dark:text-zinc-400" aria-hidden>
        {page} / {totalPages}
      </span>
      <span className="sr-only" aria-live="polite" aria-atomic>
        Page {page} of {totalPages}
      </span>

      <span className="hidden items-center gap-1 sm:flex">
        {pageWindow(page, totalPages).map((n, i) =>
          n === "..." ? (
            <span key={`gap-${i}`} aria-hidden className="px-1 text-zinc-400">
              ...
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-label={`Go to page ${n}`}
              aria-current={n === page ? "page" : undefined}
              className={cx(
                navButton,
                n === page
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                focusRing,
              )}
            >
              {n}
            </button>
          ),
        )}
      </span>

      <button
        type="button"
        onClick={() => onChange(clamp(page + 1))}
        disabled={page >= totalPages}
        aria-label="Go to next page"
        className={cx(navButton, "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800", focusRing)}
      >
        <span className="hidden pl-1 sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}
