"use client";

import Link from "next/link";
import { useState } from "react";
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
import { useToast } from "@/src/components/ui/Toast";
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
    <div className="space-y-4" role="status" aria-label="Loading posts">
      <Skeleton className="h-16 rounded-2xl" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-zinc-200/60 bg-white p-4 dark:border-zinc-800/60 dark:bg-zinc-950">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded-md" />
            <Skeleton className="h-3 w-1/5 rounded-md" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="hidden h-4 w-12 rounded-md sm:block" />
          <Skeleton className="hidden h-4 w-12 rounded-md sm:block" />
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */

export function PostsManager() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [confirming, setConfirming] = useState<BulkAction | null>(null);
  const { toast } = useToast();

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

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

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
      toast("Bulk action failed — please try again.", { tone: "error" });
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

      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200/60 bg-white p-4 dark:border-zinc-800/60 dark:bg-zinc-950">
        <form onSubmit={applySearch} className="flex flex-col gap-2.5 sm:flex-row sm:items-center" role="search" aria-label="Filter posts">
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
          <div className="flex gap-2.5">
            <div className="flex-1 sm:w-44 sm:flex-none">
              <Select
                size="sm"
                value={status}
                onChange={(e) => changeStatus(e.target.value)}
                aria-label="Filter by status"
                options={STATUS_OPTIONS}
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-9">
              Search
            </Button>
          </div>
        </form>

        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800/70">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Active:</span>
            {search && (
              <span className="inline-flex h-7 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 py-0 pl-3 pr-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                &ldquo;{search}&rdquo;
                <button
                  type="button"
                  onClick={() => { setDraft(""); setSearch(""); setPage(1); }}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full outline-none transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-700 dark:focus-visible:outline-zinc-100"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            )}
            {status && (
              <span className="inline-flex h-7 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 py-0 pl-3 pr-1.5 text-xs font-medium capitalize text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {status}
                <button
                  type="button"
                  onClick={() => changeStatus("")}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full outline-none transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-700 dark:focus-visible:outline-zinc-100"
                  aria-label="Clear status filter"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-7 items-center rounded-full px-2.5 text-xs font-medium text-zinc-500 underline-offset-4 outline-none transition-colors hover:text-zinc-900 hover:underline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Results meta ──────────────────────────────────────── */}
      {data && (
        <p aria-live="polite" className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
          {data.total === 0
            ? "No posts"
            : `${data.total} ${data.total === 1 ? "post" : "posts"}`}
          {status && data.total > 0 && (
            <span> · <span className="capitalize">{status}</span></span>
          )}
          {search && data.total > 0 && (
            <span> · matching &ldquo;{search}&rdquo;</span>
          )}
        </p>
      )}

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
        <Card className="overflow-hidden rounded-2xl border border-zinc-200/60 p-0 shadow-sm dark:border-zinc-800/60">
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
                        className="block rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
                      >
                        <span className="line-clamp-1 text-sm font-medium text-zinc-900 underline-offset-4 transition-colors hover:text-zinc-600 hover:underline dark:text-zinc-100 dark:hover:text-zinc-300">
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
                          className="h-8 w-8 opacity-100 transition-opacity focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 lg:data-[state=open]:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden />
                          <span className="sr-only">Actions for {p.title}</span>
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
      {data && totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400" aria-live="polite">
            Page {page} of {totalPages}
          </p>
          <Pagination
            page={page}
            totalPages={totalPages}
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
