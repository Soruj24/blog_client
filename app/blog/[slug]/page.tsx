import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock, Eye } from "lucide-react";
import { auth } from "@/auth";
import { Avatar } from "@/src/components/ui/Avatar";
import { Badge } from "@/src/components/ui/Badge";
import { ArticleBody } from "@/src/components/blog/ArticleBody";
import { BookmarkButton, LikeButton } from "@/src/components/blog/ArticleActions";
import { CommentsSection } from "@/src/components/blog/CommentsSection";
import { PrevNextNav } from "@/src/components/blog/PrevNextNav";
import { RelatedStories } from "@/src/components/blog/RelatedStories/RelatedStories";
import { ShareButtons } from "@/src/components/blog/ShareButtons";
import { ViewTracker } from "@/src/components/blog/ViewTracker";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@/src/components/seo/JsonLd";
import { absoluteUrl, canonical, seoDescription, seoTitle } from "@/src/lib/seo";
import type { ArticleDetail, ArticleSummary } from "@/src/store/api/contentApi";

export const revalidate = 60;

const apiBase =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/api/v1";

async function fetchArticle(slug: string): Promise<ArticleDetail | null> {
  const res = await fetch(`${apiBase}/articles/${slug}`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  const json = (await res.json()) as { data: ArticleDetail };
  return json.data;
}

async function fetchRelated(slug: string): Promise<ArticleSummary[]> {
  const res = await fetch(`${apiBase}/articles/${slug}/related?limit=3`, { next: { revalidate: 60 } });
  if (!res.ok) return [];
  const json = (await res.json()) as { data: ArticleSummary[] };
  return json.data;
}

async function fetchEngagement(slug: string, token: string) {
  const res = await fetch(`${apiBase}/articles/${slug}/state`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return { liked: false, bookmarked: false };
  const json = (await res.json()) as { data: { liked: boolean; bookmarked: boolean } };
  return json.data;
}

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) return { title: "Article not found", robots: { index: false, follow: false } };

  const title = seoTitle(article.seoTitle || article.title);
  const description = seoDescription(article.seoDescription || article.excerpt);
  const url = article.canonicalUrl ? absoluteUrl(article.canonicalUrl) : canonical(`/blog/${article.slug}`);
  const image = article.ogImage || article.coverImage;
  const imageUrl = image ? absoluteUrl(image) : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.publishedAt ?? undefined,
      authors: article.author ? [article.author.name] : undefined,
      tags: article.tags.map((t) => t.name),
      section: article.category?.name ?? undefined,
      images: imageUrl
        ? [{ url: imageUrl, alt: article.title, width: 1200, height: 630, type: "image/jpeg" }]
        : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots: article.noIndex ? { index: false, follow: true } : { index: true, follow: true },
    authors: article.author ? [{ name: article.author.name, url: article.author.username ? canonical(`/author/${article.author.username}`) : undefined }] : undefined,
    category: article.category?.name,
    keywords: article.tags.map((t) => t.name),
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function BlogArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const session = await auth();

  const [article, related] = await Promise.all([fetchArticle(slug), fetchRelated(slug)]);
  if (!article) notFound();

  const engagement = session?.backendToken
    ? await fetchEngagement(slug, session.backendToken)
    : { liked: false, bookmarked: false };

  const articleUrl = article.canonicalUrl ? absoluteUrl(article.canonicalUrl) : canonical(`/blog/${article.slug}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <ArticleJsonLd
        title={article.title}
        excerpt={article.excerpt}
        slug={article.slug}
        coverImage={article.coverImage}
        publishedAt={article.publishedAt}
        updatedAt={article.publishedAt}
        author={article.author ? { name: article.author.name, username: article.author.username ?? undefined } : null}
        category={article.category?.name ?? null}
        tags={article.tags.map((t) => t.name)}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: article.title, url: `/blog/${article.slug}` },
        ]}
      />
      <ViewTracker slug={slug} />

      {/* Breadcrumb — trail back to the library, not the current title */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          <li>
            <Link
              href="/"
              className="rounded-sm transition-colors outline-none hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100"
            >
              Home
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600" />
          </li>
          <li>
            <Link
              href="/blog"
              className="rounded-sm transition-colors outline-none hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100"
            >
              Blog
            </Link>
          </li>
          {article.category && (
            <>
              <li aria-hidden>
                <ChevronRight className="h-3.5 w-3.5 text-zinc-300 dark:text-zinc-600" />
              </li>
              <li>
                <Link
                  href={`/blog?category=${article.category.slug}`}
                  aria-current="page"
                  className="rounded-sm font-medium text-zinc-700 transition-colors outline-none hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100"
                >
                  {article.category.name}
                </Link>
              </li>
            </>
          )}
        </ol>
      </nav>

      <article className="mt-8">
        {/* Header */}
        <header>
          <p className="flex flex-wrap items-center gap-2">
            {article.category && (
              <Link
                href={`/blog?category=${article.category.slug}`}
                className="rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
              >
                <Badge tone="primary">{article.category.name}</Badge>
              </Link>
            )}
            {article.featured && <Badge tone="neutral">Featured</Badge>}
          </p>
          <h1 className="headline mt-4 text-3xl leading-[1.15] tracking-tight text-balance text-zinc-900 dark:text-zinc-100 sm:text-4xl lg:text-[2.75rem]">
            {article.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            {article.excerpt}
          </p>

          {/* Byline */}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3">
            {article.author && (
              <p className="flex items-center gap-2.5">
                <Avatar name={article.author.name} src={article.author.avatarUrl} size="md" />
                <span>
                  {article.author.username ? (
                    <Link
                      href={`/author/${article.author.username}`}
                      className="block rounded-sm text-sm font-semibold text-zinc-900 outline-none hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-100 dark:focus-visible:outline-zinc-100"
                    >
                      {article.author.name}
                    </Link>
                  ) : (
                    <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {article.author.name}
                    </span>
                  )}
                  {article.author.username && (
                    <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                      @{article.author.username}
                    </span>
                  )}
                </span>
              </p>
            )}
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-zinc-500 dark:text-zinc-400">
              {article.publishedAt && <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>}
              {article.publishedAt && (
                <span aria-hidden className="text-zinc-300 dark:text-zinc-600">·</span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden />
                {article.readingTime} min read
              </span>
              <span aria-hidden className="text-zinc-300 dark:text-zinc-600">·</span>
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" aria-hidden />
                {article.views.toLocaleString()}
                <span className="sr-only"> reads</span>
              </span>
            </p>
          </div>
        </header>

        {/* Cover image — the visual anchor, directly after the header */}
        {article.coverImage && (
          <figure className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </figure>
        )}

        {/* Article body */}
        <ArticleBody content={article.content} />

        {/* Tags + share */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
          {article.tags.length > 0 ? (
            <div className="min-w-0">
              <h2 className="sr-only">Tags</h2>
              <ul aria-label="Tags" className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <li key={tag.id}>
                    <Link
                      href={`/blog?tag=${tag.slug}`}
                      className="rounded-full outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
                    >
                      <Badge tone="neutral">#{tag.name}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <span aria-hidden className="hidden sm:block" />
          )}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Share</span>
            <ShareButtons title={article.title} />
          </div>
        </div>

        {/* Engagement band — like/save where reading intent peaks */}
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-zinc-200/70 bg-zinc-50 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left dark:border-zinc-800/70 dark:bg-zinc-900/50">
          <div>
            <p className="headline text-xl text-zinc-900 dark:text-zinc-100">Enjoyed this story?</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Show some love or save it for later.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LikeButton slug={slug} initialLiked={engagement.liked} initialCount={article.likeCount} />
            <BookmarkButton slug={slug} initialBookmarked={engagement.bookmarked} />
          </div>
        </div>

        {/* Author card */}
        {article.author && (
          <aside aria-label={`More from ${article.author.name}`} className="mt-6 flex items-center gap-4 rounded-2xl border border-zinc-200/70 bg-white p-5 dark:border-zinc-800/70 dark:bg-zinc-950">
            <Avatar name={article.author.name} src={article.author.avatarUrl} size="lg" />
            <div className="min-w-0">
              <p className="eyebrow text-zinc-500 dark:text-zinc-400">Written by</p>
              <p className="headline mt-1 text-lg text-zinc-900 dark:text-zinc-100">{article.author.name}</p>
              {article.author.username && (
                <Link href={`/author/${article.author.username}`} className="mt-1 inline-block rounded-sm text-sm font-medium text-zinc-600 underline underline-offset-4 transition-colors outline-none hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100">
                  View profile
                </Link>
              )}
            </div>
          </aside>
        )}
      </article>

      <CommentsSection slug={slug} />
      <PrevNextNav prev={article.prev} next={article.next} />
      <RelatedStories items={related} />
      <link rel="canonical" href={articleUrl} />
    </div>
  );
}
