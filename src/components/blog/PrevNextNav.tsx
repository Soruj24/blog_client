import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cx, focusRing } from "@/src/components/ui/shared";

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

  const card = cx(
    "group flex flex-1 items-center gap-3 rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-soft transition-colors outline-none",
    "hover:border-zinc-300 hover:shadow-lift active:bg-zinc-50 dark:border-zinc-800/70 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:active:bg-zinc-900",
    focusRing,
  );

  return (
    <nav aria-label="More articles" className="mt-12 flex flex-col gap-3 sm:flex-row">
      {prev ? (
        <Link href={`/blog/${prev.slug}`} className={card} rel="prev">
          <ChevronLeft className="h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-150 group-hover:-translate-x-0.5" aria-hidden />
          <span className="min-w-0">
            <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Older story
            </span>
            <span className="headline mt-0.5 line-clamp-2 block">{prev.title}</span>
          </span>
        </Link>
      ) : (
        <span aria-hidden className="hidden flex-1 sm:block" />
      )}
      {next && (
        <Link href={`/blog/${next.slug}`} className={`${card} sm:flex-row-reverse sm:text-right`} rel="next">
          <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Newer story
            </span>
            <span className="headline mt-0.5 line-clamp-2 block">{next.title}</span>
          </span>
        </Link>
      )}
    </nav>
  );
}
