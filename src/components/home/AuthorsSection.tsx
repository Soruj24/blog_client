"use client";

import { Users } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { AuthorCard } from "@/src/components/blog/AuthorCard";
import { SectionHeading } from "@/src/components/blog/SectionHeading";
import { usePopularAuthorsQuery } from "@/src/store/api/contentApi";
import { useMounted } from "@/src/hooks/useMounted";

export function AuthorsSection() {
  const mounted = useMounted();
  const { data, isLoading, isError, refetch } = usePopularAuthorsQuery(4);

  return (
    <section aria-labelledby="authors-heading">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <SectionHeading
          id="authors-heading"
          eyebrow="Voices to follow"
          title="Popular authors"
          description="Writers whose work readers keep coming back to."
        />
        {!mounted || isLoading ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading authors">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-64 !rounded-2xl" />
              </li>
            ))}
          </ul>
        ) : isError || !data ? (
          <ErrorState
            title="Couldn't load authors"
            description="Author profiles are temporarily unavailable."
            onRetry={() => void refetch()}
          />
        ) : data.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" aria-hidden />}
            title="No authors yet"
            description="Author spotlights appear once writers publish their first stories."
          />
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((author) => (
              <li key={author._id}>
                <AuthorCard author={author} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
