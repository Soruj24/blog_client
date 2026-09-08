import type { Metadata } from "next";
import { AnalyticsManager } from "@/src/components/admin/AnalyticsManager";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export default function AdminAnalyticsPage() {
  return <AnalyticsManager />;
}
