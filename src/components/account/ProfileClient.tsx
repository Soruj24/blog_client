"use client";

import { ArrowRight, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar } from "@/src/components/ui/Avatar";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { SkeletonText } from "@/src/components/ui/Skeleton";
import { useMyStatsQuery } from "@/src/store/api/contentApi";

/** Account overview: identity, role, quick links to everything owned. */
export function ProfileClient() {
  const { data: session, status } = useSession();
  const authed = status === "authenticated";
  const { data: stats, isLoading, isError, refetch } = useMyStatsQuery(undefined, {
    skip: !authed,
  });

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6" aria-label="Loading profile">
        <SkeletonText lines={4} />
      </div>
    );
  }

  if (!authed || !session?.user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={<User className="h-5 w-5" aria-hidden />}
          title="You're not signed in"
          description="Sign in to view and manage your profile."
          action={
            <Link href={`/login?callbackUrl=${encodeURIComponent("/profile")}`}>
              <Button size="sm">Sign in</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const user = session.user;
  const displayName = user.name ?? stats?.displayName ?? user.username ?? user.email ?? "Account";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Profile header */}
      <div className="flex items-center gap-5">
        <Avatar name={displayName} src={user.image} size="xl" />
        <div className="min-w-0">
          <h1 className="headline truncate text-2xl text-zinc-900 dark:text-zinc-100 sm:text-3xl">{displayName}</h1>
          {stats?.username && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">@{stats.username}</p>
          )}
          {user.email && (
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
          )}
          <div className="mt-2">
            <Badge tone={user.role === "admin" ? "primary" : "neutral"}>
              {user.role ?? "reader"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="mt-6" aria-label="Loading stats">
          <SkeletonText lines={2} />
        </div>
      ) : isError || !stats ? (
        <div className="mt-6">
          <ErrorState
            title="Couldn't load account details"
            onRetry={() => void refetch()}
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-200/70 bg-white p-4 text-center dark:border-zinc-800/70 dark:bg-zinc-950">
            <p className="headline text-xl text-zinc-900 dark:text-zinc-100">{stats.postCount}</p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">stories</p>
          </div>
          <div className="rounded-xl border border-zinc-200/70 bg-white p-4 text-center dark:border-zinc-800/70 dark:bg-zinc-950">
            <p className="headline text-xl text-zinc-900 dark:text-zinc-100">{stats.followerCount}</p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">followers</p>
          </div>
          <div className="rounded-xl border border-zinc-200/70 bg-white p-4 text-center dark:border-zinc-800/70 dark:bg-zinc-950">
            <p className="headline text-xl text-zinc-900 dark:text-zinc-100">{stats.bookmarksCount}</p>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">bookmarked</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav aria-label="Account" className="mt-6 grid gap-2">
        {stats && (
          <Link
            href={`/author/${stats.username}`}
            className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-white px-4 py-3 text-sm font-medium transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
          >
            View public profile
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
        <Link
          href="/dashboard"
          className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-white px-4 py-3 text-sm font-medium transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Go to dashboard
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          href="/bookmarks"
          className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-white px-4 py-3 text-sm font-medium transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm dark:border-zinc-800/70 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Reading list
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-white px-4 py-3 text-left text-sm font-medium text-red-600 transition-all duration-200 hover:border-red-200 hover:bg-red-50 dark:border-zinc-800/70 dark:bg-zinc-950 dark:text-red-400 dark:hover:border-red-900 dark:hover:bg-red-950/40"
        >
          Sign out
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </nav>
    </div>
  );
}
