import { redirect } from "next/navigation";

/**
 * Legacy path — canonical article URLs live at /blog/[slug].
 * Keeps one reader, one canonical, no duplicate content.
 */
export default async function LegacyArticleRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/blog/${slug}`);
}
