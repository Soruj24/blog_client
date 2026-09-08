import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/src/components/ui/Badge";
import { Avatar } from "@/src/components/ui/Avatar";
import { Separator } from "@/src/components/ui/separator";
import { RelatedStoryMeta } from "./RelatedStoryMeta";
import type { ArticleSummary } from "@/src/store/api/contentApi";

function CoverFallback({ title }: { title: string }) {
  return (
    <span
      aria-hidden
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300 p-4 dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-800"
    >
      <span className="line-clamp-2 text-center text-sm font-medium text-zinc-500 dark:text-zinc-500">
        {title}
      </span>
    </span>
  );
}

export function RelatedStoryCard({ article }: { article: ArticleSummary }) {
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

        <h3 className="mt-3 line-clamp-2 text-base font-bold leading-snug tracking-tight text-zinc-900 dark:text-zinc-100">
          <Link
            href={href}
            className="transition-colors duration-200 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            {article.title}
          </Link>
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {article.excerpt}
        </p>

        <div className="mt-auto">
          <Separator className="my-4" />

          <div className="flex items-center gap-2.5">
            {article.author && (
              <Avatar name={article.author.name} src={article.author.avatarUrl} size="xs" />
            )}
            {article.author && (
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {article.author.name}
              </span>
            )}
          </div>

          <div className="mt-3">
            <RelatedStoryMeta
              publishedAt={article.publishedAt}
              readingTime={article.readingTime}
              views={article.views}
              likeCount={article.likeCount}
              commentCount={article.commentCount}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
