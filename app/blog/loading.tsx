import { Skeleton, SkeletonArticle } from "@/src/components/ui/Skeleton";

/** Shown during filter/pagination navigations (server round-trip). */
export default function BlogLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" aria-label="Loading stories">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-3 h-9 w-64 !rounded-lg" />
      <Skeleton className="mt-3 h-5 w-full max-w-xl" />
      <Skeleton className="mt-7 h-40 !rounded-2xl" />
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
