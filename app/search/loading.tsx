import { Skeleton, SkeletonArticle } from "@/src/components/ui/Skeleton";

/** Shown while a new query/page resolves server-side. Mirrors results layout. */
export default function SearchLoading() {
  return (
    <div className="min-h-screen pb-16 sm:pb-20" aria-hidden>
      <div className="border-b border-zinc-200/70 dark:border-zinc-800/70">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-14">
          <Skeleton className="h-3.5 w-20 rounded-full" />
          <Skeleton className="mt-3 h-8 w-72 rounded-lg" />
          <Skeleton className="mt-6 h-14 w-full max-w-2xl rounded-2xl" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <Skeleton className="h-5 w-40 rounded-md" />
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
