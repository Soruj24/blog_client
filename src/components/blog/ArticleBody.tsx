/**
 * Article body — Markdown source rendered as plain text blocks.
 * React escapes children by default, so stored content can never
 * inject markup. Rich rendering (headings, code, embeds) is a
 * follow-up phase; this keeps the reader safe and fast today.
 */
export function ArticleBody({ content }: { content: string }) {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="prose-editorial mt-8 space-y-5">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
