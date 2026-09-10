import { Skeleton, SkeletonText } from "@/src/components/ui/Skeleton";

/** Article skeleton — mirrors the reader layout to avoid shift. */
export default function ArticleLoading() {
  return (
    <div
      className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10"
      role="status"
      aria-label="Loading article"
    >
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-8 h-6 w-28 rounded-full" />
      <Skeleton className="mt-4 h-10 w-full rounded-xl" />
      <Skeleton className="mt-2 h-10 w-3/4 rounded-xl" />
      <Skeleton className="mt-4 h-6 w-full max-w-xl" />
      <div className="mt-6 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="mt-8 aspect-[16/9] w-full rounded-2xl" />
      <div className="mt-8">
        <SkeletonText lines={8} />
      </div>
    </div>
  );
}
