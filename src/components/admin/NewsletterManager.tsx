"use client";

import { useState } from "react";
import { Ban, CheckCircle, Download, Mail, Search, Trash } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Input } from "@/src/components/ui/Input";
import { Pagination } from "@/src/components/ui/Pagination";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { useToast } from "@/src/components/ui/Toast";
import {
  useAdminNewsletterQuery,
  useDeleteSubscriberMutation,
  useUpdateSubscriberMutation,
} from "@/src/store/api/adminApi";
import { ConfirmDialog, FilterBar, PageHeader, StatusBadge, formatDate } from "./shared";
import { cx, focusRing } from "@/src/components/ui/shared";

const STATUS_MAP: Record<string, string> = {
  active: "success",
  pending: "warning",
  unsubscribed: "neutral",
  bounced: "danger",
};

function toCsv(rows: Array<{ email: string; status: string; name?: string | null; createdAt?: string }>): string {
  const header = "email,name,status,createdAt";
  return [header, ...rows.map((r) => `"${r.email}","${r.name ?? ""}",${r.status},${(r as { createdAt?: string }).createdAt ?? ""}`)].join("\n");
}

function NewsletterSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading subscribers">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-2xl" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}

const STATUS_ORDER = ["active", "pending", "unsubscribed", "bounced"];

/** Newsletter subscribers: status filters, search, deactivate/activate, delete, CSV export. */
export function NewsletterManager() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useAdminNewsletterQuery({
    page,
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
  });
  const [remove, { isLoading: removing }] = useDeleteSubscriberMutation();
  const [updateStatus, { isLoading: updating }] = useUpdateSubscriberMutation();
  const { toast } = useToast();

  const exportCsv = () => {
    if (!data || data.items.length === 0) return;
    const url = URL.createObjectURL(
      new Blob([toCsv(data.items as never)], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-page-${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeactivate = async (id: string, current: string) => {
    const next = current === "active" ? "unsubscribed" : "active";
    try {
      await updateStatus({ id, status: next }).unwrap();
    } catch {
      toast("Couldn't update subscriber — please try again.", { tone: "error" });
    }
  };

  const clearFilters = () => {
    setDraft("");
    setSearch("");
    setStatus("");
    setPage(1);
  };

  const hasFilters = search !== "" || status !== "";
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const statusChips = data
    ? STATUS_ORDER.filter((s) => data.counts[s] !== undefined).map((s) => ({
        value: s,
        count: data.counts[s] ?? 0,
      }))
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Newsletter"
        description={
          data
            ? `${data.total} ${data.total === 1 ? "subscriber" : "subscribers"} on the list.`
            : "Subscriber list."
        }
        actions={
          data && data.items.length > 0 ? (
            <Button size="sm" variant="secondary" onClick={exportCsv}>
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </Button>
          ) : undefined
        }
      />

      {/* Status filter chips — counts are server-aggregated */}
      {data && statusChips.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          <button
            type="button"
            aria-pressed={status === ""}
            onClick={() => { setStatus(""); setPage(1); }}
            className={cx(
              "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium tabular-nums transition-colors outline-none",
              focusRing,
              status === ""
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:active:bg-zinc-800",
            )}
          >
            All
            <span className={cx("text-xs", status === "" ? "text-white/70 dark:text-zinc-900/70" : "text-zinc-400")}>
              {data.total}
            </span>
          </button>
          {statusChips.map(({ value, count }) => {
            const isActive = status === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                onClick={() => { setStatus(isActive ? "" : value); setPage(1); }}
                className={cx(
                  "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium capitalize tabular-nums transition-colors outline-none",
                  focusRing,
                  isActive
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:active:bg-zinc-800",
                )}
              >
                {value}
                <span className={cx("text-xs", isActive ? "text-white/70 dark:text-zinc-900/70" : "text-zinc-400")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <FilterBar>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(draft.trim());
          }}
          role="search"
          aria-label="Search subscribers"
          className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            />
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search by email or name…"
              aria-label="Search subscribers"
              className="h-9 pl-9"
            />
          </div>
          <div className="flex gap-2.5">
            <Button type="submit" variant="secondary" size="sm" className="h-9 flex-1 sm:flex-none">
              Search
            </Button>
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 flex-1 sm:flex-none"
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
          </div>
        </form>
      </FilterBar>

      {data && (
        <p aria-live="polite" className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
          {data.total === 0
            ? "No subscribers"
            : `Showing ${data.items.length} of ${data.total} ${data.total === 1 ? "subscriber" : "subscribers"}`}
          {status && data.total > 0 && (
            <span> · <span className="capitalize">{status}</span></span>
          )}
        </p>
      )}

      {isLoading ? (
        <NewsletterSkeleton />
      ) : isError || !data ? (
        <ErrorState title="Couldn't load subscribers" onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-5 w-5" aria-hidden />}
          title="No subscribers found"
          description={hasFilters ? "No one matches this search or filter." : "New signups will appear here."}
          action={
            hasFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear search & filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800/60 dark:bg-zinc-950">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800/70 dark:bg-zinc-900/40 dark:text-zinc-500">
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="hidden px-4 py-3 sm:table-cell">Source</th>
                <th scope="col" className="hidden px-4 py-3 md:table-cell">Date</th>
                <th scope="col" className="px-4 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
              {data.items.map((s) => (
                <tr
                  key={s._id}
                  className="group transition-colors hover:bg-zinc-50/80 focus-within:bg-zinc-50/80 dark:hover:bg-zinc-900/30 dark:focus-within:bg-zinc-900/30"
                >
                  <td className="max-w-56 px-4 py-3.5">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-100" title={s.email}>{s.email}</p>
                    {s.name && (
                      <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{s.name}</p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <StatusBadge status={STATUS_MAP[s.status] ?? "neutral"} label={s.status} />
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3.5 text-zinc-500 sm:table-cell dark:text-zinc-400">{s.source}</td>
                  <td className="hidden whitespace-nowrap px-4 py-3.5 tabular-nums text-zinc-500 md:table-cell dark:text-zinc-400">
                    {formatDate(s.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-0.5 opacity-100 transition-opacity focus-within:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                      {s.status === "active" ? (
                        <button
                          type="button"
                          aria-label={`Unsubscribe ${s.email}`}
                          onClick={() => handleDeactivate(s._id, s.status)}
                          disabled={updating}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700 dark:focus-visible:outline-zinc-100"
                        >
                          <Ban className="h-4 w-4" aria-hidden />
                        </button>
                      ) : s.status === "unsubscribed" ? (
                        <button
                          type="button"
                          aria-label={`Reactivate ${s.email}`}
                          onClick={() => handleDeactivate(s._id, s.status)}
                          disabled={updating}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700 dark:focus-visible:outline-zinc-100"
                        >
                          <CheckCircle className="h-4 w-4" aria-hidden />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        aria-label={`Remove ${s.email}`}
                        onClick={() => setDeleting(s._id)}
                        disabled={removing}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 outline-none transition-colors hover:bg-red-50 hover:text-red-600 active:bg-red-100 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-red-600 dark:text-zinc-500 dark:hover:bg-red-950/40 dark:hover:text-red-400 dark:active:bg-red-950/60 dark:focus-visible:outline-red-400"
                      >
                        <Trash className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400" aria-live="polite">
            Page {page} of {totalPages}
          </p>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
          />
        </div>
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Remove subscriber?"
        description="The email is deleted from the list. This cannot be undone."
        confirmLabel="Remove"
        loading={removing}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          void remove(deleting)
            .unwrap()
            .then(() => setDeleting(null))
            .catch(() => {
              setDeleting(null);
              toast("Couldn't remove subscriber — please try again.", { tone: "error" });
            });
        }}
      />
    </div>
  );
}
