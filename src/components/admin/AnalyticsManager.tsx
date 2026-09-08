"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Input } from "@/src/components/ui/Input";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { cx, focusRing } from "@/src/components/ui/shared";
import { useAnalyticsQuery } from "@/src/store/api/adminApi";
import { ChartCard, TimeSeries } from "./charts";
import { PageHeader, StatCard, StatusBadge, compact } from "./shared";
import { Eye, Users, TrendingUp } from "lucide-react";

type Range = 1 | 7 | 30 | 90 | "custom";

const RANGES: Array<{ label: string; value: 1 | 7 | 30 | 90 }> = [
  { label: "Today", value: 1 },
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading analytics">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
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

/** Full analytics suite: traffic, unique visitors, popular posts, engagement. */
export function AnalyticsManager() {
  const [range, setRange] = useState<Range>(30);
  const [custom, setCustom] = useState({ start: "", end: "" });
  const [appliedCustom, setAppliedCustom] = useState<{ start: string; end: string } | null>(null);

  const queryArg =
    range === "custom" && appliedCustom ? appliedCustom : (range as 1 | 7 | 30 | 90);
  const { data, isLoading, isError, refetch } = useAnalyticsQuery(queryArg as never);

  const subtitle =
    range === "custom" && appliedCustom
      ? `${appliedCustom.start} → ${appliedCustom.end}`
      : `${typeof queryArg === "number" ? `${queryArg}-day` : ""} window`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Page views deduped per viewer per day. All series cached 60s."
      />

      {/* Range selector */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-zinc-200/60 bg-white p-1 dark:border-zinc-800/60 dark:bg-zinc-950">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => {
                setRange(r.value);
                setAppliedCustom(null);
              }}
              aria-pressed={range === r.value}
              className={cx(
                "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all",
                focusRing,
                range === r.value
                  ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              )}
            >
              {r.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setRange("custom")}
            aria-pressed={range === "custom"}
            className={cx(
              "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all",
              focusRing,
              range === "custom"
                ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            Custom
          </button>
        </div>
      </div>

      {range === "custom" && (
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200/60 bg-white p-4 dark:border-zinc-800/60 dark:bg-zinc-950">
          <Input
            label="Start"
            type="date"
            value={custom.start}
            onChange={(e) => setCustom((c) => ({ ...c, start: e.target.value }))}
          />
          <Input
            label="End"
            type="date"
            value={custom.end}
            onChange={(e) => setCustom((c) => ({ ...c, end: e.target.value }))}
          />
          <Button
            size="sm"
            disabled={!custom.start || !custom.end}
            onClick={() => {
              if (custom.start && custom.end) setAppliedCustom({ ...custom });
            }}
            className="h-9"
          >
            Apply
          </Button>
          {appliedCustom && (
            <StatusBadge status="info" label={`${appliedCustom.start} to ${appliedCustom.end}`} dot={false} />
          )}
        </div>
      )}

      {isLoading ? (
        <AnalyticsSkeleton />
      ) : isError || !data ? (
        <ErrorState title="Couldn't load analytics" onRetry={() => void refetch()} />
      ) : data.days.every((_, i) => data.views[i] === 0 && data.posts[i] === 0 && data.users[i] === 0) ? (
        <EmptyState title="No data in this window" description="Try a wider range or check back after more activity." />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Total views"
              value={data.totals.views}
              icon={Eye}
              accent="#18181b"
            />
            <StatCard
              label="Unique visitors"
              value={data.totals.uniqueVisitors}
              icon={Users}
              accent="#0284c7"
            />
            <StatCard
              label="Engagement"
              value={data.totals.likes + data.totals.bookmarks + data.totals.comments}
              icon={TrendingUp}
              accent="#7c3aed"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Views over time" subtitle={subtitle}>
              <TimeSeries
                title={`Views, ${subtitle}`}
                labels={data.days}
                series={[
                  { label: "Views", values: data.views, color: "#18181b" },
                  { label: "Visitors", values: data.uniqueVisitors, color: "#a16207" },
                ]}
              />
            </ChartCard>
            <ChartCard title="Posts published" subtitle={`${data.days.length}-day new stories`}>
              <TimeSeries
                title={`Posts, ${data.days.length} days`}
                labels={data.days}
                series={[{ label: "Posts", values: data.posts, color: "#059669" }]}
              />
            </ChartCard>
            <ChartCard title="User growth" subtitle={`${data.days.length}-day signups`}>
              <TimeSeries
                title={`Users, ${data.days.length} days`}
                labels={data.days}
                series={[{ label: "Users", values: data.users, color: "#0284c7" }]}
              />
            </ChartCard>
            <ChartCard title="Engagement" subtitle={`${data.days.length}-day likes, bookmarks, comments`}>
              <TimeSeries
                title={`Engagement, ${data.days.length} days`}
                labels={data.days}
                series={[
                  { label: "Likes", values: data.engagement.likes, color: "#e11d48" },
                  { label: "Bookmarks", values: data.engagement.bookmarks, color: "#0891b2" },
                  { label: "Comments", values: data.engagement.comments, color: "#7c3aed" },
                ]}
              />
            </ChartCard>
          </div>

          {/* Popular posts */}
          <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 dark:border-zinc-800/60 dark:bg-zinc-950">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Popular posts</h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Top by views in this range
            </p>
            {data.popular.length === 0 ? (
              <p className="mt-6 text-sm text-zinc-400 dark:text-zinc-500">No published posts in this range.</p>
            ) : (
              <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800/70">
                {data.popular.map((p, i) => (
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
                    <span className="flex shrink-0 items-center gap-2 text-xs">
                      <StatusBadge status="neutral" label={`${p.views} views`} dot={false} />
                      <StatusBadge status="info" label={`${p.likes} likes`} dot={false} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
