import type { Metadata } from "next";
import { ProfileClient } from "@/src/components/account/ProfileClient";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Inkwell profile.",
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
