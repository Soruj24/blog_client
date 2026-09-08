import type { Metadata } from "next";
import { DashboardClient } from "@/src/components/account/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Inkwell dashboard.",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
