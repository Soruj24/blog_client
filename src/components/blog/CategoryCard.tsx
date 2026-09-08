import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import type { Category } from "@/src/store/api/contentApi";

/**
 * Category tile: color dot, name, live article count.
 * Hides itself from counts of zero? No — shows all active categories,
 * including new ones at zero, so fresh taxonomy stays discoverable.
 */
export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-zinc-200/70 bg-white p-5 transition-all duration-200 hover:border-zinc-300 hover:shadow-soft dark:border-zinc-800/70 dark:bg-zinc-950 dark:hover:border-zinc-700"
    >
      <span
        aria-hidden
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
        style={{
          backgroundColor: `${category.color ?? "#71717a"}12`,
          color: category.color ?? "#71717a",
        }}
      >
        <LayoutGrid className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="headline block truncate text-lg text-zinc-900 dark:text-zinc-100">
          {category.name}
        </span>
        <span className="mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400">
          {category.postCount} {category.postCount === 1 ? "article" : "articles"}
        </span>
      </span>
    </Link>
  );
}
