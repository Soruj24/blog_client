import type { Metadata } from "next";
import { BlogEditor } from "@/src/components/editor/BlogEditor";

export const metadata: Metadata = {
  title: "Write — New Post",
  description: "Create a new article on Inkwell.",
  robots: { index: false, follow: false },
};

export default function WritePage() {
  return <BlogEditor />;
}
