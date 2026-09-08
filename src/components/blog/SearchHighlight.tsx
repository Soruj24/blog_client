function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Wraps query matches in <mark>. Server-safe pure function — safe for
 * server-rendered result lists. Terms under 2 chars are ignored to
 * avoid noise highlighting ("a", "to", …).
 */
export function SearchHighlight({ text, query }: { text: string; query: string }) {
  const terms = query
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .map(escapeRegExp);
  if (terms.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${terms.join("|")})`, "gi");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            className="rounded-sm bg-amber-100 px-px text-amber-900 dark:bg-amber-900/30 dark:text-amber-200"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
