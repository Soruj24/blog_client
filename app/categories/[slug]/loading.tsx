import { Skeleton, SkeletonArticle } from "@/src/components/ui/Skeleton";

/** Shown while the category feed resolves server-side. */
export default function CategoryLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" aria-label="Loading category">
      <Skeleton className="h-4 w-40" />
      <div className="mt-4 flex items-center gap-4">
        <Skeleton className="h-14 w-14 !rounded-2xl" />
        <div className="flex-1">
          <Skeleton className="h-8 w-56 !rounded-lg" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
      </div>
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
