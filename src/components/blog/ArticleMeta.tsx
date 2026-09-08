import { Clock } from "lucide-react";
import { Avatar } from "@/src/components/ui/Avatar";
import type { PublicAuthor } from "@/src/store/api/contentApi";

export interface ArticleMetaProps {
  author: PublicAuthor | null;
  publishedAt: string | null;
  readingTime: number;
  className?: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Shared article byline — avatar, name, date, reading time.
 * Used by every card so author/reading-time markup never drifts.
 */
export function ArticleMeta({ author, publishedAt, readingTime, className = "" }: ArticleMetaProps) {
  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400 ${className}`}>
      {author && (
        <>
          <Avatar name={author.name} src={author.avatarUrl} size="xs" />
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{author.name}</span>
          <span aria-hidden>·</span>
        </>
      )}
      {publishedAt && (
        <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
      )}
      <span aria-hidden>·</span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        {readingTime} min read
      </span>
    </p>
  );
}
