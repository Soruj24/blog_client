import { Skeleton, SkeletonArticle } from "@/src/components/ui/Skeleton";

/** Shown while a new query/page resolves server-side. */
export default function SearchLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" aria-label="Loading search results">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-9 w-64 !rounded-lg" />
      <Skeleton className="mt-6 h-12 w-full max-w-2xl !rounded-full" />
      <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i}>
            <SkeletonArticle />
          </li>
        ))}
      </ul>
    </div>
  );
}
