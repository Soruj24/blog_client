"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Input } from "@/src/components/ui/Input";
import { Pagination } from "@/src/components/ui/Pagination";
import { Select } from "@/src/components/ui/Select";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { useAdminPostsQuery, useBulkPostsMutation } from "@/src/store/api/adminApi";
import { BulkBar, PageHeader, compact, formatDate, useSelection } from "./shared";

type BulkAction = "publish" | "draft" | "archive" | "delete";

const STATUS_TONE: Record<string, "success" | "neutral" | "info" | "warning"> = {
  published: "success",
  draft: "neutral",
  scheduled: "info",
  archived: "warning",
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "archived", label: "Archived" },
];

/* ── Skeleton ────────────────────────────────────────────────── */

function PostsSkeleton() {
  return (
    <div className="space-y-4" aria-label="Loading posts">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 !rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-14 !rounded-xl" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-zinc-200/60 bg-white p-4 dark:border-zinc-800/60 dark:bg-zinc-950">
          <Skeleton className="h-10 w-10 shrink-0 !rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 !rounded-md" />
            <Skeleton className="h-3 w-1/5 !rounded-md" />
          </div>
          <Skeleton className="h-6 w-16 !rounded-full" />
          <Skeleton className="hidden h-4 w-12 !rounded-md sm:block" />
          <Skeleton className="hidden h-4 w-12 !rounded-md sm:block" />
          <Skeleton className="h-4 w-20 !rounded-md" />
          <Skeleton className="h-8 w-8 !rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/* ── Quick stat card ─────────────────────────────────────────── */

function StatChip({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
      }`}
    >
      <span className={`text-lg font-bold tabular-nums ${active ? "" : "text-zinc-900 dark:text-zinc-100"}`}>
        {compact(value)}
      </span>
      <span className={`text-xs font-medium ${active ? "text-zinc-400" : "text-zinc-500 dark:text-zinc-400"}`}>
        {label}
      </span>
    </button>
  );
}

/* ── Main component ──────────────────────────────────────────── */

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
  const allSelected = rowIds.length > 0 && rowIds.every((id) => sel.selected.has(id));
  const someSelected = sel.count > 0 && !allSelected;

  const stats = useMemo(() => {
    if (!data) return null;
    const counts: Record<string, number> = { published: 0, draft: 0, scheduled: 0, archived: 0 };
    for (const p of data.items) {
      if (counts[p.status] !== undefined) counts[p.status]++;
    }
    return { total: data.total, ...counts } as { total: number; published: number; draft: number; scheduled: number; archived: number };
  }, [data]);

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

  const clearFilters = () => {
    setDraft("");
    setSearch("");
    setStatus("");
    setPage(1);
    sel.clear();
  };

  const hasFilters = search !== "" || status !== "";

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
      {/* ── Header ────────────────────────────────────────────── */}
      <PageHeader
        title="Posts"
        description="Manage your stories, drafts, and publications."
        actions={
          <Link href="/write">
            <Button size="sm">
              <Pencil className="h-4 w-4" />
              New Post
            </Button>
          </Link>
        }
      />

      {/* ── Quick stats ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 !rounded-xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatChip
            label="Published"
            value={stats.published}
            active={status === "published"}
            onClick={() => changeStatus(status === "published" ? "" : "published")}
          />
          <StatChip
            label="Drafts"
            value={stats.draft}
            active={status === "draft"}
            onClick={() => changeStatus(status === "draft" ? "" : "draft")}
          />
          <StatChip
            label="Scheduled"
            value={stats.scheduled}
            active={status === "scheduled"}
            onClick={() => changeStatus(status === "scheduled" ? "" : "scheduled")}
          />
          <StatChip
            label="Archived"
            value={stats.archived}
            active={status === "archived"}
            onClick={() => changeStatus(status === "archived" ? "" : "archived")}
          />
        </div>
      ) : null}

      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/60 bg-white p-4 dark:border-zinc-800/60 dark:bg-zinc-950 sm:flex-row sm:items-center">
        <form onSubmit={applySearch} className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            />
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search by title or slug…"
              aria-label="Search posts"
              className="h-9 pl-9"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => changeStatus(e.target.value)}
            aria-label="Filter by status"
            className="h-9 sm:w-40"
            options={STATUS_OPTIONS}
          />
          <Button type="submit" variant="secondary" size="sm" className="h-9">
            Search
          </Button>
        </form>

        {hasFilters && (
          <div className="flex items-center gap-2">
            {search && (
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                &ldquo;{search}&rdquo;
                <button
                  type="button"
                  onClick={() => { setDraft(""); setSearch(""); setPage(1); }}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {status && (
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {status}
                <button
                  type="button"
                  onClick={() => changeStatus("")}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                  aria-label="Clear status filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Table ─────────────────────────────────────────────── */}
      {isLoading ? (
        <PostsSkeleton />
      ) : isError || !data ? (
        <ErrorState title="Couldn't load posts" onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState
          title="No posts found"
          description={hasFilters ? "Try clearing your search or filters." : "Get started by creating your first post."}
          action={
            hasFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Link href="/write">
                <Button size="sm">Create your first post</Button>
              </Link>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden border-0 p-0 shadow-sm ring-1 ring-zinc-200/60 dark:ring-zinc-800/60">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-zinc-100 bg-zinc-50/80 hover:bg-zinc-50/80 dark:border-zinc-800/70 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/40">
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={() => sel.toggleAll(rowIds)}
                    aria-label="Select all posts"
                  />
                </TableHead>
                <TableHead className="min-w-0">Post</TableHead>
                <TableHead className="hidden sm:table-cell">Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden text-right md:table-cell">Views</TableHead>
                <TableHead className="hidden text-right md:table-cell">Likes</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((p) => (
                <TableRow
                  key={p._id}
                  data-state={sel.selected.has(p._id) ? "selected" : undefined}
                  className="group border-b border-zinc-100/80 last:border-0 dark:border-zinc-800/50"
                >
                  <TableCell>
                    <Checkbox
                      checked={sel.selected.has(p._id)}
                      onCheckedChange={() => sel.toggle(p._id)}
                      aria-label={`Select ${p.title}`}
                    />
                  </TableCell>
                  <TableCell className="min-w-0 max-w-xs">
                    <div className="min-w-0">
                      <Link
                        href={`/blog/${p.slug}`}
                        className="group/link block"
                      >
                        <span className="text-sm font-medium text-zinc-900 transition-colors hover:text-violet-600 group-hover/link:text-violet-600 dark:text-zinc-100 dark:hover:text-violet-400 dark:group-hover/link:text-violet-400 line-clamp-1">
                          {p.title}
                        </span>
                      </Link>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                        /{p.slug}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap sm:table-cell">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {p.author?.name ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[p.status] ?? "neutral"}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden text-right md:table-cell">
                    <span className="text-sm tabular-nums text-zinc-600 dark:text-zinc-300">
                      {compact(p.views)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-right md:table-cell">
                    <span className="text-sm tabular-nums text-zinc-600 dark:text-zinc-300">
                      {compact(p.likeCount)}
                    </span>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap sm:table-cell">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {formatDate(p.publishedAt ?? p.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem asChild>
                          <Link href={`/write/${p._id}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/blog/${p.slug}`} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View live
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600 dark:text-red-400"
                          onClick={() => {
                            sel.clear();
                            sel.toggle(p._id);
                            setConfirming("delete");
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* ── Pagination ────────────────────────────────────────── */}
      {data && Math.ceil(data.total / data.limit) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Page {page} of {Math.ceil(data.total / data.limit)}
          </p>
          <Pagination
            page={page}
            totalPages={Math.ceil(data.total / data.limit)}
            onChange={(p) => {
              setPage(p);
              sel.clear();
            }}
          />
        </div>
      )}

      {/* ── Bulk actions ──────────────────────────────────────── */}
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

      {/* ── Delete confirmation ───────────────────────────────── */}
      <AlertDialog open={confirming === "delete"} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {sel.count} {sel.count === 1 ? "post" : "posts"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Likes, bookmarks, comments, and views tied to these posts are removed too. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={bulking}
              className="bg-red-600 text-white hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400"
              onClick={() => void runBulk("delete")}
            >
              {bulking ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
