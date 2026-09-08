import type { Metadata } from "next";
import { SettingsManager } from "@/src/components/admin/SettingsManager";

export const metadata: Metadata = {
  title: "Site settings",
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return <SettingsManager />;
}
