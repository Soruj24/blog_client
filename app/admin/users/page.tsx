import type { Metadata } from "next";
import { UsersManager } from "@/src/components/admin/UsersManager";

export const metadata: Metadata = {
  title: "Manage users",
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return <UsersManager />;
}
