import type { Metadata } from "next";
import Link from "next/link";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { BlogPagination } from "@/src/components/blog/BlogPagination";
import { PostGrid } from "@/src/components/blog/PostGrid";
import { NoSearchResults, RecentSearches } from "@/src/components/blog/RecentSearches";
import { SearchBox } from "@/src/components/blog/SearchBox";
import { canonical, seoDescription, seoTitle } from "@/src/lib/seo";
import { BLOG_PAGE_SIZE, fetchBlogArticles, parseBlogFilters } from "@/src/lib/server-api";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const sp = await searchParams;
  const raw = Array.isArray(sp["q"]) ? sp["q"][0] : sp["q"];
  const q = (raw ?? "").trim().slice(0, 100);
  const title = q ? seoTitle(`Search: "${q}"`) : "Search — Inkwell";
  const description = q
    ? seoDescription(`Search results for "${q}" across Inkwell titles, bodies, authors, categories, and tags.`)
    : "Search Inkwell articles by title, content, author, category, or tag.";
  const path = q ? `/search?q=${encodeURIComponent(q)}` : "/search";
  return {
    title,
    description,
    alternates: { canonical: canonical(path) },
    openGraph: { type: "website", title, description, url: canonical(path) },
    twitter: { card: "summary", title, description },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const filters = parseBlogFilters(sp);
  const q = filters.q;

  const articles = q ? await fetchBlogArticles({ ...filters, sort: filters.sort }) : null;

  return (
    <div className="min-h-screen">
      {/* ── Hero area ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-zinc-200/70 dark:border-zinc-800/70">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/80 via-white to-white dark:from-zinc-900/50 dark:via-zinc-950 dark:to-zinc-950" />
        <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-zinc-100/50 blur-3xl dark:bg-zinc-800/20" />

        <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">Discover</p>
          <h1 className="headline mt-3 text-3xl tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl lg:text-5xl">
            Search stories
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-zinc-500 dark:text-zinc-400">
            Find articles by title, content, author, category, or tag.
          </p>

          {/* Search box — centered, prominent */}
          <div className="mx-auto mt-8 max-w-2xl">
            <SearchBox key={q} initialQ={q} />
          </div>
        </div>
      </div>

      {/* ── Results area ───────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {!q ? (
          <div className="mx-auto max-w-2xl">
            <RecentSearches />
          </div>
        ) : articles === null ? (
          <div className="mx-auto max-w-2xl">
            <ErrorState
              title="Search is unavailable"
              description="The search service didn't respond. Check your query and try again."
              action={
                <Link
                  href={`/search?q=${encodeURIComponent(q)}`}
                  className="inline-flex h-9 items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Try again
                </Link>
              }
            />
          </div>
        ) : (
          <>
            {/* Result count */}
            <div className="mb-8">
              <p aria-live="polite" className="text-sm text-zinc-500 dark:text-zinc-400">
                {articles.total === 0 ? (
                  <>No stories found for &ldquo;<span className="font-medium text-zinc-900 dark:text-zinc-100">{q}</span>&rdquo;</>
                ) : (
                  <>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{articles.total}</span>{" "}
                    {articles.total === 1 ? "story" : "stories"} matching &ldquo;
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{q}</span>&rdquo;
                    {articles.total > BLOG_PAGE_SIZE && (
                      <span className="ml-1 text-zinc-400">
                        — page {articles.page} of {Math.ceil(articles.total / BLOG_PAGE_SIZE)}
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>

            {articles.items.length === 0 ? (
              <NoSearchResults query={q} />
            ) : (
              <>
                <PostGrid articles={articles.items} highlight={q} />
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
