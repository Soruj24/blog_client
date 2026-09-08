"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Check, Link2, Mail, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cx, focusRing } from "@/src/components/ui/shared";

const iconButton = cx(
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition-colors",
  "hover:bg-zinc-100 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
  focusRing,
);

/**
 * Sharing row: native share sheet where supported, copy-link with
 * confirmation, plus mail + network intent links (no SDKs, no brand
 * icon dependencies — lucide dropped brand glyphs).
 */
export function ShareButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [pageUrl, setPageUrl] = useState("");

  // Hydration-safe: server renders without window, client updates after mount
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
    setPageUrl(window.location.href);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (permissions) — user can copy from the bar
    }
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title, url: pageUrl });
    } catch {
      // user dismissed — not an error
    }
  };

  const encoded = () => `url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(title)}`;

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Share this article">
      {canNativeShare && (
        <button type="button" onClick={nativeShare} aria-label="Share…" className={iconButton}>
          <Share2 className="h-4 w-4" aria-hidden />
        </button>
      )}
      <button
        type="button"
        onClick={copyLink}
        aria-label={copied ? "Link copied" : "Copy link"}
        className={iconButton}
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-500" aria-hidden />
        ) : (
          <Link2 className="h-4 w-4" aria-hidden />
        )}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
      <a
        href={`https://twitter.com/intent/tweet?${encoded()}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className={cx(iconButton, "text-sm font-bold")}
      >
        𝕏
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className={cx(iconButton, "text-sm font-bold")}
      >
        f
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className={cx(iconButton, "text-sm font-bold")}
      >
        in
      </a>
      <a
        href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(pageUrl)}`}
        aria-label="Share by email"
        className={iconButton}
      >
        <Mail className="h-4 w-4" aria-hidden />
      </a>
    </div>
  );
}
