import { SkeletonText } from "@/src/components/ui/Skeleton";

export default function TrendingLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6" role="status" aria-label="Loading trending rankings">
      <div className="h-4 w-24 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
      <div className="mt-3 h-10 w-64 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
      <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-8">
        <SkeletonText lines={8} />
        <SkeletonText lines={8} />
      </div>
    </div>
  );
}
