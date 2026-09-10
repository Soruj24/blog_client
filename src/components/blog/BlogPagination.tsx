"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/src/components/ui/Pagination";

/**
 * URL-driven pagination: preserves every active filter, pushes history
 * entries (back button walks pages), scrolls to the results heading.
 */
export function BlogPagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const go = (next: number) => {
    const p = new URLSearchParams(searchParams.toString());
    if (next <= 1) p.delete("page");
    else p.set("page", String(next));
    const url = p.toString() ? `${pathname}?${p.toString()}` : pathname;
    router.push(url, { scroll: false });
    // Try specific result anchors, fallback to top
    const target =
      document.getElementById("blog-results") ||
      document.getElementById("search-results") ||
      document.getElementById("category-results") ||
      document.getElementById("tag-results") ||
      document.getElementById("author-results");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mt-10">
      <Pagination page={page} totalPages={totalPages} onChange={go} />
    </div>
  );
}
