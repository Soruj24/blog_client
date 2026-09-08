import type { Metadata } from "next";
import { Flame } from "lucide-react";
import { SectionPlaceholder } from "@/src/components/layout/SectionPlaceholder";

export const metadata: Metadata = {
  title: "Trending",
  description: "What the Inkwell community is reading right now.",
  robots: { index: false, follow: true },
};

export default function TrendingPage() {
  return (
    <SectionPlaceholder
      icon={Flame}
      title="Trending is on its way"
      description="Real-time most-read and most-loved rankings land with the Analytics phase."
    />
  );
}
