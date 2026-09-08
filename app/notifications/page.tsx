import type { Metadata } from "next";
import { NotificationsClient } from "@/src/components/account/NotificationsClient";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your Inkwell notifications.",
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}
