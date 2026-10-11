import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const API = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

interface Category { slug: string; updatedAt?: string }
interface Tag { slug: string }
interface Author { username: string }
interface PagedAuthors { items: Author[] }
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

function toArray<T>(data: T[] | { items: T[] } | null): T[] {
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

/**
 * Article listing caps `limit` at 30 (see listArticlesSchema), so page
 * through the feed instead of requesting 100 at once (which 400s and
 * silently yields zero article URLs).
 */
async function getAllArticles(): Promise<Article[]> {
  const PAGE_SIZE = 30;
  const MAX_PAGES = 50; // 1,500 URLs — raise with a sitemap index if exceeded
  const out: Article[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await getJson<Article[] | { items: Article[] }>(
      `/articles?limit=${PAGE_SIZE}&page=${page}&sort=latest`,
    );
    const items = toArray(data);
    out.push(...items);
    if (items.length < PAGE_SIZE) break;
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // NOTE: /search is intentionally excluded — the page is noindex,follow.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/blog`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/categories`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/tags`, changeFrequency: "daily", priority: 0.6 },
  ];

  const [articles, categories, tags, authors] = await Promise.all([
    getAllArticles(),
    getJson<Category[]>("/categories"),
    getJson<Tag[]>("/tags"),
    // Full directory (includes zero-post writers), not the top-12 leaderboard.
    getJson<Author[] | PagedAuthors>("/authors?limit=50"),
  ]);

  const articleUrls: MetadataRoute.Sitemap = articles.map((a) => ({
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

  const tagUrls: MetadataRoute.Sitemap = toArray(tags).map((t) => ({
    url: `${SITE_URL}/tags/${t.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const authorUrls: MetadataRoute.Sitemap = toArray(authors).map((a) => ({
    url: `${SITE_URL}/author/${a.username}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleUrls, ...categoryUrls, ...tagUrls, ...authorUrls];
}
