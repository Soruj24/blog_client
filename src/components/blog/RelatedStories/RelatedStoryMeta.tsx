import { Clock, Eye, Heart, MessageCircle } from "lucide-react";

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface RelatedStoryMetaProps {
  publishedAt: string | null;
  readingTime: number;
  views: number;
  likeCount: number;
  commentCount: number;
}

export function RelatedStoryMeta({
  publishedAt,
  readingTime,
  views,
  likeCount,
  commentCount,
}: RelatedStoryMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 dark:text-zinc-500">
      {publishedAt && (
        <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
      )}
      <span className="inline-flex items-center gap-1" title={`${views} views`}>
        <Eye className="h-3 w-3" aria-hidden />
        {formatCount(views)}
      </span>
      <span className="inline-flex items-center gap-1" title={`${likeCount} likes`}>
        <Heart className="h-3 w-3" aria-hidden />
        {formatCount(likeCount)}
      </span>
      <span className="inline-flex items-center gap-1" title={`${commentCount} comments`}>
        <MessageCircle className="h-3 w-3" aria-hidden />
        {formatCount(commentCount)}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="h-3 w-3" aria-hidden />
        {readingTime} min
      </span>
    </div>
  );
}
