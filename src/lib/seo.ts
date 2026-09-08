import type { Metadata } from "next";

/**
 * Central SEO configuration.
 * Keep all title/description/canonical logic here so routes stay thin.
 */
export const SITE_NAME = "Inkwell";
export const SITE_TAGLINE = "A modern editorial blogging platform";
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

const SITE_DESCRIPTION =
  "Discover and read long-form articles on technology, design, and culture. Inkwell publishes thoughtful essays from builders and thinkers.";

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
  category: "technology",
};

/** Build absolute canonical URL for a path (ensures no duplicate trailing slash) */
export function canonical(path: string): string {
  const clean = path === "/" ? "/" : `/${path.replace(/^\/+/, "").replace(/\/+$/, "")}`;
  return `${SITE_URL}${clean}`;
}

/** Optimize title to 50-60 chars for SERP; append site name via template, not here */
export function seoTitle(title: string, max = 60): string {
  const t = title.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 3).trim()}...`;
}

/** Optimize description to 150-160 chars */
export function seoDescription(desc: string, max = 155): string {
  const d = desc.trim().replace(/\s+/g, " ");
  if (d.length <= max) return d;
  return `${d.slice(0, max - 3).trim()}...`;
}

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return canonical(pathOrUrl);
}

export function articleMetadata(article: {
  title: string;
  excerpt: string;
  slug: string;
  coverImage?: string | null;
}): Metadata {
  const url = canonical(`/blog/${article.slug}`);
  const title = seoTitle(article.title);
  const desc = seoDescription(article.excerpt);
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description: desc,
      images: article.coverImage
        ? [{ url: absoluteUrl(article.coverImage), alt: article.title, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: article.coverImage ? "summary_large_image" : "summary",
      title,
      description: desc,
      images: article.coverImage ? [absoluteUrl(article.coverImage)] : undefined,
    },
  };
}

export const noIndex: Metadata["robots"] = { index: false, follow: false, nocache: true };
export const noIndexFollow: Metadata["robots"] = { index: false, follow: true };
