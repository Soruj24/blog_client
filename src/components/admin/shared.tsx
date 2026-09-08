"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { cx, focusRing } from "@/src/components/ui/shared";

/* ------------------------------------------------------------------ */
/*  PageHeader                                                         */
/* ------------------------------------------------------------------ */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ConfirmDialog                                                      */
/* ------------------------------------------------------------------ */

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "danger",
  loading = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title=""
      description=""
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={variant === "danger" ? "danger" : "secondary"} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
        <div
          className={cx(
            "flex h-10 w-10 items-center justify-center rounded-full",
            variant === "danger"
              ? "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
              : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
          )}
        >
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </div>
        <h3 className="mt-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  BulkBar                                                            */
/* ------------------------------------------------------------------ */

export function BulkBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="sticky bottom-4 z-30 mx-auto flex w-fit max-w-[calc(100vw-2rem)] flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-3 shadow-xl shadow-zinc-900/5 sm:flex-row sm:gap-4 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-zinc-950/20"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-zinc-900 px-2 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
          {count}
        </span>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {count === 1 ? "item" : "items"} selected
        </span>
      </div>
      <span className="hidden h-5 w-px bg-zinc-200 sm:block dark:bg-zinc-700" aria-hidden />
      <div className="flex flex-wrap items-center gap-1.5">{children}</div>
      <button
        type="button"
        onClick={onClear}
        className={cx(
          "rounded-lg px-2.5 py-1 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
          focusRing,
        )}
      >
        Clear
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  useSelection                                                       */
/* ------------------------------------------------------------------ */

export function useSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  return {
    selected,
    toggle: (id: string) =>
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    toggleAll: (ids: string[]) =>
      setSelected((prev) => {
        const all = ids.length > 0 && ids.every((id) => prev.has(id));
        if (all) return new Set();
        return new Set(ids);
      }),
    clear: () => setSelected(new Set()),
    count: selected.size,
  };
}

/* ------------------------------------------------------------------ */
/*  RowCheckbox                                                        */
/* ------------------------------------------------------------------ */

export function RowCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className={cx(
        "h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-2 focus:ring-zinc-400 focus:ring-offset-0 dark:border-zinc-600 dark:text-zinc-100 dark:focus:ring-zinc-500",
        "accent-zinc-900 dark:accent-zinc-100",
      )}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  compact                                                            */
/* ------------------------------------------------------------------ */

export function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

/* ------------------------------------------------------------------ */
/*  formatDate                                                         */
/* ------------------------------------------------------------------ */

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  StatCard — reusable dashboard stat                                 */
/* ------------------------------------------------------------------ */

export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  accent?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-200/60 bg-white p-5 transition-all duration-200 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-900/5 dark:border-zinc-800/60 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:shadow-zinc-950/20">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {label}
          </p>
          <p
            className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 tabular-nums dark:text-zinc-50"
            aria-live="polite"
          >
            {typeof value === "number" ? compact(value) : value}
          </p>
        </div>
        {Icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: accent ? `${accent}12` : undefined, color: accent }}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FilterBar — consistent filter/form wrapper                         */
/* ------------------------------------------------------------------ */

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/60 bg-white p-4 dark:border-zinc-800/60 dark:bg-zinc-950 sm:flex-row sm:items-center">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StatusBadge — consistent status indicator                          */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  danger: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  neutral: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export function StatusBadge({
  status,
  label,
  dot = true,
}: {
  status: string;
  label?: string;
  dot?: boolean;
}) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.neutral;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        style,
      )}
    >
      {dot && (
        <span
          className={cx(
            "h-1.5 w-1.5 rounded-full",
            status === "success" && "bg-emerald-500",
            status === "warning" && "bg-amber-500",
            status === "danger" && "bg-red-500",
            status === "info" && "bg-blue-500",
            status === "neutral" && "bg-zinc-400",
          )}
        />
      )}
      {label ?? status}
    </span>
  );
}
