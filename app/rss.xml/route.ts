import { SITE_URL } from "@/src/lib/seo";

const API = process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const siteUrl = SITE_URL.replace(/\/$/, "");
  let items: Array<{
    title: string;
    slug: string;
    excerpt: string;
    publishedAt?: string | null;
    author?: { name: string } | null;
    category?: { name: string } | null;
  }> = [];

  try {
    const res = await fetch(`${API}/articles?limit=50&sort=latest`, { next: { revalidate: 600 } });
    if (res.ok) {
      const json = (await res.json()) as { data: { items: typeof items } | typeof items };
      const data = json.data as unknown;
      if (Array.isArray(data)) items = data as typeof items;
      else if (data && typeof data === "object" && "items" in (data as Record<string, unknown>)) {
        items = (data as { items: typeof items }).items ?? [];
      }
    }
  } catch {
    // feed degrades gracefully
  }

  const now = new Date().toUTCString();
  const feedItems = items
    .map(
      (a) => `
  <item>
    <title>${escapeXml(a.title)}</title>
    <link>${siteUrl}/blog/${escapeXml(a.slug)}</link>
    <guid isPermaLink="true">${siteUrl}/blog/${escapeXml(a.slug)}</guid>
    <description>${escapeXml(a.excerpt)}</description>
    ${a.publishedAt ? `<pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>` : ""}
    ${a.author ? `<author>${escapeXml(a.author.name)}</author>` : ""}
    ${a.category ? `<category>${escapeXml(a.category.name)}</category>` : ""}
  </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Inkwell — Ideas worth reading slowly</title>
    <link>${siteUrl}/</link>
    <description>Long-form essays and field notes on technology, design, and culture.</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${feedItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=600",
    },
  });
}
