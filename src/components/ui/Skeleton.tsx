import { cn } from "@/src/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn(
        "animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800",
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3.5", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonArticle({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("space-y-3", className)}>
      <Skeleton className="aspect-[16/9] w-full !rounded-xl" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 !rounded-full" />
        <Skeleton className="h-3.5 w-32" />
      </div>
      <Skeleton className="h-5 w-3/4 !rounded-md" />
      <SkeletonText lines={2} />
    </div>
  );
}
