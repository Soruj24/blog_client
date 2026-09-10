import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ArticleSummary } from "@/src/store/api/contentApi";
import { PostCard } from "./PostCard";

/**
 * Responsive article grid: 1 col mobile, 2 col tablet, 3 col desktop.
 * Semantic <ul> — assistive tech hears "list, N items".
 */
export function PostGrid({ articles, highlight }: { articles: ArticleSummary[]; highlight?: string }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <li key={article.id}>
          <PostCard article={article} highlight={highlight} />
        </li>
      ))}
    </ul>
  );
}

/** Inline "view all" link used under grids. */
export function ViewAllLink({ href, label }: { href: string; label: string }) {
  return (
    <p className="mt-10 text-center">
      <Link
        href={href}
        className="inline-flex h-10 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 transition-colors duration-150 outline-none hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:active:bg-zinc-800 dark:focus-visible:outline-zinc-100"
      >
        {label}
        <ArrowUpRight className="h-4 w-4" aria-hidden />
      </Link>
    </p>
  );
}
