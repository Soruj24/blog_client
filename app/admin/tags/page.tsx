import type { Metadata } from "next";
import { AdminTags } from "@/src/components/admin/AdminTags";

export const metadata: Metadata = {
  title: "Manage tags",
  description: "Create, rename, and prune Inkwell tags.",
  robots: { index: false, follow: false },
};

export default function AdminTagsPage() {
  return <AdminTags />;
}
