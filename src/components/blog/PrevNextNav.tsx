import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

/**
 * Chronological neighbors (prev = older, next = newer).
 * Renders nothing when the article stands alone.
 */
export function PrevNextNav({
  prev,
  next,
}: {
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}) {
  if (!prev && !next) return null;

  const card =
    "group flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-soft transition-shadow hover:shadow-lift dark:border-zinc-800/70 dark:bg-zinc-950";

  return (
    <nav aria-label="More articles" className="mt-12 flex flex-col gap-3 sm:flex-row">
      {prev ? (
        <Link href={`/blog/${prev.slug}`} className={card} rel="prev">
          <ChevronLeft className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden />
          <span className="min-w-0">
            <span className="block text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Previous
            </span>
            <span className="headline mt-0.5 block truncate">{prev.title}</span>
          </span>
        </Link>
      ) : (
        <span aria-hidden className="hidden flex-1 sm:block" />
      )}
      {next && (
        <Link href={`/blog/${next.slug}`} className={`${card} sm:flex-row-reverse sm:text-right`} rel="next">
          <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Next
            </span>
            <span className="headline mt-0.5 block truncate">{next.title}</span>
          </span>
        </Link>
      )}
    </nav>
  );
}
