import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { BlogFilters } from "@/src/components/blog/BlogFilters";
import { BlogPagination } from "@/src/components/blog/BlogPagination";
import { PostGrid } from "@/src/components/blog/PostGrid";
import {
  BLOG_PAGE_SIZE,
  fetchBlogArticles,
  fetchBlogFacets,
  parseBlogFilters,
} from "@/src/lib/server-api";

export const revalidate = 30;

interface BlogPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const f = parseBlogFilters(sp);
  const bits = [
    f.category ? `#${f.category}` : "",
    f.tag ? `#${f.tag}` : "",
    f.q ? `"${f.q}"` : "",
  ].filter(Boolean);
  const suffix = bits.length ? ` — ${bits.join(" · ")}` : "";
  return {
    title: `Explore all stories${suffix}`,
    description:
      "Browse every Inkwell article. Search, filter by category, tag, or author, and sort by latest, most read, or most loved.",
    alternates: { canonical: "/blog" },
    robots: f.page > 1 ? { index: false, follow: true } : undefined,
  };
}

/**
 * Explore — server-rendered for SEO and instant first paint.
 * Filters live in the URL (?category=&tag=&author=&q=&sort=&page=);
 * BlogFilters/BlogPagination are thin client islands that rewrite it.
 */
export default async function BlogPage({ searchParams }: BlogPageProps) {
  const sp = await searchParams;
  const filters = parseBlogFilters(sp);

  const [articles, facets] = await Promise.all([
    fetchBlogArticles(filters),
    fetchBlogFacets(),
  ]);

  const hasActiveFilters =
    filters.q !== "" ||
    filters.category !== "" ||
    filters.tag !== "" ||
    filters.author !== "" ||
    filters.featured;

  const categoryName =
    facets.categories.find((c) => c.slug === filters.category)?.name ?? filters.category;
  const tagName = facets.tags.find((t) => t.slug === filters.tag)?.name ?? filters.tag;
  const authorName =
    facets.authors.find((a) => a.username === filters.author)?.displayName ?? filters.author;

  const resultsHeading = filters.q
    ? `Results for “${filters.q}”`
    : filters.category
      ? `${categoryName} stories`
      : filters.tag
        ? `Stories tagged #${tagName}`
        : filters.author
          ? `Stories by ${authorName}`
          : filters.featured
            ? "Featured stories"
            : filters.sort === "popular"
              ? "Most read"
              : filters.sort === "liked"
                ? "Most loved"
                : "Latest stories";

  return (
    <div className="min-h-screen pb-16 sm:pb-20">
      {/* Page header — compact editorial index, left-aligned for scannability */}
      <div className="border-b border-zinc-200/70 dark:border-zinc-800/70">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-14">
          <p className="eyebrow text-zinc-500 dark:text-zinc-400">Library</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <h1 className="headline text-3xl tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
              Explore stories
            </h1>
            {articles !== null && articles.total > 0 && (
              <p aria-hidden className="pb-1 text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                {articles.total} {articles.total === 1 ? "story" : "stories"}
                {articles.total > BLOG_PAGE_SIZE &&
                  ` · page ${articles.page} of ${Math.ceil(articles.total / BLOG_PAGE_SIZE)}`}
              </p>
            )}
          </div>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Search every essay on Inkwell — refine by topic, tag, or author, and
            sort by latest, most read, or most loved.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <BlogFilters
          categories={facets.categories}
          tags={facets.tags}
          authors={facets.authors}
          initial={{
            q: filters.q,
            category: filters.category,
            tag: filters.tag,
            author: filters.author,
            sort: filters.sort,
            featured: filters.featured,
          }}
        />

        {articles === null ? (
          <ErrorState
            title="Couldn't load stories"
            description="The article feed is temporarily unavailable."
            action={
              <Link
                href="/blog"
                className="inline-flex h-10 items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors outline-none hover:bg-zinc-800 active:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:active:bg-zinc-300 dark:focus-visible:outline-zinc-100"
              >
                Try again
              </Link>
            }
          />
        ) : (
          <>
            <div className="mb-6 mt-8 flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id="blog-results"
                aria-live="polite"
                className="headline scroll-mt-24 text-xl tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-2xl"
              >
                {articles.total === 0 ? "No stories found" : resultsHeading}
                {articles.total > 0 && (
                  <span className="sr-only">
                    {" "}— {articles.total} {articles.total === 1 ? "story" : "stories"}
                  </span>
                )}
              </h2>
              {articles.total > 0 && (
                <p className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                  {articles.total > BLOG_PAGE_SIZE
                    ? `Page ${articles.page} of ${Math.ceil(articles.total / BLOG_PAGE_SIZE)}`
                    : filters.sort === "popular"
                      ? "Ranked by reads"
                      : filters.sort === "liked"
                        ? "Ranked by likes"
                        : "Newest first"}
                </p>
              )}
            </div>
            {articles.items.length === 0 ? (
              <EmptyState
                icon={<SearchX className="h-5 w-5" aria-hidden />}
                title="No stories match those filters"
                description="Try a different keyword, or clear the filters to browse everything."
                action={
                  hasActiveFilters ? (
                    <Link
                      href="/blog"
                      className="inline-flex h-10 items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors outline-none hover:bg-zinc-800 active:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:active:bg-zinc-300 dark:focus-visible:outline-zinc-100"
                    >
                      Clear all filters
                    </Link>
                  ) : (
                    <Link
                      href="/write"
                      className="inline-flex h-10 items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors outline-none hover:bg-zinc-800 active:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:active:bg-zinc-300 dark:focus-visible:outline-zinc-100"
                    >
                      Write the first story
                    </Link>
                  )
                }
              />
            ) : (
              <>
                <PostGrid articles={articles.items} />
                <BlogPagination
                  page={articles.page}
                  totalPages={Math.max(1, Math.ceil(articles.total / BLOG_PAGE_SIZE))}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
