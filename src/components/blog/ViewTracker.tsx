"use client";

import { useEffect } from "react";
import { useTrackViewMutation } from "@/src/store/api/contentApi";

/**
 * Fires exactly one view event per tab-session per article:
 * - Module-level Set survives React StrictMode remounts (no double-fire).
 * - sessionStorage skips recounts across reloads/back-navigation.
 * - Server-side unique {post, viewerHash, day} absorbs anything else.
 * Tracking failures never interrupt reading.
 */
const fired = new Set<string>();
const VIEWER_KEY = "inkwell:viewerId";

function getViewerId(): string {
  let id: string | null = null;
  try {
    id = localStorage.getItem(VIEWER_KEY);
  } catch {
    id = null;
  }
  if (!id) {
    id = crypto.randomUUID();
    try {
      localStorage.setItem(VIEWER_KEY, id);
    } catch {
      // Private mode — the DB unique index still dedupes per day.
    }
  }
  return id;
}

export function ViewTracker({ slug }: { slug: string }) {
  const [track] = useTrackViewMutation();

  useEffect(() => {
    if (fired.has(slug)) return;
    fired.add(slug);
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(`viewed:${slug}`);
    } catch {
      stored = null;
    }
    if (stored) return;
    (async () => {
      try {
        await track({
          slug,
          viewerId: getViewerId(),
          referrer: document.referrer || undefined,
        }).unwrap();
        try {
          sessionStorage.setItem(`viewed:${slug}`, "1");
        } catch {
          // ignore — counted server-side exactly once regardless
        }
      } catch {
        // View tracking is best-effort; never break the article.
      }
    })();
  }, [slug, track]);

  return null;
}
