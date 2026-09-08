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

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-zinc-200/70 dark:border-zinc-800/70">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/80 via-white to-white dark:from-zinc-900/50 dark:via-zinc-950 dark:to-zinc-950" />
        <div className="relative mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-16">
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">Discover</p>
          <h1 className="headline mt-3 text-3xl tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl lg:text-5xl">
            Explore all stories
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-zinc-500 dark:text-zinc-400">
            Every essay on Inkwell, filterable by topic, tag, and author.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8">
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
        </div>

        {articles === null ? (
          <ErrorState
            title="Couldn't load stories"
            description="The article feed is temporarily unavailable."
            action={
              <Link
                href="/blog"
                className="inline-flex h-9 items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Try again
              </Link>
            }
          />
        ) : (
          <>
            <h2
              id="blog-results"
              aria-live="polite"
              className="mb-6 scroll-mt-24 text-sm text-zinc-500 dark:text-zinc-400"
            >
              {articles.total === 0
                ? "No stories found"
                : `${articles.total} ${articles.total === 1 ? "story" : "stories"}${
                    articles.total > BLOG_PAGE_SIZE
                      ? ` · page ${articles.page} of ${Math.ceil(articles.total / BLOG_PAGE_SIZE)}`
                      : ""
                  }`}
            </h2>
            {articles.items.length === 0 ? (
              <EmptyState
                icon={<SearchX className="h-5 w-5" aria-hidden />}
                title="No stories match those filters"
                description="Try a different keyword, or clear the filters to browse everything."
                action={
                  hasActiveFilters ? (
                    <Link
                      href="/blog"
                      className="inline-flex h-9 items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      Clear all filters
                    </Link>
                  ) : (
                    <Link
                      href="/write"
                      className="inline-flex h-9 items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
