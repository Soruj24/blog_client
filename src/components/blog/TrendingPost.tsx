import Link from "next/link";
import { Eye } from "lucide-react";
import type { ArticleSummary } from "@/src/store/api/contentApi";

/**
 * Ranked trending row: oversized serif numeral, title link, compact meta.
 * Rendered inside an <ol> by the parent for correct list semantics.
 */
export function TrendingPost({ article, rank }: { article: ArticleSummary; rank: number }) {
  const href = `/blog/${article.slug}`;
  return (
    <div className="group flex gap-6 py-6 transition-colors duration-200 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-xl">
      <span
        aria-hidden
        className="headline w-14 shrink-0 text-5xl font-light text-zinc-200 sm:text-6xl dark:text-zinc-800"
      >
        {String(rank).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <span className="sr-only">Ranked {rank}: </span>
        <h3 className="headline text-lg leading-snug text-zinc-900 dark:text-zinc-100 sm:text-xl">
          <Link
            href={href}
            className="transition-colors duration-200 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm text-zinc-500 dark:text-zinc-400">
          {article.author && (
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {article.author.name}
            </span>
          )}
          {article.author && <span aria-hidden>·</span>}
          {article.publishedAt && (
            <time dateTime={article.publishedAt}>
              {new Date(article.publishedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </time>
          )}
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" aria-hidden />
            {article.views.toLocaleString()} reads
          </span>
        </p>
      </div>
    </div>
  );
}
