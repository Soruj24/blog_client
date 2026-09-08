"use client";

import { useState } from "react";
import { Newspaper } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Pagination } from "@/src/components/ui/Pagination";
import { SkeletonArticle } from "@/src/components/ui/Skeleton";
import { PostGrid, ViewAllLink } from "@/src/components/blog/PostGrid";
import { SectionHeading } from "@/src/components/blog/SectionHeading";
import { useListArticlesQuery } from "@/src/store/api/contentApi";
import { useMounted } from "@/src/hooks/useMounted";

const PAGE_SIZE = 6;

/** Paginated latest feed — the homepage's workhorse section. */
export function LatestSection() {
  const mounted = useMounted();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useListArticlesQuery({
    sort: "latest",
    page,
    limit: PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <section aria-labelledby="latest-heading" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <SectionHeading
          id="latest-heading"
          eyebrow="Fresh off the press"
          title="Latest articles"
          actionHref="/blog"
          actionLabel="Explore all"
        />
        {!mounted || isLoading ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading articles">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <li key={i}>
                <SkeletonArticle />
              </li>
            ))}
          </ul>
        ) : isError || !data ? (
          <ErrorState
            title="Couldn't load articles"
            description="The feed is temporarily unavailable."
            onRetry={() => void refetch()}
          />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={<Newspaper className="h-5 w-5" aria-hidden />}
            title="No stories yet"
            description="Be the first to publish — great ideas are waiting for an author."
            action={<ViewAllLink href="/write" label="Start writing" />}
          />
        ) : (
          <>
            <PostGrid articles={data.items} />
            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onChange={(p) => {
                    setPage(p);
                    document.getElementById("latest-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
