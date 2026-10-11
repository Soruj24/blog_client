"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { History } from "lucide-react";
import {
  getReadingHistorySnapshot,
  getServerHistorySnapshot,
  subscribeToReadingHistory,
} from "@/src/lib/reading-history";
import { SectionHeading } from "./SectionHeading";

/**
 * "Recently viewed" — the signed-out-friendly counterpart to bookmarks.
 * Reads the device-local reading history (written by
 * ReadingHistoryTracker on article pages). No fetch, no waterfall:
 * entries carry their own snapshot. Renders nothing when empty or
 * unavailable (private mode, SSR), so the homepage never shifts for
 * first-time readers.
 */
export function RecentlyViewedSection() {
  const entries = useSyncExternalStore(
    subscribeToReadingHistory,
    getReadingHistorySnapshot,
    getServerHistorySnapshot,
  );

  if (entries.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-heading" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <SectionHeading
        id="recently-viewed-heading"
        eyebrow="Continue reading"
        title="Recently viewed"
      />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <li key={entry.slug}>
            <Link
              href={`/blog/${entry.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-zinc-200/70 bg-white p-5 transition-colors duration-150 outline-none hover:border-zinc-300 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800/70 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:focus-visible:outline-zinc-100"
            >
              {entry.categoryName && (
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                  {entry.categoryName}
                </span>
              )}
              <span className="headline mt-2 line-clamp-2 text-lg leading-snug text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300">
                {entry.title}
              </span>
              <span className="mt-auto flex items-center gap-1.5 pt-3 text-xs text-zinc-400 dark:text-zinc-500">
                <History className="h-3.5 w-3.5" aria-hidden />
                Viewed {formatViewedAt(entry.viewedAt)}
                {entry.readingTime > 0 && ` · ${entry.readingTime} min read`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatViewedAt(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return "recently";
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}
