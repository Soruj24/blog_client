import type { Metadata } from "next";
import { DashboardHome } from "@/src/components/admin/DashboardHome";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Platform overview, statistics, and moderation alerts.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <DashboardHome />;
}
