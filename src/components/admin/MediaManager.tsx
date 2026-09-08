"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSession, useSession } from "next-auth/react";
import {
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Search,
  Trash,
  Upload,
} from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Pagination } from "@/src/components/ui/Pagination";
import { Select } from "@/src/components/ui/Select";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { useToast } from "@/src/components/ui/Toast";
import { useAdminMediaQuery, useDeleteMediaMutation, useUpdateMediaMutation } from "@/src/store/api/adminApi";
import type { AdminMedia } from "@/src/store/api/adminApi";
import { ConfirmDialog, FilterBar, PageHeader, StatusBadge, formatDate } from "./shared";

const USAGE_MAP: Record<string, string> = {
  cover: "primary",
  avatar: "info",
  "post-body": "neutral",
  other: "neutral",
};

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

function MediaSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Loading media">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square !rounded-2xl" />
      ))}
    </div>
  );
}

/** Media Library: upload, preview, search, filter, metadata, usage, delete with auth */
export function MediaManager() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [usage, setUsage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [preview, setPreview] = useState<AdminMedia | null>(null);
  const [editingAlt, setEditingAlt] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
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
  });
  const [remove, { isLoading: removing }] = useDeleteMediaMutation();
  const [updateMedia] = useUpdateMediaMutation();

  const changeUsage = (v: string) => {
    setUsage(v);
    setPage(1);
  };

  const canDelete = useCallback(
    (m: AdminMedia) => {
      if (isAdmin) return true;
      return m.owner?._id === currentUserId;
    },
    [isAdmin, currentUserId],
  );

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Only images are allowed", { tone: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("Image must be smaller than 5MB", { tone: "error" });
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description={`${data?.total ?? 0} assets — responsive, optimized delivery.`}
        actions={
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4" aria-hidden />
            {uploading ? "Uploading…" : "Upload image"}
          </Button>
        }
      />

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleUpload(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
          dragOver
            ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
            : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/20 dark:hover:border-zinc-700"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <Upload className="h-5 w-5 text-zinc-500 dark:text-zinc-400" aria-hidden />
        </div>
        <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Drag & drop images here
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          JPEG, PNG, WebP, GIF, AVIF — up to 5 MB
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          Browse files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {/* Filters */}
      <FilterBar>
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by public ID, alt, folder…"
            aria-label="Search media"
            className="h-9 pl-9"
          />
        </div>
        <Select
          value={usage}
          onChange={(e) => changeUsage(e.target.value)}
          aria-label="Filter by usage"
          className="h-9 sm:w-40"
          options={[
            { value: "", label: "All usages" },
            { value: "cover", label: "Cover" },
            { value: "avatar", label: "Avatar" },
            { value: "post-body", label: "Post body" },
            { value: "other", label: "Other" },
          ]}
        />
      </FilterBar>

      {isLoading ? (
        <MediaSkeleton />
      ) : isError || !data ? (
        <ErrorState title="Couldn't load media" onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="h-5 w-5" aria-hidden />}
          title="No media yet"
          description={
            search
              ? `No results for "${search}".`
              : usage
                ? `No assets with usage "${usage}".`
                : "Uploads appear here once authors add images."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.items.map((m) => {
            const deletable = canDelete(m);
            return (
              <div
                key={m._id}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white transition-all duration-200 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-900/5 dark:border-zinc-800/60 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <button
                  type="button"
                  onClick={() => {
                    setPreview(m);
                    setEditingAlt(m.alt || "");
                  }}
                  className="block w-full text-left"
                  aria-label={`Preview ${m.publicId}`}
                >
                  <div className="aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                    <img
                      src={optimizedUrl(m.url, 400)}
                      srcSet={`${optimizedUrl(m.url, 300)} 300w, ${optimizedUrl(m.url, 600)} 600w`}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      alt={m.alt || m.publicId}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </button>
                <div className="p-3">
                  <p className="truncate font-mono text-[11px] text-zinc-500 dark:text-zinc-400" title={m.publicId}>
                    {m.publicId}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={USAGE_MAP[m.usage] ?? "neutral"} label={m.usage} dot={false} />
                    {m.format && (
                      <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium dark:bg-zinc-800">
                        {m.format.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px]">
                    {m.post && (
                      <Link
                        href={`/blog/${m.post.slug}`}
                        className="inline-flex items-center gap-0.5 hover:underline"
                      >
                        {m.post.title.slice(0, 22)}
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </Link>
                    )}
                    {m.post && <span className="text-zinc-300">·</span>}
                    <span className="text-zinc-500 dark:text-zinc-400" title={m.alt || "No alt"}>
                      {m.alt ? `\u201C${m.alt.slice(0, 18)}\u201D` : "No alt"}
                    </span>
                  </p>
                </div>
                {/* Action buttons */}
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => handleCopy(m.url)}
                    aria-label="Copy URL"
                    title="Copy URL"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950/60 text-white backdrop-blur transition-colors hover:bg-zinc-950/80"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(m._id)}
                    disabled={!deletable}
                    aria-label={deletable ? `Delete ${m.publicId}` : "You cannot delete this asset"}
                    title={deletable ? "Delete" : "Only owner or admin can delete"}
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-lg backdrop-blur transition-colors ${
                      deletable
                        ? "bg-zinc-950/60 text-white hover:bg-red-600"
                        : "cursor-not-allowed bg-zinc-500/40 text-white/60"
                    }`}
                  >
                    <Trash className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {data && Math.ceil(data.total / data.limit) > 1 && (
        <Pagination
          page={page}
          totalPages={Math.ceil(data.total / data.limit)}
          onChange={setPage}
        />
      )}

      {/* Preview modal */}
      {preview && (
        <Modal
          open={!!preview}
          onClose={() => setPreview(null)}
          title={preview.publicId}
          description={`${preview.width ?? "—"} × ${preview.height ?? "—"} · ${formatBytes(preview.bytes)} · ${preview.format?.toUpperCase() ?? "—"} · ${preview.folder}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
              <img
                src={optimizedUrl(preview.url, 800)}
                srcSet={`${optimizedUrl(preview.url, 400)} 400w, ${optimizedUrl(preview.url, 800)} 800w, ${optimizedUrl(preview.url, 1200)} 1200w`}
                sizes="(max-width: 768px) 100vw, 800px"
                alt={preview.alt || preview.publicId}
                loading="lazy"
                className="h-auto max-h-[60vh] w-full object-contain"
              />
            </div>
            <div className="grid gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Owner</p>
                <p className="mt-1 text-sm">{preview.owner?.name ?? "—"} {preview.owner?.email ? `· ${preview.owner.email}` : ""}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Created</p>
                <p className="mt-1 text-sm">{formatDate(preview.createdAt)}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Dimensions</p>
                <p className="mt-1 text-sm">{preview.width && preview.height ? `${preview.width} × ${preview.height} px` : "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Usage</p>
                <p className="mt-1 text-sm">
                  <StatusBadge status={USAGE_MAP[preview.usage] ?? "neutral"} label={preview.usage} dot={false} /> · {preview.folder}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Linked post</p>
                <p className="mt-1 text-sm">
                  {preview.post ? (
                    <Link href={`/blog/${preview.post.slug}`} className="inline-flex items-center gap-1 hover:underline">
                      {preview.post.title}
                      <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>
                  ) : (
                    <span className="text-zinc-500">Not linked to a post</span>
                  )}
                </p>
              </div>
              <div className="sm:col-span-2">
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
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Alt text (accessibility & SEO)</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  value={editingAlt}
                  onChange={(e) => setEditingAlt(e.target.value)}
                  maxLength={200}
                  placeholder="Describe the image…"
                  className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                />
                <Button size="sm" onClick={handleAltSave}>
                  Save alt
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

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
