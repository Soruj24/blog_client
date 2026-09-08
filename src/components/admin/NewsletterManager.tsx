"use client";

import { useState } from "react";
import { Ban, CheckCircle, Download, Mail, Search, Trash } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Input } from "@/src/components/ui/Input";
import { Pagination } from "@/src/components/ui/Pagination";
import { Select } from "@/src/components/ui/Select";
import { Skeleton } from "@/src/components/ui/Skeleton";
import {
  useAdminNewsletterQuery,
  useDeleteSubscriberMutation,
  useUpdateSubscriberMutation,
} from "@/src/store/api/adminApi";
import { ConfirmDialog, FilterBar, PageHeader, StatusBadge, formatDate } from "./shared";

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
    <div className="space-y-3" aria-label="Loading subscribers">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 !rounded-xl" />
      ))}
    </div>
  );
}

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
      // handled by cache invalidation
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Newsletter"
        description={
          data
            ? `${data.total} subscribers · ${Object.entries(data.counts).map(([k, v]) => `${k}: ${v}`).join(" · ")}`
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

      <FilterBar>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(draft.trim());
          }}
          className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            />
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search email…"
              aria-label="Search subscribers"
              className="h-9 pl-9"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by subscriber status"
            className="h-9 sm:w-40"
            options={[
              { value: "", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "pending", label: "Pending" },
              { value: "unsubscribed", label: "Unsubscribed" },
              { value: "bounced", label: "Bounced" },
            ]}
          />
          <Button type="submit" variant="secondary" size="sm" className="h-9">
            Search
          </Button>
        </form>
      </FilterBar>

      {isLoading ? (
        <NewsletterSkeleton />
      ) : isError || !data ? (
        <ErrorState title="Couldn't load subscribers" onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<Mail className="h-5 w-5" aria-hidden />}
          title="No subscribers found"
          description="Try clearing search or filters."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800/60 dark:bg-zinc-950">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800/70 dark:bg-zinc-900/40 dark:text-zinc-500">
                <th scope="col" className="px-4 py-3">Email</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Source</th>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
              {data.items.map((s) => (
                <tr
                  key={s._id}
                  className="group transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30"
                >
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{s.email}</p>
                    {s.name && (
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{s.name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={STATUS_MAP[s.status] ?? "neutral"} label={s.status} />
                  </td>
                  <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400">{s.source}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-zinc-500 dark:text-zinc-400">
                    {formatDate(s.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      {s.status === "active" ? (
                        <button
                          type="button"
                          title="Deactivate (unsubscribe)"
                          onClick={() => handleDeactivate(s._id, s.status)}
                          disabled={updating}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        >
                          <Ban className="h-4 w-4" aria-hidden />
                        </button>
                      ) : s.status === "unsubscribed" ? (
                        <button
                          type="button"
                          title="Reactivate"
                          onClick={() => handleDeactivate(s._id, s.status)}
                          disabled={updating}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        >
                          <CheckCircle className="h-4 w-4" aria-hidden />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setDeleting(s._id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
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

      {data && Math.ceil(data.total / data.limit) > 1 && (
        <Pagination
          page={page}
          totalPages={Math.ceil(data.total / data.limit)}
          onChange={setPage}
        />
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
            .catch(() => setDeleting(null));
        }}
      />
    </div>
  );
}
