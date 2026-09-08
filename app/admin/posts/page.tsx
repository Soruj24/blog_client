import type { Metadata } from "next";
import { PostsManager } from "@/src/components/admin/PostsManager";

export const metadata: Metadata = {
  title: "Manage posts",
  robots: { index: false, follow: false },
};

export default function AdminPostsPage() {
  return <PostsManager />;
}
