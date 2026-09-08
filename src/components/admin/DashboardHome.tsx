"use client";

import Link from "next/link";
import {
  Bookmark,
  Eye,
  FileText,
  Heart,
  MessagesSquare,
  Newspaper,
  Pencil,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { useAdminStatsQuery, useAnalyticsQuery } from "@/src/store/api/adminApi";
import { Bars, ChartCard, Donut, TimeSeries } from "./charts";
import { PageHeader, StatCard, StatusBadge, compact } from "./shared";

const CARDS = [
  { key: "posts", label: "Total Posts", icon: FileText, accent: "#71717a" },
  { key: "published", label: "Published", icon: Newspaper, accent: "#059669" },
  { key: "draft", label: "Drafts", icon: Pencil, accent: "#d97706" },
  { key: "users", label: "Users", icon: Users, accent: "#0284c7" },
  { key: "comments", label: "Comments", icon: MessagesSquare, accent: "#7c3aed" },
  { key: "views", label: "Views", icon: Eye, accent: "#18181b" },
  { key: "likes", label: "Likes", icon: Heart, accent: "#e11d48" },
  { key: "bookmarks", label: "Bookmarks", icon: Bookmark, accent: "#0891b2" },
] as const;

type CardKey = (typeof CARDS)[number]["key"];

function DashboardSkeleton() {
  return (
    <div aria-label="Loading dashboard" className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 !rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 !rounded-2xl" />
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
          className="group flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 transition-all hover:border-amber-300 hover:shadow-md hover:shadow-amber-900/5 dark:border-amber-900 dark:bg-amber-950/40 dark:hover:border-amber-800"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/60">
            <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              <strong>{s.comments.pending}</strong> {s.comments.pending === 1 ? "comment" : "comments"} awaiting moderation
            </p>
            <p className="mt-0.5 text-xs text-amber-600/80 dark:text-amber-400/80">
              Review the moderation queue
            </p>
          </div>
          <StatusBadge status="warning" label={`${s.comments.pending} pending`} />
        </Link>
      )}

      {/* Stat cards — grouped into Content, People, Engagement */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Content
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CARDS.slice(0, 3).map(({ key, label, icon, accent }) => (
            <StatCard key={key} label={label} value={values[key]} icon={icon} accent={accent} />
          ))}
          <StatCard label="Total Views" value={values.views} icon={Eye} accent="#18181b" />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          People & Engagement
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CARDS.slice(4).map(({ key, label, icon, accent }) => (
            <StatCard key={key} label={label} value={values[key]} icon={icon} accent={accent} />
          ))}
        </div>
      </div>

      {/* Charts */}
      {analytics.isError || !a ? (
        <EmptyState title="Charts unavailable" description="Analytics series could not be loaded." />
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
                    { label: "Visitors", values: (a as unknown as { uniqueVisitors: number[] }).uniqueVisitors ?? [], color: "#a16207" },
                  ]}
                />
              </ChartCard>
              <ChartCard title="Posts published" subtitle="New stories per day, last 30 days">
                <Bars title="Posts published per day" labels={a.days} values={a.posts} color="#059669" />
              </ChartCard>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="User growth" subtitle="Signups per day, last 30 days">
              <TimeSeries
                title="User signups per day"
                labels={a.days}
                series={[{ label: "Users", values: a.users, color: "#0284c7" }]}
              />
            </ChartCard>
            <ChartCard title="Engagement" subtitle="Likes, bookmarks, and comments">
              <Donut
                title="Engagement totals"
                total={s.likes + s.bookmarks + s.comments.total}
                segments={[
                  { label: "Likes", value: s.likes, color: "#e11d48" },
                  { label: "Bookmarks", value: s.bookmarks, color: "#0891b2" },
                  { label: "Comments", value: s.comments.total, color: "#7c3aed" },
                ]}
              />
            </ChartCard>
          </div>

          {/* Popular posts */}
          {(a as unknown as { popular?: Array<{ _id: string; title: string; slug: string; views: number }> }).popular &&
            (a as unknown as { popular: Array<{ _id: string; title: string; slug: string; views: number }> }).popular.length > 0 && (
              <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 dark:border-zinc-800/60 dark:bg-zinc-950">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    <TrendingUp className="h-4 w-4 text-zinc-600 dark:text-zinc-400" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Popular posts
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Top by views in the last 30 days
                    </p>
                  </div>
                </div>
                <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800/70">
                  {(a as unknown as { popular: Array<{ _id: string; title: string; slug: string; views: number; likes: number }> }).popular
                    .slice(0, 5)
                    .map((p, i) => (
                      <li key={p._id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 font-mono text-xs font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                          {i + 1}
                        </span>
                        <Link
                          href={`/blog/${p.slug}`}
                          className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900 transition-colors hover:text-violet-600 dark:text-zinc-100 dark:hover:text-violet-400"
                        >
                          {p.title}
                        </Link>
                        <span className="shrink-0 text-xs font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
                          {compact(p.views)} views
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
