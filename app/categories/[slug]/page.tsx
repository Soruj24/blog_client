import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { BlogPagination } from "@/src/components/blog/BlogPagination";
import { KeepReading } from "@/src/components/blog/KeepReading";
import { PostGrid } from "@/src/components/blog/PostGrid";
import { BreadcrumbJsonLd, CollectionJsonLd } from "@/src/components/seo/JsonLd";
import { canonical, seoDescription, seoTitle } from "@/src/lib/seo";
import type { Category } from "@/src/store/api/contentApi";
import { BLOG_PAGE_SIZE, fetchBlogArticles } from "@/src/lib/server-api";

const apiBase =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/api/v1";

async function fetchCategory(slug: string): Promise<Category | null> {
  try {
    const res = await fetch(`${apiBase}/categories`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: Category[] };
    return json.data.find((c) => c.slug === slug.toLowerCase()) ?? null;
  } catch {
    return null;
  }
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) return { title: "Category not found", robots: { index: false, follow: false } };
  const sp = await searchParams;
  const page = Number(Array.isArray(sp["page"]) ? sp["page"][0] : sp["page"]);
  const title = seoTitle(`${category.name} — Stories & Insights`);
  const description = seoDescription(category.description || `Browse all ${category.name} stories on Inkwell. Curated articles on ${category.name.toLowerCase()}.`);
  const path = page && page > 1 ? `/categories/${category.slug}?page=${page}` : `/categories/${category.slug}`;
  return {
    title,
    description,
    alternates: { canonical: canonical(path) },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical(path),
      siteName: "Inkwell",
    },
    twitter: { card: "summary", title, description },
    robots: page && page > 1 ? { index: true, follow: true } : undefined,
  };
}

export default async function CategoryDetailPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const rawPage = Number(Array.isArray(sp["page"]) ? sp["page"][0] : sp["page"]);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const category = await fetchCategory(slug);
  if (!category) notFound();

  const articles = await fetchBlogArticles({
    q: "",
    category: category.slug,
    tag: "",
    author: "",
    sort: "latest",
    featured: false,
    page,
  });

  const url = canonical(`/categories/${category.slug}`);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Categories", url: "/categories" },
          { name: category.name, url: `/categories/${category.slug}` },
        ]}
      />
      <CollectionJsonLd
        name={`${category.name} — Inkwell`}
        description={category.description || `Browse all ${category.name} stories on Inkwell.`}
        url={`/categories/${category.slug}`}
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
            <Link href="/categories" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100">
              Categories
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-zinc-900 dark:text-zinc-100">
            {category.name}
          </li>
        </ol>
      </nav>

      <div className="mt-4 flex items-center gap-4">
        <span
          aria-hidden
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: `${category.color ?? "#71717a"}1a`,
            color: category.color ?? "#71717a",
          }}
        >
          <LayoutGrid className="h-6 w-6" />
        </span>
        <div>
          <h1 className="headline text-3xl sm:text-4xl">{category.name}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {category.postCount} {category.postCount === 1 ? "article" : "articles"}
            {category.description ? ` — ${category.description}` : ""}
          </p>
        </div>
      </div>

      {articles === null ? (
        <div className="mt-6">
          <ErrorState
            title="Couldn't load stories"
            description="The category feed is temporarily unavailable."
            action={
              <Link
                href={`/categories/${category.slug}`}
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
            icon={<LayoutGrid className="h-5 w-5" aria-hidden />}
            title={`No stories in ${category.name} yet`}
            description="New articles in this topic will appear here once published."
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

      <KeepReading title="Keep reading" excludeCategory={category.slug} />
      <link rel="canonical" href={url} />
    </div>
  );
}
