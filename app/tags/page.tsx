import type { Metadata } from "next";
import { Tag as TagIcon } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { TagCard } from "@/src/components/blog/TagCard";
import { CollectionJsonLd } from "@/src/components/seo/JsonLd";
import { canonical, seoDescription, seoTitle } from "@/src/lib/seo";
import type { Tag } from "@/src/lib/server-api";

export const metadata: Metadata = {
  title: seoTitle("Browse by Tag"),
  description: seoDescription("Browse Inkwell stories by tag — focused topics across every category."),
  alternates: { canonical: canonical("/tags") },
  openGraph: { type: "website", title: "Browse by Tag — Inkwell", description: "Focused topics across every category.", url: canonical("/tags") },
  twitter: { card: "summary", title: "Browse by Tag — Inkwell", description: "Focused topics across every category." },
};

const apiBase =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/api/v1";

async function fetchTags(): Promise<Tag[] | null> {
  try {
    const res = await fetch(`${apiBase}/tags?limit=100`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: Tag[] };
    return json.data;
  } catch {
    return null;
  }
}

export default async function TagsPage() {
  const tags = await fetchTags();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <CollectionJsonLd name="Tags — Inkwell" description="Browse stories by tag on Inkwell." url="/tags" />
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Discover</p>
      <h1 className="headline mt-2 text-3xl sm:text-4xl">Browse by tag</h1>
      <p className="mt-2 max-w-xl text-zinc-600 dark:text-zinc-400">Fine-grained topics that cut across categories — follow a thread.</p>

      {tags === null ? (
        <div className="mt-6">
          <ErrorState title="Couldn't load tags" description="The directory is temporarily unavailable." />
        </div>
      ) : tags.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={<TagIcon className="h-5 w-5" aria-hidden />} title="No tags yet" description="Tags appear here once stories start using them." />
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <li key={tag._id}>
              <TagCard tag={tag} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
