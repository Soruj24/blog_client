"use client";

import { Flame } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { SkeletonText } from "@/src/components/ui/Skeleton";
import { SectionHeading } from "@/src/components/blog/SectionHeading";
import { TrendingPost } from "@/src/components/blog/TrendingPost";
import { useListArticlesQuery } from "@/src/store/api/contentApi";
import { useMounted } from "@/src/hooks/useMounted";

/** Most-read ranking — ordered list with oversized numerals. */
export function TrendingSection() {
  const mounted = useMounted();
  const { data, isLoading, isError, refetch } = useListArticlesQuery({ sort: "popular", limit: 5 });

  return (
    <section aria-labelledby="trending-heading" className="relative">
      {/* Subtle background tint */}
      <div className="absolute inset-0 bg-zinc-50/50 dark:bg-zinc-900/30" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <SectionHeading
          id="trending-heading"
          eyebrow="Most read"
          title="Trending now"
          actionHref="/trending"
          actionLabel="View rankings"
        />
        {!mounted || isLoading ? (
          <div className="max-w-3xl" role="status" aria-label="Loading trending articles">
            <SkeletonText lines={8} />
          </div>
        ) : isError || !data ? (
          <ErrorState
            title="Couldn't load trending"
            description="Rankings are temporarily unavailable."
            onRetry={() => void refetch()}
          />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={<Flame className="h-5 w-5" aria-hidden />}
            title="Nothing trending yet"
            description="Rankings appear once readers start showing up."
          />
        ) : (
          <ol className="max-w-3xl divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
            {data.items.map((article, i) => (
              <li key={article.id}>
                <TrendingPost article={article} rank={i + 1} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
