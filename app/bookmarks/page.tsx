import type { Metadata } from "next";
import { BookmarksClient } from "@/src/components/account/BookmarksClient";

export const metadata: Metadata = {
  title: "Bookmarks",
  description: "Your saved articles.",
  robots: { index: false, follow: false },
};

export default function BookmarksPage() {
  return <BookmarksClient />;
}
