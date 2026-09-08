import { Skeleton } from "@/src/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6" aria-label="Loading categories">
      <Skeleton className="h-8 w-56 !rounded-lg" />
      <Skeleton className="mt-2 h-4 w-64" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="list-none">
            <Skeleton className="h-24 !rounded-2xl" />
          </li>
        ))}
      </div>
    </div>
  );
}
