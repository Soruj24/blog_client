/**
 * Device-local reading history. Companion to server-side view tracking
 * (ViewTracker → POST /articles/:slug/views): the server counts
 * engagement, this module remembers *what* was read so the homepage can
 * offer "Recently viewed" without an account, a fetch, or any new API.
 *
 * Entries are snapshots (title/category/readingTime) with a 30-day
 * expiry, capped at 12. Everything is try/caught — private mode and SSR
 * (no window) degrade to "no history", never to an error.
 */

export interface ReadingHistoryEntry {
  slug: string;
  title: string;
  categoryName: string | null;
  readingTime: number;
  viewedAt: string;
}

const STORAGE_KEY = "inkwell:reading-history";
const MAX_ENTRIES = 12;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function readRaw(): ReadingHistoryEntry[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter(
      (e): e is ReadingHistoryEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as ReadingHistoryEntry).slug === "string" &&
        typeof (e as ReadingHistoryEntry).title === "string" &&
        typeof (e as ReadingHistoryEntry).viewedAt === "string" &&
        now - new Date((e as ReadingHistoryEntry).viewedAt).getTime() <=
          MAX_AGE_MS,
    );
  } catch {
    return [];
  }
}

export function getReadingHistory(): ReadingHistoryEntry[] {
  return readRaw().slice(0, 6);
}

let snapshotCache: ReadingHistoryEntry[] = [];

/**
 * Stable-reference snapshot for useSyncExternalStore (same pattern as
 * recent-searches). A fresh array every call would look perpetually
 * dirty and loop forever.
 */
export function getReadingHistorySnapshot(): ReadingHistoryEntry[] {
  const fresh = getReadingHistory();
  const same =
    fresh.length === snapshotCache.length &&
    fresh.every(
      (e, i) =>
        e.slug === snapshotCache[i]?.slug &&
        e.viewedAt === snapshotCache[i]?.viewedAt,
    );
  if (!same) snapshotCache = fresh;
  return snapshotCache;
}

const emptySnapshot: ReadingHistoryEntry[] = [];

/**
 * Server snapshot for useSyncExternalStore. Must return the same
 * reference on every call — a fresh [] per call looks perpetually
 * dirty and triggers an infinite loop.
 */
export function getServerHistorySnapshot(): ReadingHistoryEntry[] {
  return emptySnapshot;
}

export function subscribeToReadingHistory(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function recordReading(entry: Omit<ReadingHistoryEntry, "viewedAt">): void {
  try {
    if (typeof window === "undefined") return;
    const next: ReadingHistoryEntry[] = [
      { ...entry, viewedAt: new Date().toISOString() },
      ...readRaw().filter((e) => e.slug !== entry.slug),
    ].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // History is a convenience — never break reading.
  }
}
