import { Skeleton, SkeletonArticle } from "@/src/components/ui/Skeleton";

/** Shown during filter/pagination navigations (server round-trip). Mirrors page composition. */
export default function BlogLoading() {
  return (
    <div className="min-h-screen pb-16 sm:pb-20" aria-hidden>
      {/* Header skeleton */}
      <div className="border-b border-zinc-200/70 dark:border-zinc-800/70">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-14">
          <Skeleton className="h-3.5 w-20 rounded-full" />
          <Skeleton className="mt-3 h-9 w-64 rounded-lg" />
          <Skeleton className="mt-3 h-5 w-full max-w-xl" />
        </div>
      </div>
      {/* Toolbar + grid skeleton */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <Skeleton className="h-[132px] w-full rounded-2xl sm:h-[122px]" />
        <Skeleton className="mb-6 mt-8 h-7 w-48 rounded-lg" />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <SkeletonArticle />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
