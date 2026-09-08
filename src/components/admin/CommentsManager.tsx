"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Eye, Flag, Search, Trash, X } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Input } from "@/src/components/ui/Input";
import { Pagination } from "@/src/components/ui/Pagination";
import { Select } from "@/src/components/ui/Select";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { cx, focusRing } from "@/src/components/ui/shared";
import { useAdminCommentsQuery, useBulkCommentsMutation } from "@/src/store/api/adminApi";
import {
  BulkBar,
  ConfirmDialog,
  FilterBar,
  PageHeader,
  RowCheckbox,
  StatusBadge,
  formatDate,
  useSelection,
} from "./shared";

type BulkAction = "approve" | "reject" | "spam" | "delete";

const STATUS_MAP: Record<string, string> = {
  approved: "success",
  pending: "warning",
  rejected: "neutral",
  spam: "danger",
};

const iconBtn = cx(
  "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40",
  focusRing,
);

function CommentsSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading comments">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-20 !rounded-xl" />
      ))}
    </div>
  );
}

/** Comment moderation: queue-first table, single + bulk transitions. */
export function CommentsManager() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("pending");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState<BulkAction | null>(null);

  const { data, isLoading, isError, refetch } = useAdminCommentsQuery({
    page,
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
  });
  const [bulk, { isLoading: bulking }] = useBulkCommentsMutation();
  const sel = useSelection();

  const rowIds = data?.items.map((c) => c._id) ?? [];

  const resetPage = () => {
    setPage(1);
    sel.clear();
  };

  const runBulk = async (action: BulkAction) => {
    try {
      await bulk({ ids: [...sel.selected], action }).unwrap();
      sel.clear();
      setConfirming(null);
    } catch {
      setConfirming(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comments"
        description={`${data?.total ?? 0} matching — queue defaults to pending first.`}
      />

      <FilterBar>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resetPage();
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
              placeholder="Search comment text…"
              aria-label="Search comments"
              className="h-9 pl-9"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              resetPage();
            }}
            aria-label="Filter by status"
            className="h-9 sm:w-40"
            options={[
              { value: "pending", label: "Pending" },
              { value: "", label: "All statuses" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
              { value: "spam", label: "Spam" },
            ]}
          />
          <Button type="submit" variant="secondary" size="sm" className="h-9">
            Search
          </Button>
        </form>
      </FilterBar>

      {isLoading ? (
        <CommentsSkeleton />
      ) : isError || !data ? (
        <ErrorState title="Couldn't load comments" onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState
          title={status === "pending" ? "Queue is clear" : "No comments found"}
          description={
            status === "pending"
              ? "Nothing awaiting review."
              : "Try clearing search or filters."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800/60 dark:bg-zinc-950">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800/70 dark:bg-zinc-900/40 dark:text-zinc-500">
                <th scope="col" className="w-12 px-4 py-3">
                  <RowCheckbox
                    checked={rowIds.length > 0 && rowIds.every((id) => sel.selected.has(id))}
                    onChange={() => sel.toggleAll(rowIds)}
                    label="Select all comments on this page"
                  />
                </th>
                <th scope="col" className="px-4 py-3">Comment</th>
                <th scope="col" className="px-4 py-3">Post</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
              {data.items.map((c) => (
                <tr
                  key={c._id}
                  className="group transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30"
                >
                  <td className="px-4 py-3.5 align-top">
                    <RowCheckbox
                      checked={sel.selected.has(c._id)}
                      onChange={() => sel.toggle(c._id)}
                      label={`Select comment by ${c.author?.name ?? "unknown"}`}
                    />
                  </td>
                  <td className="max-w-72 px-4 py-3.5">
                    <p className="line-clamp-2 text-zinc-700 dark:text-zinc-300" title={c.content}>
                      {c.content}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                      {c.author?.name ?? "Unknown"} · ♥ {c.likeCount}
                    </p>
                  </td>
                  <td className="max-w-48 px-4 py-3.5">
                    {c.post ? (
                      <Link
                        href={`/blog/${c.post.slug}`}
                        className="line-clamp-2 text-sm font-medium text-zinc-900 transition-colors hover:text-violet-600 dark:text-zinc-100 dark:hover:text-violet-400"
                      >
                        {c.post.title}
                      </Link>
                    ) : (
                      <span className="text-zinc-300 dark:text-zinc-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={STATUS_MAP[c.status] ?? "neutral"} label={c.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-zinc-500 dark:text-zinc-400">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label={`Approve comment by ${c.author?.name ?? "unknown"}`}
                        title="Approve"
                        onClick={() => void bulk({ ids: [c._id], action: "approve" }).unwrap().catch(() => undefined)}
                        className={cx(iconBtn, "text-emerald-500 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40")}
                      >
                        <Check className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label="Reject comment"
                        title="Reject"
                        onClick={() => void bulk({ ids: [c._id], action: "reject" }).unwrap().catch(() => undefined)}
                        className={cx(iconBtn, "text-zinc-400 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800")}
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label="Mark comment as spam"
                        title="Spam"
                        onClick={() => void bulk({ ids: [c._id], action: "spam" }).unwrap().catch(() => undefined)}
                        className={cx(iconBtn, "text-amber-500 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40")}
                      >
                        <Flag className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete comment"
                        title="Delete"
                        onClick={() => {
                          sel.clear();
                          sel.toggle(c._id);
                          setConfirming("delete");
                        }}
                        className={cx(iconBtn, "text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40")}
                      >
                        <Trash className="h-4 w-4" aria-hidden />
                      </button>
                    </span>
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
          onChange={(p) => {
            setPage(p);
            sel.clear();
          }}
        />
      )}

      <BulkBar count={sel.count} onClear={sel.clear}>
        <Button size="sm" variant="secondary" onClick={() => void runBulk("approve")}>
          Approve
        </Button>
        <Button size="sm" variant="secondary" onClick={() => void runBulk("reject")}>
          Reject
        </Button>
        <Button size="sm" variant="secondary" onClick={() => void runBulk("spam")}>
          Spam
        </Button>
        <Button size="sm" variant="danger" onClick={() => setConfirming("delete")}>
          Delete
        </Button>
      </BulkBar>

      <ConfirmDialog
        open={confirming === "delete"}
        title={`Delete ${sel.count} ${sel.count === 1 ? "comment" : "comments"}?`}
        description="Deleted comments are removed along with their likes."
        confirmLabel="Delete"
        loading={bulking}
        onClose={() => setConfirming(null)}
        onConfirm={() => void runBulk("delete")}
      />
    </div>
  );
}
