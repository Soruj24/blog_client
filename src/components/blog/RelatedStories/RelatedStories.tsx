import { Skeleton } from "@/src/components/ui/Skeleton";
import { Separator } from "@/src/components/ui/separator";
import { RelatedStoryCard } from "./RelatedStoryCard";
import type { ArticleSummary } from "@/src/store/api/contentApi";

function RelatedStorySkeleton() {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white dark:border-zinc-800/70 dark:bg-zinc-950">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="flex flex-1 flex-col p-5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="mt-3 h-5 w-3/4" />
        <Skeleton className="mt-1.5 h-5 w-1/2" />
        <Skeleton className="mt-3 h-3.5 w-full" />
        <Skeleton className="mt-1 h-3.5 w-2/3" />
        <div className="mt-auto">
          <Separator className="my-4" />
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </div>
    </article>
  );
}

export function RelatedStoriesLoading() {
  return (
    <section aria-label="Related stories loading" className="mt-14">
      <Skeleton className="h-7 w-40" />
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <RelatedStorySkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function RelatedStories({
  items,
  loading = false,
}: {
  items: ArticleSummary[];
  loading?: boolean;
}) {
  if (loading) return <RelatedStoriesLoading />;

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="mt-14 border-t border-zinc-200/70 pt-10 dark:border-zinc-800/70">
      <p className="eyebrow text-zinc-500 dark:text-zinc-400">Keep reading</p>
      <h2
        id="related-heading"
        className="headline mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
      >
        Related stories
      </h2>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2">
        {items.map((article) => (
          <li key={article.id}>
            <RelatedStoryCard article={article} />
          </li>
        ))}
      </ul>
    </section>
  );
}
