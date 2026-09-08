import type { Metadata } from "next";
import { MediaManager } from "@/src/components/admin/MediaManager";

export const metadata: Metadata = {
  title: "Media library",
  robots: { index: false, follow: false },
};

export default function AdminMediaPage() {
  return <MediaManager />;
}
