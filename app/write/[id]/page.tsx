import type { Metadata } from "next";
import { BlogEditor } from "@/src/components/editor/BlogEditor";

export const metadata: Metadata = {
  title: "Edit Post",
  robots: { index: false, follow: false },
};

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BlogEditor postId={id} />;
}
