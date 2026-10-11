"use client";

import { useEffect } from "react";
import { recordReading } from "@/src/lib/reading-history";

/**
 * Appends the current article to the device-local reading history.
 * Mounted alongside ViewTracker on /blog/[slug]; recording is
 * idempotent per mount and failure-safe (see reading-history lib).
 */
export function ReadingHistoryTracker({
  slug,
  title,
  categoryName,
  readingTime,
}: {
  slug: string;
  title: string;
  categoryName: string | null;
  readingTime: number;
}) {
  useEffect(() => {
    recordReading({ slug, title, categoryName, readingTime });
  }, [slug, title, categoryName, readingTime]);

  return null;
}
