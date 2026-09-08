import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { Eye, Heart, MessageCircle } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import type { ArticleSummary } from "@/src/store/api/contentApi";
import { ArticleMeta } from "./ArticleMeta";
import { SearchHighlight } from "./SearchHighlight";

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}

export function CoverFallback({ title }: { title: string }) {
  return (
    <span
      aria-hidden
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300 p-6 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800"
    >
      <span className="headline line-clamp-3 text-center text-lg text-zinc-500 dark:text-zinc-500">
        {title}
      </span>
    </span>
  );
}

export const PostCard = memo(function PostCard({ article, highlight }: { article: ArticleSummary; highlight?: string }) {
  const href = `/blog/${article.slug}`;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white transition-all duration-200 hover:border-zinc-300 hover:shadow-lift dark:border-zinc-800/70 dark:bg-zinc-950 dark:hover:border-zinc-700">
      <Link
        href={href}
        aria-hidden="true"
        tabIndex={-1}
        className="relative block aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-900"
      >
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <CoverFallback title={article.title} />
        )}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {article.category && (
          <p>
            <Badge tone="neutral">{article.category.name}</Badge>
          </p>
        )}
        <h3 className="headline mt-3 text-xl leading-snug text-zinc-900 dark:text-zinc-100">
          <Link
            href={href}
            className="transition-colors duration-200 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
          >
            {highlight ? <SearchHighlight text={article.title} query={highlight} /> : article.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {highlight ? <SearchHighlight text={article.excerpt} query={highlight} /> : article.excerpt}
        </p>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <ArticleMeta
            author={article.author}
            publishedAt={article.publishedAt}
            readingTime={article.readingTime}
          />
          <p className="flex shrink-0 items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
            <span className="inline-flex items-center gap-1" title={`${article.views} views`}>
              <Eye className="h-3.5 w-3.5" aria-hidden />
              {formatCount(article.views)}
            </span>
            <span className="inline-flex items-center gap-1" title={`${article.likeCount} likes`}>
              <Heart className="h-3.5 w-3.5" aria-hidden />
              {formatCount(article.likeCount)}
            </span>
            <span className="hidden items-center gap-1 sm:inline-flex" title={`${article.commentCount} comments`}>
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              {formatCount(article.commentCount)}
            </span>
          </p>
        </div>
      </div>
    </article>
  );
});
