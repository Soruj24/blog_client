import type { Metadata } from "next";
import { CommentsManager } from "@/src/components/admin/CommentsManager";

export const metadata: Metadata = {
  title: "Moderate comments",
  robots: { index: false, follow: false },
};

export default function AdminCommentsPage() {
  return <CommentsManager />;
}
