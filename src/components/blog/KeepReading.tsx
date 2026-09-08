import { PostGrid } from "./PostGrid";
import { fetchBlogArticles } from "@/src/lib/server-api";

export interface KeepReadingProps {
  title?: string;
  excludeCategory?: string;
  excludeTag?: string;
  limit?: number;
}

/**
 * "Keep reading" rail for taxonomy hubs: latest stories outside the
 * current topic. Server-rendered, cached with the feed — no waterfall.
 */
export async function KeepReading({
  title = "Keep reading",
  excludeCategory,
  excludeTag,
  limit = 3,
}: KeepReadingProps) {
  const feed = await fetchBlogArticles({
    q: "",
    category: "",
    tag: "",
    author: "",
    sort: "latest",
    featured: false,
    page: 1,
  });
  const items = (feed?.items ?? [])
    .filter(
      (a) =>
        (!excludeCategory || a.category?.slug !== excludeCategory) &&
        (!excludeTag || !a.tags.some((t) => t.slug === excludeTag)),
    )
    .slice(0, limit);

  if (items.length === 0) return null;

  return (
    <section aria-label={title} className="mt-14">
      <h2 className="headline text-2xl text-zinc-900 dark:text-zinc-100">{title}</h2>
      <div className="mt-6">
        <PostGrid articles={items} />
      </div>
    </section>
  );
}
