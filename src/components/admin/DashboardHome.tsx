"use client";

import Link from "next/link";
import {
  Bookmark,
  ChevronRight,
  Eye,
  FileText,
  Heart,
  MessagesSquare,
  Newspaper,
  Pencil,
  ShieldAlert,
  Users,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { cx, focusRing } from "@/src/components/ui/shared";
import { useAdminStatsQuery, useAnalyticsQuery } from "@/src/store/api/adminApi";
import { Bars, ChartCard, Donut, TimeSeries } from "./charts";
import { PageHeader, PopularPosts, StatCard } from "./shared";

const CONTENT_CARDS = [
  { key: "posts", label: "Total Posts", icon: FileText, href: "/admin/posts", hint: "Manage posts" },
  { key: "published", label: "Published", icon: Newspaper, href: "/admin/posts", hint: "Manage posts" },
  { key: "draft", label: "Drafts", icon: Pencil, href: "/admin/posts", hint: "Manage posts" },
  { key: "views", label: "Total Views", icon: Eye, href: "/admin/analytics", hint: "Open analytics" },
] as const;

const PEOPLE_CARDS = [
  { key: "users", label: "Users", icon: Users, href: "/admin/users", hint: "Manage users" },
  { key: "comments", label: "Comments", icon: MessagesSquare, href: "/admin/comments", hint: "Moderate comments" },
  { key: "likes", label: "Likes", icon: Heart, href: "/admin/analytics", hint: "Open analytics" },
  { key: "bookmarks", label: "Bookmarks", icon: Bookmark, href: "/admin/analytics", hint: "Open analytics" },
] as const;

type CardKey = "posts" | "published" | "draft" | "views" | "users" | "comments" | "likes" | "bookmarks";

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/** Platform overview: eight stat cards, four charts, moderation alert. */
export function DashboardHome() {
  const stats = useAdminStatsQuery();
  const analytics = useAnalyticsQuery(30);

  if (stats.isLoading) return <DashboardSkeleton />;

  if (stats.isError || !stats.data) {
    return (
      <ErrorState
        title="Couldn't load dashboard"
        description="Platform statistics are temporarily unavailable."
        onRetry={() => void stats.refetch()}
      />
    );
  }

  const s = stats.data;
  const values: Record<CardKey, number> = {
    posts: s.posts.total,
    published: s.posts.published,
    draft: s.posts.draft,
    users: s.users.total,
    comments: s.comments.total,
    views: s.views,
    likes: s.likes,
    bookmarks: s.bookmarks,
  };

  const a = analytics.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Platform health at a glance."
      />

      {/* Moderation alert */}
      {s.comments.pending > 0 && (
        <Link
          href="/admin/comments?status=pending"
          className={cx(
            "group flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 transition-colors outline-none",
            "hover:border-amber-300 hover:bg-amber-50 active:bg-amber-100/60",
            "dark:border-amber-900 dark:bg-amber-950/40 dark:hover:border-amber-800 dark:active:bg-amber-950/60",
            focusRing,
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/60">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              <strong className="font-semibold tabular-nums">{s.comments.pending}</strong>{" "}
              {s.comments.pending === 1 ? "comment" : "comments"} awaiting moderation
            </p>
            <p className="mt-0.5 text-xs text-amber-600/80 dark:text-amber-400/80">
              Review the moderation queue
            </p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-amber-500 transition-transform duration-150 group-hover:translate-x-0.5 dark:text-amber-400" aria-hidden />
        </Link>
      )}

      {/* Stat cards — linked to their manager pages */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Content
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CONTENT_CARDS.map(({ key, label, icon, href, hint }) => (
            <StatCard key={key} label={label} value={values[key]} icon={icon} href={href} hint={hint} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          People & Engagement
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PEOPLE_CARDS.map(({ key, label, icon, href, hint }) => (
            <StatCard key={key} label={label} value={values[key]} icon={icon} href={href} hint={hint} />
          ))}
        </div>
      </div>

      {/* Charts */}
      {analytics.isError || !a ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/60 bg-white px-5 py-4 dark:border-zinc-800/60 dark:bg-zinc-950">
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Charts unavailable</p>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Analytics series could not be loaded.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void analytics.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Trends
            </h2>
            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Views over time" subtitle="Daily article reads, last 30 days">
                <TimeSeries
                  title="Daily views, last 30 days"
                  labels={a.days}
                  series={[
                    { label: "Views", values: a.views, color: "#18181b" },
                    { label: "Visitors", values: (a as unknown as { uniqueVisitors: number[] }).uniqueVisitors ?? [], color: "#a1a1aa" },
                  ]}
                />
              </ChartCard>
              <ChartCard title="Posts published" subtitle="New stories per day, last 30 days">
                <Bars title="Posts published per day" labels={a.days} values={a.posts} color="#18181b" />
              </ChartCard>
            </div>
          </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="User growth" subtitle="Signups per day, last 30 days">
                <TimeSeries
                  title="User signups per day"
                  labels={a.days}
                  series={[{ label: "Users", values: a.users, color: "#18181b" }]}
                />
              </ChartCard>
              <ChartCard title="Engagement" subtitle="Likes, bookmarks, and comments">
                <Donut
                  title="Engagement totals"
                  total={s.likes + s.bookmarks + s.comments.total}
                  segments={[
                    { label: "Likes", value: s.likes, color: "#18181b" },
                    { label: "Bookmarks", value: s.bookmarks, color: "#71717a" },
                    { label: "Comments", value: s.comments.total, color: "#d4d4d8" },
                  ]}
                />
              </ChartCard>
            </div>

          {/* Popular posts */}
          {(a as unknown as { popular?: Array<{ _id: string; title: string; slug: string; views: number }> }).popular &&
            (a as unknown as { popular: Array<{ _id: string; title: string; slug: string; views: number }> }).popular.length > 0 && (
              <PopularPosts
                subtitle="Top by views in the last 30 days"
                items={
                  (a as unknown as { popular: Array<{ _id: string; title: string; slug: string; views: number; likes: number }> }).popular
                }
              />
            )}
        </div>
      )}
    </div>
  );
}
