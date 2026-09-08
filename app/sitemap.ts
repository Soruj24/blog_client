import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const API = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

interface Category { slug: string; updatedAt?: string }
interface Tag { slug: string }
interface Author { username: string }
interface Article { slug: string; updatedAt?: string; publishedAt?: string | null }

async function getJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: T };
    return json.data;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/categories`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/tags`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/search`, changeFrequency: "weekly", priority: 0.5 },
  ];

  const [articles, categories, tags, authors] = await Promise.all([
    getJson<Article[]>("/articles?limit=100&sort=latest"),
    getJson<Category[]>("/categories"),
    getJson<Tag[]>("/tags?limit=100"),
    // authors come from profiles with published posts; fallback to empty
    getJson<Author[]>("/users/authors/popular?limit=50"),
  ]);

  // Articles may be paginated object; handle both shapes
  let articleEntries: Article[] = [];
  if (Array.isArray(articles)) articleEntries = articles;
  else if (articles && typeof articles === "object" && "items" in (articles as Record<string, unknown>)) {
    articleEntries = (articles as unknown as { items: Article[] }).items ?? [];
  }

  const articleUrls: MetadataRoute.Sitemap = articleEntries.map((a) => ({
    url: `${SITE_URL}/blog/${a.slug}`,
    lastModified: a.updatedAt ? new Date(a.updatedAt) : a.publishedAt ? new Date(a.publishedAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryUrls: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${SITE_URL}/categories/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const tagUrls: MetadataRoute.Sitemap = (tags ?? []).map((t) => ({
    url: `${SITE_URL}/tags/${t.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const authorUrls: MetadataRoute.Sitemap = (authors ?? []).map((a) => ({
    url: `${SITE_URL}/author/${a.username}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleUrls, ...categoryUrls, ...tagUrls, ...authorUrls];
}
