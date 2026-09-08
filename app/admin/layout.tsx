import type { Metadata } from "next";
import { AdminShell } from "@/src/components/admin/AdminShell";

/** Admin area shell — presentation only; middleware enforces admin role. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
