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
import { cx } from "@/src/components/ui/shared";
import { useAdminMediaQuery, useDeleteMediaMutation, useUpdateMediaMutation } from "@/src/store/api/adminApi";
import type { AdminMedia } from "@/src/store/api/adminApi";
import { ConfirmDialog, PageHeader, formatDate } from "./shared";

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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" role="status" aria-label="Loading media">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-3 w-3/4 rounded-md" />
          <Skeleton className="h-3 w-1/2 rounded-md" />
        </div>
      ))}
    </div>
  );
}

function MediaListSkeleton() {
  return (
    <div className="space-y-2" role="status" aria-label="Loading media">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-zinc-200/60 bg-white p-3 dark:border-zinc-800/60 dark:bg-zinc-950">
          <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3 rounded-md" />
            <Skeleton className="h-3 w-1/5 rounded-md" />
          </div>
          <Skeleton className="hidden h-6 w-16 rounded-full sm:block" />
          <Skeleton className="hidden h-4 w-20 rounded-md md:block" />
          <Skeleton className="hidden h-4 w-16 rounded-md md:block" />
          <Skeleton className="hidden h-4 w-20 rounded-md lg:block" />
        </div>
      ))}
    </div>
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
            <div
              role="group"
              aria-label="Layout"
              className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                aria-label="Grid view"
                className={cx(
                  "rounded-md p-2 outline-none transition-colors focus-visible:outline-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
                  view === "grid"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700",
                )}
              >
                <Grid3X3 className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                aria-label="List view"
                className={cx(
                  "rounded-md p-2 outline-none transition-colors focus-visible:outline-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
                  view === "list"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700",
                )}
              >
                <List className="h-4 w-4" aria-hidden />
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
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-colors duration-200 sm:p-8 ${
          dragOver
            ? "border-zinc-900 bg-zinc-100/60 dark:border-zinc-100 dark:bg-zinc-800/40"
            : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/20 dark:hover:border-zinc-700"
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3" role="status" aria-label="Uploading image">
            <div aria-hidden className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-zinc-100" />
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
      <div className="rounded-2xl border border-zinc-200/60 bg-white p-4 dark:border-zinc-800/60 dark:bg-zinc-950">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center" role="search" aria-label="Filter media">
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
          <div className="flex gap-2.5">
            <div className="flex-1 sm:w-36 sm:flex-none">
              <Select
                size="sm"
                value={usage}
                onChange={(e) => changeUsage(e.target.value)}
                aria-label="Filter by usage"
                options={USAGE_OPTIONS}
              />
            </div>
            <div className="flex-1 sm:w-36 sm:flex-none">
              <Select
                size="sm"
                value={format}
                onChange={(e) => changeFormat(e.target.value)}
                aria-label="Filter by format"
                options={FORMAT_OPTIONS}
              />
            </div>
          </div>
        </div>

        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800/70">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Active:</span>
            {search && (
              <span className="inline-flex h-7 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 py-0 pl-3 pr-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <span className="max-w-40 truncate">&ldquo;{search}&rdquo;</span>
                <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }} className="inline-flex h-5 w-5 items-center justify-center rounded-full outline-none transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-700 dark:focus-visible:outline-zinc-100" aria-label="Clear search">
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            )}
            {usage && (
              <span className="inline-flex h-7 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 py-0 pl-3 pr-1.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {usage}
                <button type="button" onClick={() => changeUsage("")} className="inline-flex h-5 w-5 items-center justify-center rounded-full outline-none transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-700 dark:focus-visible:outline-zinc-100" aria-label="Clear usage filter">
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            )}
            {format && (
              <span className="inline-flex h-7 items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 py-0 pl-3 pr-1.5 text-xs font-medium uppercase text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {format}
                <button type="button" onClick={() => changeFormat("")} className="inline-flex h-5 w-5 items-center justify-center rounded-full outline-none transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-700 dark:focus-visible:outline-zinc-100" aria-label="Clear format filter">
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            )}
            <button type="button" onClick={clearFilters} className="inline-flex h-7 items-center rounded-full px-2.5 text-xs font-medium text-zinc-500 underline-offset-4 outline-none transition-colors hover:text-zinc-900 hover:underline focus-visible:outline-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:focus-visible:outline-zinc-100">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Results meta ──────────────────────────────────────── */}
      {data && (
        <p aria-live="polite" className="-mb-3 text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
          {data.total === 0 ? "No assets" : `${data.total} ${data.total === 1 ? "asset" : "assets"}`}
        </p>
      )}

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
                className="group relative overflow-hidden rounded-xl border border-zinc-200/60 bg-white transition-colors duration-200 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-900/5 focus-within:border-zinc-300 dark:border-zinc-800/60 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:focus-within:border-zinc-700"
              >
                <button
                  type="button"
                  onClick={() => { setPreview(m); setEditingAlt(m.alt || ""); }}
                  className="block w-full rounded-t-xl text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
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
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-100 transition-opacity focus-within:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleCopy(m.url)}
                    aria-label={`Copy URL for ${m.publicId}`}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white outline-none backdrop-blur-sm transition-colors hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-white"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  {deletable && (
                    <button
                      type="button"
                      onClick={() => setDeleting(m._id)}
                      aria-label={`Delete ${m.publicId}`}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white outline-none backdrop-blur-sm transition-colors hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-white"
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
        <Card className="overflow-hidden rounded-2xl border border-zinc-200/60 p-0 shadow-sm dark:border-zinc-800/60">
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {data.items.map((m) => {
              const deletable = canDelete(m);
              return (
                <div key={m._id} className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-zinc-50/80 focus-within:bg-zinc-50/80 dark:hover:bg-zinc-900/30 dark:focus-within:bg-zinc-900/30">
                  <button
                    type="button"
                    onClick={() => { setPreview(m); setEditingAlt(m.alt || ""); }}
                    className="shrink-0 rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100"
                    aria-label={`Preview ${m.publicId}`}
                  >
                    <img
                      src={optimizedUrl(m.url, 120)}
                      alt=""
                      loading="lazy"
                      decoding="async"
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
                  <div className="flex items-center gap-1 opacity-100 transition-opacity focus-within:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
                    <button
                      type="button"
                      onClick={() => handleCopy(m.url)}
                      aria-label={`Copy URL for ${m.publicId}`}
                      className="rounded-lg p-2 text-zinc-400 outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700 dark:focus-visible:outline-zinc-100"
                    >
                      <Copy className="h-4 w-4" aria-hidden />
                    </button>
                    {deletable && (
                      <button
                        type="button"
                        onClick={() => setDeleting(m._id)}
                        aria-label={`Delete ${m.publicId}`}
                        className="rounded-lg p-2 text-zinc-400 outline-none transition-colors hover:bg-red-50 hover:text-red-600 active:bg-red-100 focus-visible:outline-2 focus-visible:outline-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 dark:active:bg-red-950/60 dark:focus-visible:outline-red-400"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400" aria-live="polite">
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
          title={preview.alt || preview.publicId}
          description="Asset preview, details, and alt text."
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
                decoding="async"
                className="h-auto max-h-[55vh] w-full object-contain"
              />
            </div>

            {/* Metadata */}
            <dl className="grid gap-x-4 gap-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">File</dt>
                <dd className="mt-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{preview.publicId}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Size</dt>
                <dd className="mt-1 text-sm tabular-nums text-zinc-700 dark:text-zinc-300">{formatBytes(preview.bytes)}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Dimensions</dt>
                <dd className="mt-1 text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
                  {preview.width && preview.height ? `${preview.width} × ${preview.height} px` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Format</dt>
                <dd className="mt-1 text-sm uppercase text-zinc-700 dark:text-zinc-300">{preview.format ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Usage</dt>
                <dd className="mt-1">
                  <Badge tone={USAGE_MAP[preview.usage] ?? "neutral"}>{preview.usage}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Folder</dt>
                <dd className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{preview.folder || "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Owner</dt>
                <dd className="mt-1 truncate text-sm text-zinc-700 dark:text-zinc-300">
                  {preview.owner?.name ?? "—"}
                  {preview.owner?.email && <span className="text-zinc-400"> · {preview.owner.email}</span>}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Uploaded</dt>
                <dd className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{formatDate(preview.createdAt)}</dd>
              </div>
              {preview.post && (
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Linked post</dt>
                  <dd className="mt-1">
                    <Link href={`/blog/${preview.post.slug}`} className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-zinc-900 underline underline-offset-4 outline-none transition-colors hover:text-zinc-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-100 dark:hover:text-zinc-300 dark:focus-visible:outline-zinc-100">
                      <span className="truncate">{preview.post.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                    </Link>
                  </dd>
                </div>
              )}
            </dl>

            {/* URL */}
            <div>
              <label htmlFor="media-url" className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">URL</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  id="media-url"
                  readOnly
                  value={preview.url}
                  onFocus={(e) => e.target.select()}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
                />
                <Button size="sm" variant="secondary" onClick={() => handleCopy(preview.url)}>
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                  Copy
                </Button>
              </div>
            </div>

            {/* Alt text */}
            <div>
              <label htmlFor="media-alt" className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Alt text</label>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Accessibility &amp; SEO — describe the image for screen readers.</p>
              <div className="mt-2 flex gap-2">
                <input
                  id="media-alt"
                  value={editingAlt}
                  onChange={(e) => setEditingAlt(e.target.value)}
                  maxLength={200}
                  placeholder="Describe the image…"
                  className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-600 dark:hover:border-zinc-700 dark:focus:border-zinc-600 dark:focus:ring-zinc-100/10"
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
