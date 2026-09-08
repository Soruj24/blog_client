import { SITE_URL } from "@/src/lib/seo";

type BreadcrumbItem = { name: string; url: string };

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: it.url.startsWith("http") ? it.url : `${SITE_URL}${it.url}`,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

export function ArticleJsonLd({
  title,
  excerpt,
  slug,
  coverImage,
  publishedAt,
  updatedAt,
  author,
  category,
  tags,
}: {
  title: string;
  excerpt: string;
  slug: string;
  coverImage?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  author?: { name: string; username?: string } | null;
  category?: string | null;
  tags?: string[];
}) {
  const url = `${SITE_URL}/blog/${slug}`;
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: excerpt,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    datePublished: publishedAt || undefined,
    dateModified: updatedAt || publishedAt || undefined,
    author: author
      ? {
          "@type": "Person",
          name: author.name,
          url: author.username ? `${SITE_URL}/author/${author.username}` : undefined,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "Inkwell",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.png` },
    },
    image: coverImage ? [coverImage.startsWith("http") ? coverImage : `${SITE_URL}${coverImage}`] : undefined,
    articleSection: category || undefined,
    keywords: tags?.join(", ") || undefined,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

export function AuthorJsonLd({
  name,
  username,
  bio,
  avatarUrl,
  sameAs,
}: {
  name: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  sameAs?: string[];
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: `${SITE_URL}/author/${username}`,
    description: bio || undefined,
    image: avatarUrl || undefined,
    sameAs: sameAs && sameAs.length ? sameAs : undefined,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}

export function CollectionJsonLd({
  name,
  description,
  url,
}: {
  name: string;
  description: string;
  url: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: url.startsWith("http") ? url : `${SITE_URL}${url}`,
    isPartOf: { "@type": "WebSite", name: "Inkwell", url: SITE_URL },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
