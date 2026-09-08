import type { Metadata } from "next";
import { AdminCategories } from "@/src/components/admin/AdminCategories";

export const metadata: Metadata = {
  title: "Manage categories",
  description: "Create, rename, and organize Inkwell categories.",
  robots: { index: false, follow: false },
};

export default function AdminCategoriesPage() {
  return <AdminCategories />;
}
