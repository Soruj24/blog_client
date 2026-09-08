"use client";

export function SeoPreview({
  title,
  description,
  url,
  image,
}: {
  title: string;
  description: string;
  url: string;
  image?: string | null;
}) {
  const displayTitle = title || "Untitled — your SEO title appears here";
  const displayDesc = description || "Your meta description appears here. Keep it under 160 characters, make it compelling for clicks from Google.";
  const displayUrl = url || "https://inkwell.demo/blog/your-post-slug";

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/70 bg-white dark:border-zinc-800/70 dark:bg-zinc-950">
      <div className="px-4 py-3">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Google preview</p>
        <div className="mt-2">
          <p className="truncate text-xs text-emerald-600 dark:text-emerald-400">{displayUrl}</p>
          <p className="mt-0.5 line-clamp-2 text-base font-medium leading-snug text-[#1a0dab] dark:text-[#8ab4f8]">
            {displayTitle.slice(0, 70)}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-zinc-500">
            {displayDesc.slice(0, 160)}
          </p>
        </div>
      </div>
      {image && (
        <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Social image</p>
          <div className="mt-2 overflow-hidden rounded-lg border border-zinc-200/70 dark:border-zinc-800/70">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="Open Graph preview" className="h-32 w-full object-cover" />
          </div>
        </div>
      )}
      <div className="flex gap-3 border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
        <span className={`text-[11px] ${displayTitle.length > 60 ? "text-amber-500" : "text-zinc-400"}`}>
          {displayTitle.length}/70
        </span>
        <span className={`text-[11px] ${displayDesc.length > 155 ? "text-amber-500" : "text-zinc-400"}`}>
          {displayDesc.length}/160
        </span>
      </div>
    </div>
  );
}
