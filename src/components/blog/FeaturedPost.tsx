import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/src/components/ui/Badge";
import type { ArticleSummary } from "@/src/store/api/contentApi";
import { ArticleMeta } from "./ArticleMeta";
import { CoverFallback } from "./PostCard";

/**
 * Hero-size feature: large cover, serif headline, excerpt, byline + CTA.
 * `priority` preloads the LCP image on the homepage hero slot only.
 */
export function FeaturedPost({ article, priority = false }: { article: ArticleSummary; priority?: boolean }) {
  const href = `/blog/${article.slug}`;
  return (
    <article className="group grid gap-8 md:grid-cols-2 md:items-center md:gap-12">
      <Link
        href={href}
        aria-hidden="true"
        tabIndex={-1}
        className="relative block aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-100 shadow-lift transition-shadow duration-300 group-hover:shadow-overlay dark:bg-zinc-900"
      >
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt=""
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <CoverFallback title={article.title} />
        )}
      </Link>
      <div className="flex flex-col justify-center">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">Featured</Badge>
          {article.category && <Badge tone="neutral">{article.category.name}</Badge>}
        </div>
        <h3 className="headline mt-5 text-3xl leading-tight tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl lg:text-[2.5rem]">
          <Link
            href={href}
            className="transition-colors duration-200 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            {article.title}
          </Link>
        </h3>
        <p className="mt-4 line-clamp-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
          {article.excerpt}
        </p>
        <ArticleMeta
          author={article.author}
          publishedAt={article.publishedAt}
          readingTime={article.readingTime}
          className="mt-5"
        />
        <p className="mt-7">
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-zinc-800 hover:shadow-md dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Read article
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </p>
      </div>
    </article>
  );
}
