import Link from "next/link";
import { Tag as TagIcon } from "lucide-react";
import type { Tag } from "@/src/lib/server-api";

/** Tag tile: name, live article count. Links to the tag hub. */
export function TagCard({ tag }: { tag: Tag }) {
  return (
    <Link
      href={`/tags/${tag.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-zinc-200/70 bg-white p-5 shadow-soft transition-shadow hover:shadow-lift dark:border-zinc-800/70 dark:bg-zinc-950"
    >
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-zinc-900 group-hover:text-white dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover:bg-zinc-50 dark:group-hover:text-zinc-900"
      >
        <TagIcon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="headline block truncate text-lg">#{tag.name}</span>
        <span className="mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400">
          {tag.postCount} {tag.postCount === 1 ? "article" : "articles"}
        </span>
      </span>
    </Link>
  );
}
