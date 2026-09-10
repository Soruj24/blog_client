"use client";

import {
  ArrowRight,
  Bell,
  BookOpen,
  Bookmark,
  Eye,
  LayoutDashboard,
  SquarePen,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { cx, focusRing } from "@/src/components/ui/shared";
import { PostGrid } from "@/src/components/blog/PostGrid";
import {
  useListArticlesQuery,
  useMyStatsQuery,
} from "@/src/store/api/contentApi";

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" role="status" aria-label="Loading dashboard">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-24 rounded-full" />
          <Skeleton className="h-9 w-64 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mt-12 h-7 w-48 rounded-lg" />
      <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[16/9] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/** Author home: live stats, quick actions, latest own stories. */
export function DashboardClient() {
  const { data: session, status } = useSession();
  const authed = status === "authenticated";
  const { data: stats, isLoading, isError, refetch } = useMyStatsQuery(undefined, {
    skip: !authed,
  });
  const { data: recent } = useListArticlesQuery(
    stats ? { author: stats.username, limit: 3 } : { author: "__none__", limit: 3 },
    { skip: !stats },
  );

  if (status === "loading") {
    return <DashboardSkeleton />;
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={<LayoutDashboard className="h-5 w-5" aria-hidden />}
          title="Sign in for your dashboard"
          description="Stats, quick actions, and your latest stories live here."
          action={
            <Link href={`/login?callbackUrl=${encodeURIComponent("/dashboard")}`}>
              <Button size="sm">Sign in</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const cards = stats
    ? [
        { icon: BookOpen, value: stats.postCount, label: "Published", href: `/blog?author=${stats.username}`, hint: "View all stories" },
        { icon: Eye, value: stats.totalViews, label: "Total reads", href: `/author/${stats.username}`, hint: "View public profile" },
        { icon: Users, value: stats.followerCount, label: "Followers", href: `/author/${stats.username}`, hint: "View public profile" },
        { icon: Bookmark, value: stats.bookmarksCount, label: "Saved", href: "/bookmarks", hint: "Open reading list" },
        { icon: Bell, value: stats.unreadCount, label: "Unread", href: "/notifications", hint: "Open notifications", alert: stats.unreadCount > 0 },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <p className="eyebrow text-zinc-500 dark:text-zinc-400">Dashboard</p>
          <h1 className="headline mt-2 text-3xl tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            {stats ? `Welcome back, ${stats.displayName.split(" ")[0]}` : "Welcome back"}
          </h1>
          <p className="mt-2 text-[15px] text-zinc-500 dark:text-zinc-400">
            Track your writing, grow your audience, keep creating.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/write">
            <Button size="sm">
              <SquarePen className="h-4 w-4" aria-hidden />
              Write article
            </Button>
          </Link>
          {stats && (
            <Link href={`/author/${stats.username}`}>
              <Button size="sm" variant="secondary">
                View profile
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
          )}
          {session?.user?.role === "admin" && (
            <Link href="/admin">
              <Button size="sm" variant="secondary">
                Admin
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" role="status" aria-label="Loading statistics">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : isError || !stats ? (
        <div className="mt-8">
          <ErrorState
            title="Couldn't load your stats"
            description="Dashboard data is temporarily unavailable."
            onRetry={() => void refetch()}
          />
        </div>
      ) : (
        <>
          <section aria-label="Overview" className="mt-8">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {cards.map(({ icon: Icon, value, label, href, hint, alert }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={`${label}: ${value}. ${hint}`}
                  className={cx(
                    "group rounded-2xl border border-zinc-200/70 bg-white p-5 transition-colors outline-none",
                    "hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-lift active:bg-zinc-100",
                    "dark:border-zinc-800/70 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:active:bg-zinc-800",
                    focusRing,
                  )}
                >
                  <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-zinc-200/70 group-hover:text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:group-hover:bg-zinc-700 dark:group-hover:text-zinc-200">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    {label}
                    {alert === true && (
                      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                    )}
                  </dt>
                  <dd className="headline mt-3 text-2xl tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatCount(value)}
                  </dd>
                </Link>
              ))}
            </dl>
          </section>

          {/* Latest stories */}
          <section aria-labelledby="dashboard-stories" className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow text-zinc-500 dark:text-zinc-400">Recent</p>
                <h2 id="dashboard-stories" className="headline mt-1.5 text-xl text-zinc-900 dark:text-zinc-100 sm:text-2xl">
                  Your latest stories
                </h2>
              </div>
              {recent && recent.items.length > 0 && (
                <Link
                  href={`/blog?author=${stats.username}`}
                  className={cx(
                    "inline-flex h-10 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors outline-none",
                    "hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100",
                    "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:active:bg-zinc-800",
                    focusRing,
                  )}
                >
                  View all
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </div>
            {!recent || recent.items.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                <EmptyState
                  icon={<BookOpen className="h-5 w-5" aria-hidden />}
                  title="Nothing published yet"
                  description="Your stories will show up here once you hit publish."
                  action={
                    <Link href="/write">
                      <Button size="sm">Write your first story</Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="mt-5">
                <PostGrid articles={recent.items} />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
