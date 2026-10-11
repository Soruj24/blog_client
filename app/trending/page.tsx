import type { Metadata } from "next";
import Link from "next/link";
import { Flame, Heart } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { SectionHeading } from "@/src/components/blog/SectionHeading";
import { TrendingPost } from "@/src/components/blog/TrendingPost";
import type { ArticleSummary } from "@/src/store/api/contentApi";
import { fetchBlogArticles } from "@/src/lib/server-api";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Trending",
  description:
    "What the Inkwell community is reading and loving right now — most-read and most-loved stories, ranked from real engagement.",
  alternates: { canonical: "/trending" },
  openGraph: {
    type: "website",
    title: "Trending now — Inkwell",
    description: "Most-read and most-loved stories, ranked from real reader engagement.",
    url: "/trending",
  },
  twitter: {
    card: "summary",
    title: "Trending now — Inkwell",
    description: "Most-read and most-loved stories, ranked from real reader engagement.",
  },
  robots: { index: false, follow: true },
};

function RankingList({
  items,
  emptyTitle,
  emptyDescription,
  emptyIcon = "flame",
}: {
  items: ArticleSummary[];
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon?: "flame" | "heart";
}) {
  if (items.length === 0) {
    const Icon = emptyIcon === "heart" ? Heart : Flame;
    return (
      <EmptyState
        icon={<Icon className="h-5 w-5" aria-hidden />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }
  return (
    <ol className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
      {items.map((article, i) => (
        <li key={article.id}>
          <TrendingPost article={article} rank={i + 1} />
        </li>
      ))}
    </ol>
  );
}

/**
 * Rankings from real engagement: most-read by view counts
 * (sort=popular), most-loved by like counts (sort=liked).
 * Server-rendered + ISR so crawlers and first paint see numbers,
 * not a placeholder.
 */
export default async function TrendingPage() {
  const [popular, liked] = await Promise.all([
    fetchBlogArticles({
      q: "",
      category: "",
      tag: "",
      author: "",
      sort: "popular",
      featured: false,
      page: 1,
      limit: 10,
    }),
    fetchBlogArticles({
      q: "",
      category: "",
      tag: "",
      author: "",
      sort: "liked",
      featured: false,
      page: 1,
      limit: 10,
    }),
  ]);

  if (popular === null || liked === null) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <ErrorState
          title="Couldn't load rankings"
          description="Trending lists are temporarily unavailable."
          action={
            <Link
              href="/trending"
              className="inline-flex h-10 items-center rounded-full bg-zinc-900 px-5 text-sm font-medium text-white transition-colors outline-none hover:bg-zinc-800 active:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:active:bg-zinc-300 dark:focus-visible:outline-zinc-100"
            >
              Try again
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 sm:pb-20">
      <div className="border-b border-zinc-200/70 dark:border-zinc-800/70">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-14">
          <p className="eyebrow text-zinc-500 dark:text-zinc-400">Rankings</p>
          <h1 className="headline mt-2 text-3xl tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Trending now
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Most-read and most-loved stories, ranked from real reader
            engagement.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          <section aria-labelledby="most-read-heading">
            <SectionHeading
              id="most-read-heading"
              eyebrow="By reads"
              title="Most read"
            />
            <RankingList
              items={popular.items}
              emptyTitle="Nothing trending yet"
              emptyDescription="Rankings appear once readers start showing up."
            />
          </section>
          <section aria-labelledby="most-loved-heading">
            <SectionHeading
              id="most-loved-heading"
              eyebrow="By likes"
              title="Most loved"
              description="Stories readers couldn't help but applaud."
            />
            <RankingList
              items={liked.items}
              emptyTitle="No loved stories yet"
              emptyDescription="Rankings appear once readers start applauding."
              emptyIcon="heart"
            />
          </section>
        </div>
      </div>
    </div>
  );
}
