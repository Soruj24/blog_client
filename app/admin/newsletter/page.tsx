import type { Metadata } from "next";
import { NewsletterManager } from "@/src/components/admin/NewsletterManager";

export const metadata: Metadata = {
  title: "Newsletter subscribers",
  robots: { index: false, follow: false },
};

export default function AdminNewsletterPage() {
  return <NewsletterManager />;
}
