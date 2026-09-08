"use client";

import { Bookmark, Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useEngagementStateQuery,
  useToggleBookmarkMutation,
  useToggleLikeMutation,
} from "@/src/store/api/contentApi";
import { cx, focusRing } from "@/src/components/ui/shared";

const actionButton = cx(
  "inline-flex h-10 items-center gap-2 rounded-full border border-zinc-200 px-4 text-sm font-medium transition-colors",
  "hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-800 dark:hover:bg-zinc-900",
  focusRing,
);

function loginHref(slug: string): string {
  return `/login?callbackUrl=${encodeURIComponent(`/blog/${slug}`)}`;
}

/**
 * Like toggle — optimistic flip with rollback.
 * The button stays disabled in flight so rapid taps can't reorder
 * toggle pairs server-side (like→unlike must apply in order).
 * Guests are routed to sign in (callbackUrl returns them here).
 */
export function LikeButton({
  slug,
  initialLiked,
  initialCount,
}: {
  slug: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const { status } = useSession();
  const router = useRouter();
  const { data: fresh } = useEngagementStateQuery(slug, {
    skip: status !== "authenticated",
  });
  const [toggle, { isLoading }] = useToggleLikeMutation();
  const [local, setLocal] = useState<{ liked: boolean; count: number } | null>(null);

  const liked = local?.liked ?? fresh?.liked ?? initialLiked;
  const count = local?.count ?? initialCount;

  const onClick = () => {
    if (status !== "authenticated") {
      router.push(loginHref(slug));
      return;
    }
    // Optimistic: flip instantly, reconcile with the authoritative
    // response, roll back to the pre-click snapshot on failure.
    const snapshot = { liked, count };
    setLocal({ liked: !liked, count: Math.max(0, count + (liked ? -1 : 1)) });
    toggle(slug)
      .unwrap()
      .then((res) => setLocal({ liked: res.liked, count: res.likeCount }))
      .catch(() => setLocal(snapshot));
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this article" : "Like this article"}
      className={cx(actionButton, liked && "border-red-200 text-red-600 dark:border-red-900 dark:text-red-400")}
    >
      <Heart className="h-4 w-4" aria-hidden fill={liked ? "currentColor" : "none"} />
      <span aria-live="polite">{count}</span>
    </button>
  );
}

/** Bookmark toggle — optimistic flip with rollback, same ordering rule. */
export function BookmarkButton({
  slug,
  initialBookmarked,
}: {
  slug: string;
  initialBookmarked: boolean;
}) {
  const { status } = useSession();
  const router = useRouter();
  const { data: fresh } = useEngagementStateQuery(slug, {
    skip: status !== "authenticated",
  });
  const [toggle, { isLoading }] = useToggleBookmarkMutation();
  const [local, setLocal] = useState<boolean | null>(null);

  const bookmarked = local ?? fresh?.bookmarked ?? initialBookmarked;

  const onClick = () => {
    if (status !== "authenticated") {
      router.push(loginHref(slug));
      return;
    }
    const snapshot = bookmarked;
    setLocal(!bookmarked);
    toggle(slug)
      .unwrap()
      .then((res) => setLocal(res.bookmarked))
      .catch(() => setLocal(snapshot));
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark this article"}
      className={cx(
        actionButton,
        bookmarked && "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100",
      )}
    >
      <Bookmark className="h-4 w-4" aria-hidden fill={bookmarked ? "currentColor" : "none"} />
      {bookmarked ? "Saved" : "Save"}
    </button>
  );
}
