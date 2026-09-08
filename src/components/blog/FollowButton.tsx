"use client";

import { UserMinus, UserPlus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import {
  useFollowStateQuery,
  useToggleFollowMutation,
} from "@/src/store/api/contentApi";

/**
 * Follow toggle — server-painted initial state, authoritative mutation
 * responses, background freshness. Guests are routed to sign in and
 * returned here via callbackUrl.
 */
export function FollowButton({
  username,
  displayName,
  initialFollowing,
  initialFollowerCount,
}: {
  username: string;
  displayName: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
}) {
  const { status } = useSession();
  const router = useRouter();
  const { data: fresh } = useFollowStateQuery(username, {
    skip: status !== "authenticated",
  });
  const [toggle, { isLoading }] = useToggleFollowMutation();
  const [local, setLocal] = useState<{ following: boolean; count: number } | null>(null);

  const following = local?.following ?? fresh?.following ?? initialFollowing;
  const count = local?.count ?? initialFollowerCount;

  const onClick = async () => {
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/author/${username}`)}`);
      return;
    }
    try {
      const res = await toggle(username).unwrap();
      setLocal({ following: res.following, count: res.followerCount });
    } catch {
      // keep previous state
    }
  };

  return (
    <span className="flex flex-wrap items-center gap-3">
      <Button
        variant={following ? "secondary" : "primary"}
        size="sm"
        loading={isLoading}
        onClick={onClick}
        aria-pressed={following}
        aria-label={following ? `Unfollow ${displayName}` : `Follow ${displayName}`}
      >
        {following ? (
          <UserMinus className="h-4 w-4" aria-hidden />
        ) : (
          <UserPlus className="h-4 w-4" aria-hidden />
        )}
        {following ? "Following" : "Follow"}
      </Button>
      <span className="text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
        <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{count}</strong>{" "}
        {count === 1 ? "follower" : "followers"}
      </span>
    </span>
  );
}
