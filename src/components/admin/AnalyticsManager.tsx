"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Input } from "@/src/components/ui/Input";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { cx, focusRing } from "@/src/components/ui/shared";
import { useAnalyticsQuery } from "@/src/store/api/adminApi";
import { ChartCard, TimeSeries } from "./charts";
import { PageHeader, PopularPosts, StatCard } from "./shared";
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
    <div className="space-y-6" role="status" aria-label="Loading analytics">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
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

/** Full analytics suite: traffic, unique visitors, popular posts, engagement. */
export function AnalyticsManager() {
  const [range, setRange] = useState<Range>(30);
  const [custom, setCustom] = useState({ start: "", end: "" });
  const [appliedCustom, setAppliedCustom] = useState<{ start: string; end: string } | null>(null);

  const queryArg =
    range === "custom" && appliedCustom ? appliedCustom : (range as 1 | 7 | 30 | 90);
  const { data, isLoading, isError, refetch } = useAnalyticsQuery(queryArg as never);

  const customInvalid =
    range === "custom" && custom.start !== "" && custom.end !== "" && custom.end < custom.start;

  const subtitle =
    range === "custom" && appliedCustom
      ? `${appliedCustom.start} → ${appliedCustom.end}`
      : `${typeof queryArg === "number" ? `${queryArg}-day` : ""} window`;

  const selectRange = (value: Range) => {
    setRange(value);
    setAppliedCustom(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Page views deduped per viewer per day. All series cached 60s."
      />

      {/* Range selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Date range"
          className="inline-flex max-w-full flex-wrap gap-1 rounded-xl border border-zinc-200/60 bg-white p-1 dark:border-zinc-800/60 dark:bg-zinc-950"
        >
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => selectRange(r.value)}
              aria-pressed={range === r.value}
              className={cx(
                "min-h-9 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors outline-none",
                focusRing,
                range === r.value
                  ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700",
              )}
            >
              {r.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => selectRange("custom")}
            aria-pressed={range === "custom"}
            className={cx(
              "min-h-9 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors outline-none",
              focusRing,
              range === "custom"
                ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700",
            )}
          >
            Custom
          </button>
        </div>
        {range === "custom" && appliedCustom && !customInvalid && (
          <p className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400" aria-live="polite">
            {appliedCustom.start} → {appliedCustom.end}
          </p>
        )}
      </div>

      {range === "custom" && (
        <div className="rounded-2xl border border-zinc-200/60 bg-white p-4 dark:border-zinc-800/60 dark:bg-zinc-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Start date"
                type="date"
                value={custom.start}
                max={custom.end || undefined}
                onChange={(e) => setCustom((c) => ({ ...c, start: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <Input
                label="End date"
                type="date"
                value={custom.end}
                min={custom.start || undefined}
                onChange={(e) => setCustom((c) => ({ ...c, end: e.target.value }))}
              />
            </div>
            <Button
              size="sm"
              disabled={!custom.start || !custom.end || custom.end < custom.start}
              onClick={() => {
                if (custom.start && custom.end && custom.end >= custom.start) {
                  setAppliedCustom({ ...custom });
                }
              }}
              className="h-11 shrink-0 sm:w-auto"
            >
              Apply range
            </Button>
          </div>
          {customInvalid && (
            <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
              End date must be on or after the start date.
            </p>
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
            />
            <StatCard
              label="Unique visitors"
              value={data.totals.uniqueVisitors}
              icon={Users}
            />
            <StatCard
              label="Engagement"
              value={data.totals.likes + data.totals.bookmarks + data.totals.comments}
              icon={TrendingUp}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard title="Views over time" subtitle={subtitle}>
              <TimeSeries
                title={`Views, ${subtitle}`}
                labels={data.days}
                series={[
                  { label: "Views", values: data.views, color: "#18181b" },
                  { label: "Visitors", values: data.uniqueVisitors, color: "#a1a1aa" },
                ]}
              />
            </ChartCard>
            <ChartCard title="Posts published" subtitle={`${data.days.length}-day new stories`}>
              <TimeSeries
                title={`Posts, ${data.days.length} days`}
                labels={data.days}
                series={[{ label: "Posts", values: data.posts, color: "#18181b" }]}
              />
            </ChartCard>
            <ChartCard title="User growth" subtitle={`${data.days.length}-day signups`}>
              <TimeSeries
                title={`Users, ${data.days.length} days`}
                labels={data.days}
                series={[{ label: "Users", values: data.users, color: "#18181b" }]}
              />
            </ChartCard>
            <ChartCard title="Engagement" subtitle={`${data.days.length}-day likes, bookmarks, comments`}>
              <TimeSeries
                title={`Engagement, ${data.days.length} days`}
                labels={data.days}
                series={[
                  { label: "Likes", values: data.engagement.likes, color: "#18181b" },
                  { label: "Bookmarks", values: data.engagement.bookmarks, color: "#71717a" },
                  { label: "Comments", values: data.engagement.comments, color: "#d4d4d8" },
                ]}
              />
            </ChartCard>
          </div>

          {/* Popular posts */}
          <PopularPosts
            subtitle={`Top by views in this range`}
            items={data.popular}
          />
        </>
      )}
    </div>
  );
}
