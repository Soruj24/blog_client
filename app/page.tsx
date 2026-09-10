import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { FeaturedSection } from "@/src/components/home/FeaturedSection";
import { HeroSection } from "@/src/components/home/HeroSection";
import { LatestSection } from "@/src/components/home/LatestSection";

const TrendingSection = dynamic(
  () => import("@/src/components/home/TrendingSection").then((m) => m.TrendingSection),
  {
    loading: () => (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16" aria-hidden>
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="mt-8 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    ),
  }
);

const CategoriesSection = dynamic(
  () => import("@/src/components/home/CategoriesSection").then((m) => m.CategoriesSection),
  {
    loading: () => (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16" aria-hidden>
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[92px] animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    ),
  }
);

const EditorsPicksSection = dynamic(
  () => import("@/src/components/home/EditorsPicksSection").then((m) => m.EditorsPicksSection)
);

const AuthorsSection = dynamic(
  () => import("@/src/components/home/AuthorsSection").then((m) => m.AuthorsSection)
);

const NewsletterSection = dynamic(
  () => import("@/src/components/home/NewsletterSection").then((m) => m.NewsletterSection)
);

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Inkwell — Ideas worth reading slowly" },
  description:
    "Long-form essays and field notes on technology, design, and culture. Discover featured stories, trending reads, top authors, and weekly insights.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "Inkwell — Ideas worth reading slowly",
    description:
      "Long-form essays and field notes on technology, design, and culture.",
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Inkwell" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inkwell — Ideas worth reading slowly",
    description:
      "Long-form essays and field notes on technology, design, and culture.",
  },
};

/** WebSite schema with sitelinks search — helps SEO, zero UI cost. */
function HomepageJsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Inkwell",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={query}`,
      "query-input": "required name=query",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function Home() {
  return (
    <div className="pb-20">
      <HomepageJsonLd />
      <HeroSection />
      <FeaturedSection />
      <LatestSection />
      <TrendingSection />
      <CategoriesSection />
      <EditorsPicksSection />
      <AuthorsSection />
      <NewsletterSection />
    </div>
  );
}
