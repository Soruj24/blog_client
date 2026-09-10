"use client";

import { SkeletonArticle } from "@/src/components/ui/Skeleton";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { PostGrid, ViewAllLink } from "@/src/components/blog/PostGrid";
import { SectionHeading } from "@/src/components/blog/SectionHeading";
import { useListArticlesQuery } from "@/src/store/api/contentApi";
import { useMounted } from "@/src/hooks/useMounted";

/**
 * Editor's picks = most-loved stories (likeCount). Distinct by design
 * from Trending (reads) and Featured (editorial flag) — three slots,
 * three different signals, never the same list twice.
 */
export function EditorsPicksSection() {
  const mounted = useMounted();
  const { data, isLoading, isSuccess, isError, refetch } = useListArticlesQuery({ sort: "liked", limit: 3 });

  if (!mounted || isLoading) {
    return (
      <section aria-label="Editor's picks" className="relative">
        <div className="absolute inset-0 bg-zinc-50/50 dark:bg-zinc-900/30" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading editor's picks">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i}>
                <SkeletonArticle />
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  const items = isSuccess ? data.items : [];
  if (isError || !isSuccess) {
    return (
      <section aria-labelledby="picks-heading" className="relative">
        <div className="absolute inset-0 bg-zinc-50/50 dark:bg-zinc-900/30" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <SectionHeading
            id="picks-heading"
            eyebrow="Hand-picked"
            title="Editor's picks"
            description="The stories our editors can't stop thinking about."
          />
          <ErrorState
            title="Couldn't load editor's picks"
            description="Curated stories are temporarily unavailable."
            onRetry={() => void refetch()}
          />
        </div>
      </section>
    );
  }
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="picks-heading" className="relative">
      {/* Subtle background tint */}
      <div className="absolute inset-0 bg-zinc-50/50 dark:bg-zinc-900/30" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <SectionHeading
          id="picks-heading"
          eyebrow="Hand-picked"
          title="Editor's picks"
          description="The stories our editors can't stop thinking about."
        />
        <PostGrid articles={items} />
        <ViewAllLink href="/blog" label="Discover more" />
      </div>
    </section>
  );
}
