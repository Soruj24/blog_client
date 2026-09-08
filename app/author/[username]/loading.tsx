import { Skeleton, SkeletonArticle } from "@/src/components/ui/Skeleton";

/** Author skeleton — mirrors the profile header + grid. */
export default function AuthorLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" aria-label="Loading author">
      <Skeleton className="h-4 w-32" />
      <div className="mt-6 overflow-hidden rounded-3xl border border-zinc-200/70 dark:border-zinc-800/70">
        <Skeleton className="h-24 w-full !rounded-none sm:h-32" />
        <div className="px-5 pb-6 sm:px-8">
          <Skeleton className="h-20 w-20 !rounded-full sm:h-24 sm:w-24" />
          <Skeleton className="mt-4 h-8 w-56 !rounded-lg" />
          <Skeleton className="mt-2 h-4 w-40" />
          <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
        </div>
      </div>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <li key={i}>
            <SkeletonArticle />
          </li>
        ))}
      </ul>
    </div>
  );
}
