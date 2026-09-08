"use client";

import { SkeletonArticle } from "@/src/components/ui/Skeleton";
import { FeaturedPost } from "@/src/components/blog/FeaturedPost";
import { useListArticlesQuery } from "@/src/store/api/contentApi";
import { useMounted } from "@/src/hooks/useMounted";

/**
 * Curated spotlight. Renders nothing when no featured article exists
 * or the slot errors — a homepage must never show a broken hero.
 */
export function FeaturedSection() {
  const mounted = useMounted();
  const { data, isLoading, isSuccess } = useListArticlesQuery({ featured: true, limit: 1 });

  if (!mounted || isLoading) {
    return (
      <section aria-label="Featured article" className="relative">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <SkeletonArticle />
        </div>
      </section>
    );
  }

  const article = isSuccess ? data.items[0] : undefined;
  if (!article) return null;

  return (
    <section aria-labelledby="featured-heading" className="relative">
      {/* Subtle background shift to distinguish from other sections */}
      <div className="absolute inset-0 bg-zinc-50/50 dark:bg-zinc-900/30" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <h2 id="featured-heading" className="sr-only">
          Featured article
        </h2>
        <FeaturedPost article={article} priority />
      </div>
    </section>
  );
}
