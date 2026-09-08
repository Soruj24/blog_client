import type {
  AuthorProfile,
  Category,
  PagedArticles,
  PopularAuthor,
} from "@/src/store/api/contentApi";

export interface Tag {
  _id: string;
  name: string;
  slug: string;
  postCount: number;
}

const apiBase =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/api/v1";

async function get<T>(path: string, params?: Record<string, string>, revalidate = 60): Promise<T | null> {
  const url = new URL(`${apiBase}${path}`);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  try {
    const res = await fetch(url.toString(), { next: { revalidate } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: T };
    return json.data;
  } catch {
    return null;
  }
}

/** Allowed sorts — anything else falls back to latest (never 400s the page). */
export type ArticleSort = "latest" | "popular" | "liked";

export interface BlogFilters {
  q: string;
  category: string;
  tag: string;
  author: string;
  sort: ArticleSort;
  featured: boolean;
  page: number;
  /** Overrides the default page size (popular rails, sidebars). */
  limit?: number;
}

export const BLOG_PAGE_SIZE = 9;

/** Sanitizes raw URL params into a safe filter object (URL stays source of truth). */
export function parseBlogFilters(params: Record<string, string | string[] | undefined>): BlogFilters {
  const first = (v: string | string[] | undefined): string =>
    Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  const sortRaw = first(params["sort"]);
  const pageRaw = Number(first(params["page"]));
  return {
    q: first(params["q"]).slice(0, 100),
    category: first(params["category"]).toLowerCase().slice(0, 80),
    tag: first(params["tag"]).toLowerCase().slice(0, 60),
    author: first(params["author"]).toLowerCase().slice(0, 30),
    sort: sortRaw === "popular" || sortRaw === "liked" ? sortRaw : "latest",
    featured: first(params["featured"]) === "true",
    page: Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1,
  };
}

export function fetchBlogArticles(filters: BlogFilters): Promise<PagedArticles | null> {
  const limit = filters.limit ?? BLOG_PAGE_SIZE;
  const params: Record<string, string> = {
    page: String(filters.page),
    limit: String(limit),
    sort: filters.sort,
  };
  if (filters.q.trim().length >= 2) params["search"] = filters.q.trim();
  if (filters.category) params["category"] = filters.category;
  if (filters.tag) params["tag"] = filters.tag;
  if (filters.author) params["author"] = filters.author;
  if (filters.featured) params["featured"] = "true";
  return get<PagedArticles>("/articles", params, 30);
}

/** Filter options — cached longer, failures degrade to empty lists. */export async function fetchBlogFacets(): Promise<{
  categories: Category[];
  tags: Tag[];
  authors: PopularAuthor[];
}> {
  const [categories, tags, authors] = await Promise.all([
    get<Category[]>("/categories", undefined, 300),
    get<Tag[]>("/tags", { limit: "50" }, 300),
    get<PopularAuthor[]>("/users/authors/popular", { limit: "12" }, 300),
  ]);
  return { categories: categories ?? [], tags: tags ?? [], authors: authors ?? [] };
}

/** Public author profile — null when unknown (page renders not-found). */
export function fetchAuthorProfile(username: string): Promise<AuthorProfile | null> {
  return get<AuthorProfile>(`/authors/${encodeURIComponent(username.toLowerCase())}`, undefined, 60);
}
