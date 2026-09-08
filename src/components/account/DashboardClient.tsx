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
import { SkeletonText } from "@/src/components/ui/Skeleton";
import { PostGrid } from "@/src/components/blog/PostGrid";
import {
  useListArticlesQuery,
  useMyStatsQuery,
} from "@/src/store/api/contentApi";

function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
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
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-label="Loading dashboard">
        <SkeletonText lines={2} />
      </div>
    );
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
        { icon: BookOpen, value: formatCount(stats.postCount), label: "Published", color: "text-blue-600 dark:text-blue-400" },
        { icon: Eye, value: formatCount(stats.totalViews), label: "Total reads", color: "text-violet-600 dark:text-violet-400" },
        { icon: Users, value: formatCount(stats.followerCount), label: "Followers", color: "text-emerald-600 dark:text-emerald-400" },
        { icon: Bookmark, value: formatCount(stats.bookmarksCount), label: "Bookmarked", color: "text-amber-600 dark:text-amber-400" },
        { icon: Bell, value: formatCount(stats.unreadCount), label: "Unread", color: "text-rose-600 dark:text-rose-400" },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-zinc-400 dark:text-zinc-500">Dashboard</p>
          <h1 className="headline mt-2 text-3xl tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            {stats ? `Welcome back, ${stats.displayName.split(" ")[0]}` : "Welcome back"}
          </h1>
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
        <div className="mt-8" aria-label="Loading stats">
          <SkeletonText lines={3} />
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
          <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {cards.map(({ icon: Icon, value, label, color }) => (
              <div
                key={label}
                className="rounded-2xl border border-zinc-200/70 bg-white p-5 transition-all duration-200 hover:shadow-soft dark:border-zinc-800/70 dark:bg-zinc-950"
              >
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  <Icon className={`h-3.5 w-3.5 ${color}`} aria-hidden />
                  {label}
                </dt>
                <dd className="headline mt-2 text-2xl text-zinc-900 dark:text-zinc-100">{value}</dd>
              </div>
            ))}
          </dl>

          {/* Latest stories */}
          <div className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <h2 className="headline text-xl text-zinc-900 dark:text-zinc-100 sm:text-2xl">
                Your latest stories
              </h2>
              {recent && recent.items.length > 0 && (
                <Link
                  href={`/blog?author=${stats.username}`}
                  className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  View all
                </Link>
              )}
            </div>
            {!recent || recent.items.length === 0 ? (
              <div className="mt-4">
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
          </div>
        </>
      )}
    </div>
  );
}
