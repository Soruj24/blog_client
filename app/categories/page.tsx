import type { Metadata } from "next";
import { LayoutGrid } from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { CategoryCard } from "@/src/components/blog/CategoryCard";
import { CollectionJsonLd } from "@/src/components/seo/JsonLd";
import { canonical, seoDescription, seoTitle } from "@/src/lib/seo";
import type { Category } from "@/src/store/api/contentApi";

export const metadata: Metadata = {
  title: seoTitle("Browse by Topic"),
  description: seoDescription("Browse Inkwell stories by topic — technology, design, productivity, culture, and more."),
  alternates: { canonical: canonical("/categories") },
  openGraph: {
    type: "website",
    title: "Browse by Topic — Inkwell",
    description: "Curated hubs for every interest — technology, design, productivity, culture.",
    url: canonical("/categories"),
  },
  twitter: { card: "summary", title: "Browse by Topic — Inkwell", description: "Curated hubs for every interest." },
};

const apiBase =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/api/v1";

async function fetchCategories(): Promise<Category[] | null> {
  try {
    const res = await fetch(`${apiBase}/categories`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: Category[] };
    return json.data;
  } catch {
    return null;
  }
}

export default async function CategoriesPage() {
  const categories = await fetchCategories();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-zinc-200/70 dark:border-zinc-800/70">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/80 via-white to-white dark:from-zinc-900/50 dark:via-zinc-950 dark:to-zinc-950" />
        <div className="relative mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-16">
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">Discover</p>
          <h1 className="headline mt-3 text-3xl tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl lg:text-5xl">
            Browse by topic
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-zinc-500 dark:text-zinc-400">
            Curated hubs for every interest — pick a lane and start reading.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <CollectionJsonLd name="Categories — Inkwell" description="Browse stories by topic on Inkwell." url="/categories" />

        {categories === null ? (
          <ErrorState title="Couldn't load categories" description="The directory is temporarily unavailable." />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={<LayoutGrid className="h-5 w-5" aria-hidden />}
            title="No categories yet"
            description="Curated topics appear here once editors create them."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category._id}>
                <CategoryCard category={category} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
