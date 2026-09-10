"use client";

import { LayoutGrid } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { CategoryCard } from "@/src/components/blog/CategoryCard";
import { SectionHeading } from "@/src/components/blog/SectionHeading";
import { useListCategoriesQuery } from "@/src/store/api/contentApi";
import { useMounted } from "@/src/hooks/useMounted";

function CategoriesSkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading categories">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i}>
          <Skeleton className="h-[92px] rounded-2xl" />
        </li>
      ))}
    </ul>
  );
}

export function CategoriesSection() {
  const mounted = useMounted();
  const { data, isLoading, isError, refetch } = useListCategoriesQuery();

  return (
    <section aria-labelledby="categories-heading">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <SectionHeading
          id="categories-heading"
          eyebrow="Browse by topic"
          title="Popular categories"
          actionHref="/categories"
          actionLabel="All categories"
        />
        {!mounted || isLoading ? (
          <CategoriesSkeleton />
        ) : isError || !data ? (
          <ErrorState
            title="Couldn't load categories"
            description="The directory is temporarily unavailable."
            onRetry={() => void refetch()}
          />
        ) : data.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid className="h-5 w-5" aria-hidden />}
            title="No categories yet"
            description="Curated topics appear here once editors create them."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((category) => (
              <li key={category._id}>
                <CategoryCard category={category} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
