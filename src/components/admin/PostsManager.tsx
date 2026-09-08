"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Pencil, Search } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Input } from "@/src/components/ui/Input";
import { Pagination } from "@/src/components/ui/Pagination";
import { Select } from "@/src/components/ui/Select";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { useAdminPostsQuery, useBulkPostsMutation } from "@/src/store/api/adminApi";
import {
  BulkBar,
  ConfirmDialog,
  FilterBar,
  PageHeader,
  RowCheckbox,
  StatusBadge,
  compact,
  formatDate,
  useSelection,
} from "./shared";

type BulkAction = "publish" | "draft" | "archive" | "delete";

const STATUS_MAP: Record<string, string> = {
  published: "success",
  draft: "neutral",
  scheduled: "info",
  archived: "warning",
};

function PostsSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading posts">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 !rounded-xl" />
      ))}
    </div>
  );
}

/** Post moderation table: filters, bulk transitions, pagination. */
export function PostsManager() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState<BulkAction | null>(null);

  const { data, isLoading, isError, refetch } = useAdminPostsQuery({
    page,
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
  });
  const [bulk, { isLoading: bulking }] = useBulkPostsMutation();
  const sel = useSelection();

  const rowIds = data?.items.map((p) => p._id) ?? [];

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    sel.clear();
    setSearch(draft.trim());
  };

  const changeStatus = (v: string) => {
    setStatus(v);
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
        title="Posts"
        description={`${data?.total ?? 0} stories total.`}
        actions={
          <Link href="/write">
            <Button size="sm">New Post</Button>
          </Link>
        }
      />

      <FilterBar>
        <form onSubmit={applySearch} className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            />
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search title or excerpt…"
              aria-label="Search posts"
              className="h-9 pl-9"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => changeStatus(e.target.value)}
            aria-label="Filter by status"
            className="h-9 sm:w-40"
            options={[
              { value: "", label: "All statuses" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
              { value: "scheduled", label: "Scheduled" },
              { value: "archived", label: "Archived" },
            ]}
          />
          <Button type="submit" variant="secondary" size="sm" className="h-9">
            Search
          </Button>
        </form>
      </FilterBar>

      {isLoading ? (
        <PostsSkeleton />
      ) : isError || !data ? (
        <ErrorState title="Couldn't load posts" onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState title="No posts found" description="Try clearing search or filters." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800/60 dark:bg-zinc-950">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800/70 dark:bg-zinc-900/40 dark:text-zinc-500">
                <th scope="col" className="w-12 px-4 py-3">
                  <RowCheckbox
                    checked={rowIds.length > 0 && rowIds.every((id) => sel.selected.has(id))}
                    onChange={() => sel.toggleAll(rowIds)}
                    label="Select all posts on this page"
                  />
                </th>
                <th scope="col" className="px-4 py-3">Title</th>
                <th scope="col" className="px-4 py-3">Author</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3 text-right">Views</th>
                <th scope="col" className="px-4 py-3 text-right">Likes</th>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="w-12 px-4 py-3 text-right">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
              {data.items.map((p) => (
                <tr
                  key={p._id}
                  className="group transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30"
                >
                  <td className="px-4 py-3.5">
                    <RowCheckbox
                      checked={sel.selected.has(p._id)}
                      onChange={() => sel.toggle(p._id)}
                      label={`Select ${p.title}`}
                    />
                  </td>
                  <td className="max-w-64 px-4 py-3.5">
                    <Link
                      href={`/blog/${p.slug}`}
                      className="inline-flex items-center gap-1.5 font-medium text-zinc-900 transition-colors hover:text-violet-600 dark:text-zinc-100 dark:hover:text-violet-400"
                    >
                      <span className="truncate">{p.title}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-600" aria-hidden />
                    </Link>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                      /{p.slug}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-zinc-500 dark:text-zinc-400">
                    {p.author?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={STATUS_MAP[p.status] ?? "neutral"} label={p.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-zinc-600 dark:text-zinc-300">
                    {compact(p.views)}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-zinc-600 dark:text-zinc-300">
                    {compact(p.likeCount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-zinc-500 dark:text-zinc-400">
                    {formatDate(p.publishedAt ?? p.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/write/${p._id}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      aria-label={`Edit ${p.title}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
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
        <Button size="sm" variant="secondary" onClick={() => void runBulk("publish")}>
          Publish
        </Button>
        <Button size="sm" variant="secondary" onClick={() => void runBulk("draft")}>
          Draft
        </Button>
        <Button size="sm" variant="secondary" onClick={() => void runBulk("archive")}>
          Archive
        </Button>
        <Button size="sm" variant="danger" onClick={() => setConfirming("delete")}>
          Delete
        </Button>
      </BulkBar>

      <ConfirmDialog
        open={confirming === "delete"}
        title={`Delete ${sel.count} ${sel.count === 1 ? "post" : "posts"}?`}
        description="Likes, bookmarks, comments, and views tied to these posts are removed too."
        confirmLabel="Delete"
        loading={bulking}
        onClose={() => setConfirming(null)}
        onConfirm={() => void runBulk("delete")}
      />
    </div>
  );
}
