import type { Metadata } from "next";
import { Users } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { AuthorCard } from "@/src/components/blog/AuthorCard";
import { CollectionJsonLd } from "@/src/components/seo/JsonLd";
import { canonical, seoDescription, seoTitle } from "@/src/lib/seo";
import { fetchAuthors } from "@/src/lib/server-api";

export const metadata: Metadata = {
  title: seoTitle("Our Authors"),
  description: seoDescription("Meet the Inkwell writers — engineers, designers, and storytellers covering technology, design, business, and culture."),
  alternates: { canonical: canonical("/authors") },
  openGraph: {
    type: "website",
    title: "Our Authors — Inkwell",
    description: "Engineers, designers, and storytellers behind every essay.",
    url: canonical("/authors"),
  },
  twitter: { card: "summary", title: "Our Authors — Inkwell", description: "Writers behind every Inkwell essay." },
};

/**
 * Author directory — every profile with published-output counts served
 * by GET /authors (includes writers with zero posts, unlike the popular
 * leaderboard). Server-rendered for SEO; cards link to /author/[username].
 */
export default async function AuthorsPage() {
  const directory = await fetchAuthors(1, 50);

  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden border-b border-zinc-200/70 dark:border-zinc-800/70">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/80 via-white to-white dark:from-zinc-900/50 dark:via-zinc-950 dark:to-zinc-950" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-16">
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">People</p>
          <h1 className="headline mt-3 text-3xl tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl lg:text-5xl">
            Our authors
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-zinc-500 dark:text-zinc-400">
            Engineers, designers, and storytellers — the people behind every essay.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <CollectionJsonLd name="Authors — Inkwell" description="Meet the Inkwell writers." url="/authors" />

        {directory === null ? (
          <ErrorState title="Couldn't load authors" description="The directory is temporarily unavailable." />
        ) : directory.items.length === 0 ? (
          <EmptyState
            icon={<Users className="h-5 w-5" aria-hidden />}
            title="No authors yet"
            description="Author profiles appear here once writers join."
          />
        ) : (
          <>
            <p className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400" aria-live="polite">
              {directory.total} {directory.total === 1 ? "writer" : "writers"}
            </p>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {directory.items.map((author) => (
                <li key={author.username}>
                  <AuthorCard
                    author={{
                      _id: author.username,
                      username: author.username,
                      displayName: author.displayName,
                      title: author.title,
                      bio: author.bio,
                      avatarUrl: author.avatarUrl,
                      postCount: author.postCount,
                      followerCount: author.followerCount,
                      user: null,
                    }}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
