"use client";

import { Bookmark, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { PostCard } from "@/src/components/blog/PostCard";
import { Button } from "@/src/components/ui/Button";
import { Container } from "@/src/components/ui/Container";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Pagination } from "@/src/components/ui/Pagination";
import { SkeletonArticle } from "@/src/components/ui/Skeleton";
import { cx, focusRing } from "@/src/components/ui/shared";
import {
  useMyBookmarksQuery,
  useToggleBookmarkMutation,
} from "@/src/store/api/contentApi";

/** Own reading list — grid with per-item remove, paginated. */
export function BookmarksClient() {
  const { status } = useSession();
  const [page, setPage] = useState(1);
  const authed = status === "authenticated";
  const { data, isLoading, isError, refetch } = useMyBookmarksQuery(
    { page },
    { skip: !authed },
  );
  const [removeBookmark, { isLoading: removing }] = useToggleBookmarkMutation();
  // Optimistically hidden slugs — restored if the request fails.
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  function toggleRemove(slug: string, id: string) {
    setHiddenIds((prev) => [...prev, id]);
    removeBookmark(slug)
      .unwrap()
      .then((res) => {
        if (res.bookmarked) {
          // Server says still saved (race resolved against us) — show it.
          setHiddenIds((prev) => prev.filter((h) => h !== id));
        } else if (data && data.items.length === 1 && page > 1) {
          // Last item on a page vanished — step back, never strand on empty.
          setPage(page - 1);
        }
      })
      .catch(() => {
        setHiddenIds((prev) => prev.filter((h) => h !== id));
      });
  }

  if (status === "loading") {
    return (
      <Container className="max-w-6xl py-10">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading bookmarks">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i}>
              <SkeletonArticle />
            </li>
          ))}
        </ul>
      </Container>
    );
  }

  if (!authed) {
    return (
      <Container className="max-w-2xl py-10">
        <EmptyState
          icon={<Bookmark className="h-5 w-5" aria-hidden />}
          title="Sign in to see bookmarks"
          description="Your saved articles live here once you're signed in."
          action={
            <Link href={`/login?callbackUrl=${encodeURIComponent("/bookmarks")}`}>
              <Button size="sm">Sign in</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <Container className="max-w-6xl py-10">
      <div className="border-b border-zinc-200/70 pb-5 dark:border-zinc-800/70">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
          Reading list
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Bookmarks
        </h1>
      </div>

      {isLoading ? (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading bookmarks">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <SkeletonArticle />
            </li>
          ))}
        </ul>
      ) : isError || !data ? (
        <div className="mt-6">
          <ErrorState
            title="Couldn't load bookmarks"
            description="Your reading list is temporarily unavailable."
            onRetry={() => void refetch()}
          />
        </div>
      ) : data.items.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={<Bookmark className="h-5 w-5" aria-hidden />}
            title="No bookmarks yet"
            description="Tap the bookmark icon on any story and it'll wait for you here."
            action={
              <Link href="/blog">
                <Button size="sm">Discover stories</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
            {data.total} saved {data.total === 1 ? "story" : "stories"}
          </p>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.items
              .filter((article) => !hiddenIds.includes(article.id))
              .map((article) => (
              <li key={article.id} className="relative">
                <PostCard article={article} />
                <button
                  type="button"
                  disabled={removing}
                  onClick={() => toggleRemove(article.slug, article.id)}
                  aria-label={`Remove "${article.title}" from bookmarks`}
                  title="Remove bookmark"
                  className={cx(
                    "absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full",
                    "bg-zinc-950/60 text-white backdrop-blur transition-colors hover:bg-zinc-950/80",
                    "disabled:opacity-50 dark:bg-zinc-50/20 dark:hover:bg-zinc-50/30",
                    focusRing,
                  )}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="mt-10">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </>
      )}
    </Container>
  );
}
