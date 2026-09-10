"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSession, useSession } from "next-auth/react";
import {
  Copy,
  ExternalLink,
  Grid3X3,
  Image as ImageIcon,
  List,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Pagination } from "@/src/components/ui/Pagination";
import { Select } from "@/src/components/ui/Select";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { useToast } from "@/src/components/ui/Toast";
import { useAdminMediaQuery, useDeleteMediaMutation, useUpdateMediaMutation } from "@/src/store/api/adminApi";
import type { AdminMedia } from "@/src/store/api/adminApi";
import { ConfirmDialog, FilterBar, PageHeader, StatusBadge, formatDate } from "./shared";

/* ── Constants ───────────────────────────────────────────────── */

const USAGE_MAP: Record<string, "success" | "info" | "neutral" | "warning"> = {
  cover: "success",
  avatar: "info",
  "post-body": "neutral",
  other: "warning",
};

const USAGE_OPTIONS = [
  { value: "", label: "All usages" },
  { value: "cover", label: "Cover" },
  { value: "avatar", label: "Avatar" },
  { value: "post-body", label: "Post body" },
  { value: "other", label: "Other" },
];

const FORMAT_OPTIONS = [
  { value: "", label: "All formats" },
  { value: "jpg", label: "JPEG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "gif", label: "GIF" },
  { value: "avif", label: "AVIF" },
];

/* ── Helpers ─────────────────────────────────────────────────── */

function optimizedUrl(url: string, width: number): string {
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/f_auto,q_auto,w_${width}/`);
  }
  if (url.includes("picsum.photos")) return url;
  return url;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/* ── Skeletons ───────────────────────────────────────────────── */

function MediaGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label="Loading media">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full !rounded-xl" />
          <Skeleton className="h-3 w-3/4 !rounded-md" />
          <Skeleton className="h-3 w-1/2 !rounded-md" />
        </div>
      ))}
    </div>
  );
}

function MediaListSkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading media">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-zinc-200/60 bg-white p-3 dark:border-zinc-800/60 dark:bg-zinc-950">
          <Skeleton className="h-12 w-12 shrink-0 !rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 !rounded-md" />
            <Skeleton className="h-3 w-1/5 !rounded-md" />
          </div>
          <Skeleton className="hidden h-6 w-16 !rounded-full sm:block" />
          <Skeleton className="hidden h-4 w-20 !rounded-md md:block" />
          <Skeleton className="hidden h-4 w-16 !rounded-md md:block" />
          <Skeleton className="hidden h-4 w-20 !rounded-md lg:block" />
        </div>
      ))}
    </div>
  );
}

/* ── Stat chips ──────────────────────────────────────────────── */

function StatChip({
  label,
  value,
  active,
  onClick,
  accent,
}: {
  label: string;
  value: number;
  active?: boolean;
  onClick?: () => void;
  accent?: string;
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
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <span className={`text-lg font-bold tabular-nums ${active ? "" : "text-zinc-900 dark:text-zinc-100"}`}>
        {value}
      </span>
      <span className={`text-xs font-medium ${active ? "text-zinc-400" : "text-zinc-500 dark:text-zinc-400"}`}>
        {label}
      </span>
    </button>
  );
}

/* ── Main component ──────────────────────────────────────────── */

export function MediaManager() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [usage, setUsage] = useState("");
  const [format, setFormat] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [preview, setPreview] = useState<AdminMedia | null>(null);
  const [editingAlt, setEditingAlt] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = session?.user?.role === "admin";
  const currentUserId = session?.user?.id;

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, refetch } = useAdminMediaQuery({
    page,
    ...(usage ? { usage } : {}),
    ...(search ? { search } : {}),
    ...(format ? { format } : {}),
  });
  const [remove, { isLoading: removing }] = useDeleteMediaMutation();
  const [updateMedia] = useUpdateMediaMutation();

  const changeUsage = (v: string) => { setUsage(v); setPage(1); };
  const changeFormat = (v: string) => { setFormat(v); setPage(1); };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setUsage("");
    setFormat("");
    setPage(1);
  };

  const hasFilters = search !== "" || usage !== "" || format !== "";

  const canDelete = useCallback(
    (m: AdminMedia) => {
      if (isAdmin) return true;
      return m.owner?._id === currentUserId;
    },
    [isAdmin, currentUserId],
  );

  /* ── Upload ──────────────────────────────────────────────── */

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Only images are allowed", { tone: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Image must be smaller than 5 MB", { tone: "error" });
      return;
    }
    setUploading(true);
    try {
      const s = await getSession();
      const token = (s as unknown as { backendToken?: string })?.backendToken;
      if (!token) throw new Error("Not authenticated");
      const form = new FormData();
      form.append("image", file);
      form.append("alt", file.name.replace(/\.[^/.]+$/, "").slice(0, 200));
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
      const res = await fetch(`${base}/media/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { message?: string }).message || "Upload failed");
      }
      toast("Image uploaded", { tone: "success" });
      refetch();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Upload failed", { tone: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  /* ── Actions ─────────────────────────────────────────────── */

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast("URL copied", { tone: "success" });
    } catch {
      toast("Failed to copy", { tone: "error" });
    }
  };

  const handleAltSave = async () => {
    if (!preview) return;
    try {
      await updateMedia({ id: preview._id, alt: editingAlt }).unwrap();
      toast("Alt text updated", { tone: "success" });
      setPreview({ ...preview, alt: editingAlt });
    } catch {
      toast("Failed to update", { tone: "error" });
    }
  };

  /* ── Render ──────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <PageHeader
        title="Media Library"
        description="Upload, manage, and organize your images."
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950 sm:flex">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`rounded-md p-1.5 transition-colors ${view === "grid" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"}`}
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`rounded-md p-1.5 transition-colors ${view === "list" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"}`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4" aria-hidden />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        }
      />

      {/* ── Upload dropzone ───────────────────────────────────── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
          dragOver
            ? "border-violet-500 bg-violet-50/50 dark:border-violet-400 dark:bg-violet-950/20"
            : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/20 dark:hover:border-zinc-700"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-violet-600 dark:border-zinc-600 dark:border-t-violet-400" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Uploading…</p>
          </div>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <Upload className="h-4 w-4 text-zinc-500 dark:text-zinc-400" aria-hidden />
            </div>
            <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Drag & drop an image here
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              JPEG, PNG, WebP, GIF, AVIF — up to 5 MB
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              Browse files
            </Button>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/60 bg-white p-4 dark:border-zinc-800/60 dark:bg-zinc-950 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by ID, alt, folder…"
            aria-label="Search media"
            className="h-9 pl-9"
          />
        </div>
        <Select
          value={usage}
          onChange={(e) => changeUsage(e.target.value)}
          aria-label="Filter by usage"
          className="h-9 sm:w-36"
          options={USAGE_OPTIONS}
        />
        <Select
          value={format}
          onChange={(e) => changeFormat(e.target.value)}
          aria-label="Filter by format"
          className="h-9 sm:w-36"
          options={FORMAT_OPTIONS}
        />

        {hasFilters && (
          <div className="flex items-center gap-2">
            {search && (
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                &ldquo;{search}&rdquo;
                <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} className="ml-0.5 rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700" aria-label="Clear search">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {usage && (
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {usage}
                <button type="button" onClick={() => changeUsage("")} className="ml-0.5 rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700" aria-label="Clear usage">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {format && (
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {format.toUpperCase()}
                <button type="button" onClick={() => changeFormat("")} className="ml-0.5 rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700" aria-label="Clear format">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button type="button" onClick={clearFilters} className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      {isLoading ? (
        view === "grid" ? <MediaGridSkeleton /> : <MediaListSkeleton />
      ) : isError || !data ? (
        <ErrorState title="Couldn't load media" onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="h-5 w-5" aria-hidden />}
          title="No media found"
          description={
            hasFilters
              ? "Try clearing your search or filters."
              : "Upload your first image to get started."
          }
          action={
            hasFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button>
            ) : (
              <Button size="sm" onClick={() => fileInputRef.current?.click()}>Upload image</Button>
            )
          }
        />
      ) : view === "grid" ? (
        /* ── Grid view ─────────────────────────────────────── */
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.items.map((m) => {
            const deletable = canDelete(m);
            return (
              <div
                key={m._id}
                className="group relative overflow-hidden rounded-xl border border-zinc-200/60 bg-white transition-all duration-200 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-900/5 dark:border-zinc-800/60 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <button
                  type="button"
                  onClick={() => { setPreview(m); setEditingAlt(m.alt || ""); }}
                  className="block w-full text-left"
                  aria-label={`Preview ${m.publicId}`}
                >
                  <div className="aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                    <img
                      src={optimizedUrl(m.url, 400)}
                      srcSet={`${optimizedUrl(m.url, 300)} 300w, ${optimizedUrl(m.url, 600)} 600w`}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      alt={m.alt || m.publicId}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </button>
                <div className="p-2.5">
                  <p className="truncate font-mono text-[10px] text-zinc-400 dark:text-zinc-500" title={m.publicId}>
                    {m.publicId}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <Badge tone={USAGE_MAP[m.usage] ?? "neutral"} className="text-[10px] px-1.5 py-0">
                      {m.usage}
                    </Badge>
                    {m.format && (
                      <span className="rounded bg-zinc-100 px-1 py-0.5 text-[9px] font-medium uppercase dark:bg-zinc-800">
                        {m.format}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover actions */}
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleCopy(m.url)}
                    aria-label="Copy URL"
                    title="Copy URL"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  {deletable && (
                    <button
                      type="button"
                      onClick={() => setDeleting(m._id)}
                      aria-label={`Delete ${m.publicId}`}
                      title="Delete"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List view ─────────────────────────────────────── */
        <Card className="overflow-hidden border-0 p-0 shadow-sm ring-1 ring-zinc-200/60 dark:ring-zinc-800/60">
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {data.items.map((m) => {
              const deletable = canDelete(m);
              return (
                <div key={m._id} className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30">
                  <button
                    type="button"
                    onClick={() => { setPreview(m); setEditingAlt(m.alt || ""); }}
                    className="shrink-0"
                    aria-label={`Preview ${m.publicId}`}
                  >
                    <img
                      src={optimizedUrl(m.url, 120)}
                      alt={m.alt || m.publicId}
                      loading="lazy"
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {m.alt || m.publicId}
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                      {m.publicId}
                    </p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <Badge tone={USAGE_MAP[m.usage] ?? "neutral"} className="text-[10px]">
                      {m.usage}
                    </Badge>
                    {m.format && (
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase dark:bg-zinc-800">
                        {m.format}
                      </span>
                    )}
                  </div>
                  <p className="hidden text-xs text-zinc-500 dark:text-zinc-400 md:block">
                    {formatBytes(m.bytes)}
                  </p>
                  <p className="hidden text-xs text-zinc-500 dark:text-zinc-400 md:block">
                    {m.width && m.height ? `${m.width}×${m.height}` : "—"}
                  </p>
                  <p className="hidden text-xs text-zinc-500 dark:text-zinc-400 lg:block">
                    {formatDate(m.createdAt)}
                  </p>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleCopy(m.url)}
                      aria-label="Copy URL"
                      className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {deletable && (
                      <button
                        type="button"
                        onClick={() => setDeleting(m._id)}
                        aria-label={`Delete ${m.publicId}`}
                        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
            onChange={(p) => { setPage(p); }}
          />
        </div>
      )}

      {/* ── Preview modal ─────────────────────────────────────── */}
      {preview && (
        <Modal
          open={!!preview}
          onClose={() => setPreview(null)}
          title=""
          description=""
          size="lg"
        >
          <div className="space-y-5">
            {/* Image */}
            <div className="overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <img
                src={optimizedUrl(preview.url, 1200)}
                srcSet={`${optimizedUrl(preview.url, 600)} 600w, ${optimizedUrl(preview.url, 1200)} 1200w`}
                sizes="(max-width: 768px) 100vw, 800px"
                alt={preview.alt || preview.publicId}
                loading="lazy"
                className="h-auto max-h-[55vh] w-full object-contain"
              />
            </div>

            {/* Metadata grid */}
            <div className="grid gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">File</p>
                <p className="mt-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{preview.publicId}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Size</p>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{formatBytes(preview.bytes)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Dimensions</p>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {preview.width && preview.height ? `${preview.width} × ${preview.height} px` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Format</p>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{preview.format?.toUpperCase() ?? "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Usage</p>
                <div className="mt-1">
                  <Badge tone={USAGE_MAP[preview.usage] ?? "neutral"}>{preview.usage}</Badge>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Folder</p>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{preview.folder || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Owner</p>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                  {preview.owner?.name ?? "—"}
                  {preview.owner?.email && <span className="text-zinc-400"> · {preview.owner.email}</span>}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Created</p>
                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{formatDate(preview.createdAt)}</p>
              </div>
              {preview.post && (
                <div className="sm:col-span-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Linked post</p>
                  <p className="mt-1">
                    <Link href={`/blog/${preview.post.slug}`} className="inline-flex items-center gap-1 text-sm text-violet-600 hover:underline dark:text-violet-400">
                      {preview.post.title}
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {/* URL */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">URL</p>
              <div className="mt-1.5 flex gap-2">
                <input
                  readOnly
                  value={preview.url}
                  className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs dark:border-zinc-800 dark:bg-zinc-900"
                />
                <Button size="sm" variant="secondary" onClick={() => handleCopy(preview.url)}>
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  Copy
                </Button>
              </div>
            </div>

            {/* Alt text */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Alt text</label>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Accessibility &amp; SEO — describe the image for screen readers.</p>
              <div className="mt-2 flex gap-2">
                <input
                  value={editingAlt}
                  onChange={(e) => setEditingAlt(e.target.value)}
                  maxLength={200}
                  placeholder="Describe the image…"
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                />
                <Button size="sm" onClick={handleAltSave}>Save</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete confirmation ───────────────────────────────── */}
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this asset?"
        description="The registry row is removed and a Cloudinary destroy is attempted. Only the owner or an admin can delete."
        confirmLabel="Delete"
        loading={removing}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          void remove(deleting)
            .unwrap()
            .then(() => {
              toast("Deleted", { tone: "success" });
              setDeleting(null);
            })
            .catch((e) => {
              const msg = (e as { data?: { message?: string } })?.data?.message || "Delete failed";
              toast(msg, { tone: "error" });
              setDeleting(null);
            });
        }}
      />
    </div>
  );
}
