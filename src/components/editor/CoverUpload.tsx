"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, LoaderCircle, X, Upload } from "lucide-react";
import { getSession } from "next-auth/react";
import { Button } from "@/src/components/ui/Button";

export function CoverUpload({
  value,
  onChange,
  onRemove,
}: {
  value: string | null;
  onChange: (url: string) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const session = await getSession();
      const token = (session as unknown as { backendToken?: string })?.backendToken;
      if (!token) throw new Error("You must be signed in to upload");

      const form = new FormData();
      form.append("image", file);
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
      const data = (await res.json()) as { success: boolean; data: { url: string } };
      onChange(data.data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      void handleFile(file);
    }
  };

  return (
    <div>
      {value ? (
        <div className="group relative overflow-hidden rounded-xl border border-zinc-200/70 focus-within:border-zinc-400 dark:border-zinc-800/70 dark:focus-within:border-zinc-600">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Cover preview" className="h-48 w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 transition-colors group-hover:bg-black/40 group-focus-within:bg-black/40">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-white/90 px-3 text-sm font-medium text-zinc-900 opacity-0 backdrop-blur transition-all outline-none hover:bg-white focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-white group-hover:opacity-100"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden />
              Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/90 text-zinc-900 opacity-0 backdrop-blur transition-all outline-none hover:bg-white focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-white group-hover:opacity-100"
              aria-label="Remove cover image"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload cover image. Drop an image or press Enter to browse."
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center outline-none transition-all duration-200 focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-900/10 dark:focus-visible:border-zinc-600 dark:focus-visible:ring-zinc-100/10 ${
            dragOver
              ? "border-violet-400 bg-violet-50/50 dark:border-violet-500 dark:bg-violet-950/20"
              : "border-zinc-200 bg-zinc-50/50 hover:border-zinc-300 hover:bg-zinc-100/50 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-zinc-700"
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
            <ImageIcon className="h-5 w-5 text-zinc-400" />
          </div>
          <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {uploading ? "Uploading…" : "Drop image or click to upload"}
          </p>
          <p className="mt-1 text-xs text-zinc-400">1200×800 recommended · up to 5MB</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
