const KEY = "inkwell:recent-searches";
const MAX = 6;

/** Local-only search history — never leaves the browser. */
export function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s): s is string => typeof s === "string").slice(0, MAX);
  } catch {
    return [];
  }
}

export function saveRecentSearch(term: string): void {
  const clean = term.trim().slice(0, 100);
  if (!clean) return;
  try {
    const next = [clean, ...loadRecentSearches().filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // private mode — history just doesn't persist
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

let snapshotCache: string[] = [];

/**
 * Stable-reference snapshot for useSyncExternalStore. Returns the cached
 * array when contents are unchanged — a fresh array every call would
 * make getSnapshot look perpetually dirty and loop forever.
 */
export function getRecentSnapshot(): string[] {
  const fresh = loadRecentSearches();
  const same =
    fresh.length === snapshotCache.length &&
    fresh.every((term, i) => term === snapshotCache[i]);
  if (!same) snapshotCache = fresh;
  return snapshotCache;
}
