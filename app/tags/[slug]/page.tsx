import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Tag as TagIcon } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { BlogPagination } from "@/src/components/blog/BlogPagination";
import { KeepReading } from "@/src/components/blog/KeepReading";
import { PostGrid } from "@/src/components/blog/PostGrid";
import { BreadcrumbJsonLd, CollectionJsonLd } from "@/src/components/seo/JsonLd";
import { canonical, seoDescription, seoTitle } from "@/src/lib/seo";
import type { Tag } from "@/src/lib/server-api";
import { BLOG_PAGE_SIZE, fetchBlogArticles } from "@/src/lib/server-api";

const apiBase =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/api/v1";

async function fetchTag(slug: string): Promise<Tag | null> {
  try {
    const res = await fetch(`${apiBase}/tags?limit=100`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: Tag[] };
    return json.data.find((t) => t.slug === slug.toLowerCase()) ?? null;
  } catch {
    return null;
  }
}

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await fetchTag(slug);
  if (!tag) return { title: "Tag not found", robots: { index: false, follow: false } };
  const sp = await searchParams;
  const page = Number(Array.isArray(sp["page"]) ? sp["page"][0] : sp["page"]);
  const title = seoTitle(`#${tag.name} — Stories`);
  const description = seoDescription(`Browse all stories tagged #${tag.name} on Inkwell.`);
  const path = page && page > 1 ? `/tags/${tag.slug}?page=${page}` : `/tags/${tag.slug}`;
  return {
    title,
    description,
    alternates: { canonical: canonical(path) },
    openGraph: { type: "website", title, description, url: canonical(path) },
    twitter: { card: "summary", title, description },
  };
}

export default async function TagDetailPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const rawPage = Number(Array.isArray(sp["page"]) ? sp["page"][0] : sp["page"]);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const tag = await fetchTag(slug);
  if (!tag) notFound();

  const articles = await fetchBlogArticles({
    q: "",
    category: "",
    tag: tag.slug,
    author: "",
    sort: "latest",
    featured: false,
    page,
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Tags", url: "/tags" },
          { name: `#${tag.name}`, url: `/tags/${tag.slug}` },
        ]}
      />
      <CollectionJsonLd
        name={`#${tag.name} — Inkwell`}
        description={`Stories tagged #${tag.name} on Inkwell.`}
        url={`/tags/${tag.slug}`}
      />
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
          <li>
            <Link href="/" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/tags" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
              Tags
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-zinc-900 dark:text-zinc-100">
            #{tag.name}
          </li>
        </ol>
      </nav>

      <div className="mt-4 flex items-center gap-4">
        <span aria-hidden className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          <TagIcon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="headline text-3xl sm:text-4xl">#{tag.name}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {tag.postCount} {tag.postCount === 1 ? "article" : "articles"}
          </p>
        </div>
      </div>

      {articles === null ? (
        <div className="mt-6">
          <ErrorState
            title="Couldn't load stories"
            description="The tag feed is temporarily unavailable."
            action={
              <Link
                href={`/tags/${tag.slug}`}
                className="inline-flex h-8 items-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Try again
              </Link>
            }
          />
        </div>
      ) : articles.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<TagIcon className="h-5 w-5" aria-hidden />}
            title={`No stories tagged #${tag.name} yet`}
            description="New stories with this tag will appear here once published."
            action={
              <Link
                href="/blog"
                className="inline-flex h-9 items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Browse all stories
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-8">
            <PostGrid articles={articles.items} />
          </div>
          <BlogPagination page={articles.page} totalPages={Math.max(1, Math.ceil(articles.total / BLOG_PAGE_SIZE))} />
        </>
      )}

      <KeepReading title="Keep reading" excludeTag={tag.slug} />
    </div>
  );
}
