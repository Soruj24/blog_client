"use client";

import {
  Bell,
  Bookmark,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  User,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar } from "@/src/components/ui/Avatar";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { cx, focusRing } from "@/src/components/ui/shared";
import { useMyStatsQuery } from "@/src/store/api/contentApi";

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6" role="status" aria-label="Loading profile">
      <div className="flex items-center gap-5">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="mt-8 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/** Account overview: identity, key metrics, workspace links, sign-out. */
export function ProfileClient() {
  const { data: session, status } = useSession();
  const authed = status === "authenticated";
  const { data: stats, isLoading, isError, refetch } = useMyStatsQuery(undefined, {
    skip: !authed,
  });

  if (status === "loading") {
    return <ProfileSkeleton />;
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
  const showRole = user.role !== undefined && user.role !== "reader";

  const tiles = stats
    ? [
        { label: "Stories", value: stats.postCount, href: "/dashboard" },
        { label: "Followers", value: stats.followerCount, href: `/author/${stats.username}` },
        { label: "Total reads", value: stats.totalViews, href: "/dashboard" },
        { label: "Saved", value: stats.bookmarksCount, href: "/bookmarks" },
      ]
    : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Identity header */}
      <header className="flex items-start gap-5">
        <Avatar name={displayName} src={user.image} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="headline text-2xl leading-tight break-words text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {displayName}
          </h1>
          {stats?.username && (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">@{stats.username}</p>
          )}
          {user.email && (
            <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {showRole && (
              <Badge tone={user.role === "admin" ? "primary" : "neutral"}>{user.role}</Badge>
            )}
            {stats && (
              <Link
                href={`/author/${stats.username}`}
                className={cx(
                  "inline-flex h-7 items-center rounded-full border border-zinc-200 px-3 text-xs font-medium text-zinc-600 transition-colors outline-none",
                  "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 active:bg-zinc-100",
                  "dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 dark:active:bg-zinc-800",
                  focusRing,
                )}
              >
                View public profile
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Key metrics */}
      <section aria-label="Account statistics" className="mt-8">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="status" aria-label="Loading statistics">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : isError || !stats ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white px-4 py-3.5 dark:border-zinc-800/70 dark:bg-zinc-950">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Couldn&apos;t load your statistics.
            </p>
            <Button variant="secondary" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((tile) => (
              <li key={tile.label}>
                <Link
                  href={tile.href}
                  aria-label={`${tile.label}: ${tile.value}. Go to ${tile.label === "Saved" ? "reading list" : tile.label === "Followers" ? "public profile" : "dashboard"}`}
                  className={cx(
                    "block rounded-2xl border border-zinc-200/70 bg-white p-4 text-center transition-colors outline-none",
                    "hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-lift active:bg-zinc-100",
                    "dark:border-zinc-800/70 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:active:bg-zinc-800",
                    focusRing,
                  )}
                >
                  <span className="headline block text-xl tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatCount(tile.value)}
                  </span>
                  <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                    {tile.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Workspace */}
      <nav aria-label="Workspace" className="mt-8">
        <h2 className="eyebrow text-zinc-500 dark:text-zinc-400">Workspace</h2>
        <ul className="mt-3 grid gap-2">
          <li>
            <Link
              href="/dashboard"
              className={cx(
                "group flex items-center gap-3.5 rounded-2xl border border-zinc-200/70 bg-white px-4 py-3.5 transition-colors outline-none",
                "hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100",
                "dark:border-zinc-800/70 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:active:bg-zinc-800",
                focusRing,
              )}
            >
              <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-zinc-200/70 group-hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-700 dark:group-hover:text-zinc-200">
                <LayoutDashboard className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Dashboard
                </span>
                <span className="block truncate text-[13px] text-zinc-500 dark:text-zinc-400">
                  Manage drafts, stories, and performance
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 transition-transform duration-150 group-hover:translate-x-0.5 dark:text-zinc-600" aria-hidden />
            </Link>
          </li>
          <li>
            <Link
              href="/bookmarks"
              className={cx(
                "group flex items-center gap-3.5 rounded-2xl border border-zinc-200/70 bg-white px-4 py-3.5 transition-colors outline-none",
                "hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100",
                "dark:border-zinc-800/70 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:active:bg-zinc-800",
                focusRing,
              )}
            >
              <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-zinc-200/70 group-hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-700 dark:group-hover:text-zinc-200">
                <Bookmark className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Reading list
                  {stats && stats.bookmarksCount > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-100 px-1.5 text-[11px] font-semibold tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {formatCount(stats.bookmarksCount)}
                    </span>
                  )}
                </span>
                <span className="block truncate text-[13px] text-zinc-500 dark:text-zinc-400">
                  Stories you saved for later
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 transition-transform duration-150 group-hover:translate-x-0.5 dark:text-zinc-600" aria-hidden />
            </Link>
          </li>
          <li>
            <Link
              href="/notifications"
              className={cx(
                "group flex items-center gap-3.5 rounded-2xl border border-zinc-200/70 bg-white px-4 py-3.5 transition-colors outline-none",
                "hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100",
                "dark:border-zinc-800/70 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:active:bg-zinc-800",
                focusRing,
              )}
            >
              <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-zinc-200/70 group-hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-700 dark:group-hover:text-zinc-200">
                <Bell className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Notifications
                  {stats && stats.unreadCount > 0 && (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1.5 text-[11px] font-semibold tabular-nums text-white dark:bg-zinc-50 dark:text-zinc-900">
                      {stats.unreadCount > 99 ? "99+" : stats.unreadCount}
                    </span>
                  )}
                </span>
                <span className="block truncate text-[13px] text-zinc-500 dark:text-zinc-400">
                  Follows, likes, and mentions
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 transition-transform duration-150 group-hover:translate-x-0.5 dark:text-zinc-600" aria-hidden />
            </Link>
          </li>
        </ul>
      </nav>

      {/* Account */}
      <section aria-label="Account actions" className="mt-8 border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className={cx(
            "group flex w-full items-center gap-3.5 rounded-2xl px-4 py-3.5 text-left transition-colors outline-none",
            "text-red-600 hover:bg-red-50 active:bg-red-100",
            "dark:text-red-400 dark:hover:bg-red-950/40 dark:active:bg-red-950/60",
            focusRing,
          )}
        >
          <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-colors group-hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:group-hover:bg-red-950/60">
            <LogOut className="h-4.5 w-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Sign out</span>
            <span className="block truncate text-[13px] text-red-500/70 dark:text-red-400/70">
              End this session on Inkwell
            </span>
          </span>
        </button>
      </section>
    </div>
  );
}
