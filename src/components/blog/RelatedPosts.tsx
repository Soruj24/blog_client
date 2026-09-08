import { PostCard } from "./PostCard";
import type { ArticleSummary } from "@/src/store/api/contentApi";

/**
 * Related stories — server-rendered from props (fetched alongside
 * the article, no client waterfall). Hidden when empty.
 */
export function RelatedPosts({ items }: { items: ArticleSummary[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="mt-14">
      <h2 id="related-heading" className="headline text-2xl text-zinc-900 dark:text-zinc-100">
        Related stories
      </h2>
      <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((article) => (
          <li key={article.id}>
            <PostCard article={article} />
          </li>
        ))}
      </ul>
    </section>
  );
}
