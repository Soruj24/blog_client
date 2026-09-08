"use client";

import { Pencil, Plus, Trash } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Input } from "@/src/components/ui/Input";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Modal } from "@/src/components/ui/Modal";
import { Textarea } from "@/src/components/ui/Textarea";
import { cx, focusRing } from "@/src/components/ui/shared";
import { PageHeader, StatusBadge } from "./shared";

export type FieldType = "text" | "textarea" | "color" | "number" | "checkbox";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}

export type FormValues = Record<string, string | number | boolean>;

export interface ManagedItem {
  _id: string;
  name: string;
  slug: string;
  postCount: number;
}

interface TaxonomyManagerProps<T extends ManagedItem> {
  title: string;
  description: string;
  noun: string;
  items: T[] | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  fields: FieldDef[];
  defaults: FormValues;
  extraColumns?: (item: T) => ReactNode;
  extraHeaders?: ReactNode;
  onCreate: (values: FormValues) => Promise<unknown>;
  onUpdate: (id: string, values: FormValues) => Promise<unknown>;
  renderDeleteDialog: (item: T, onClose: () => void) => ReactNode;
}

function fieldValue(values: FormValues, key: string, fallback: string | number | boolean = "") {
  return values[key] ?? fallback;
}

function TaxonomySkeleton({ noun }: { noun: string }) {
  return (
    <div className="space-y-3" aria-label={`Loading ${noun}s`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 !rounded-xl" />
      ))}
    </div>
  );
}

/** Shared CRUD shell for taxonomy admin: table + create/edit modal. */
export function TaxonomyManager<T extends ManagedItem>({
  title,
  description,
  noun,
  items,
  isLoading,
  isError,
  refetch,
  fields,
  defaults,
  extraColumns,
  extraHeaders,
  onCreate,
  onUpdate,
  renderDeleteDialog,
}: TaxonomyManagerProps<T>) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [values, setValues] = useState<FormValues>(defaults);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);
  const formId = useId();

  const openCreate = () => {
    setEditing(null);
    setValues({ ...defaults });
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (item: T) => {
    setEditing(item);
    const next: FormValues = { ...defaults };
    for (const f of fields) {
      const v = (item as unknown as Record<string, unknown>)[f.key];
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
        next[f.key] = v;
      }
    }
    setValues(next);
    setFormError(null);
    setFormOpen(true);
  };

  const set = (key: string, v: string | number | boolean) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    for (const f of fields) {
      if (f.required && String(values[f.key] ?? "").trim() === "") {
        setFormError(`${f.label} is required.`);
        return;
      }
    }
    const payload: FormValues = { ...values };
    if (typeof payload["slug"] === "string" && payload["slug"].trim() === "") {
      delete payload["slug"];
    }
    setSaving(true);
    try {
      if (editing) await onUpdate(editing._id, payload);
      else await onCreate(payload);
      setFormOpen(false);
    } catch (err) {
      setFormError(
        (err as { data?: { message?: string } })?.data?.message ?? `Couldn't save this ${noun}.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const renderField = (f: FieldDef) => {
    const common = {
      label: f.label,
      placeholder: f.placeholder,
      hint: f.hint,
      required: f.required,
    };
    if (f.type === "textarea") {
      return (
        <Textarea
          key={f.key}
          {...common}
          rows={3}
          value={String(fieldValue(values, f.key))}
          onChange={(e) => set(f.key, e.target.value)}
        />
      );
    }
    if (f.type === "number") {
      return (
        <Input
          key={f.key}
          {...common}
          type="number"
          min={0}
          value={Number(fieldValue(values, f.key, 0))}
          onChange={(e) => set(f.key, Number(e.target.value))}
        />
      );
    }
    if (f.type === "checkbox") {
      return (
        <label key={f.key} className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            checked={Boolean(fieldValue(values, f.key, false))}
            onChange={(e) => set(f.key, e.target.checked)}
            className="h-4 w-4 rounded accent-zinc-900 dark:accent-zinc-100"
          />
          {f.label}
        </label>
      );
    }
    if (f.type === "color") {
      return (
        <div key={f.key}>
          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {f.label}
          </span>
          <span className="flex items-center gap-3">
            <input
              type="color"
              aria-label={`${f.label} color picker`}
              value={String(fieldValue(values, f.key, "#71717a"))}
              onChange={(e) => set(f.key, e.target.value)}
              className={cx(
                "h-9 w-14 cursor-pointer rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950",
                focusRing,
              )}
            />
            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {String(fieldValue(values, f.key, "#71717a"))}
            </span>
          </span>
        </div>
      );
    }
    return (
      <Input
        key={f.key}
        {...common}
        value={String(fieldValue(values, f.key))}
        onChange={(e) => set(f.key, e.target.value)}
      />
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden />
            New {noun}
          </Button>
        }
      />

      {isLoading ? (
        <TaxonomySkeleton noun={noun} />
      ) : isError || !items ? (
        <ErrorState title={`Couldn't load ${noun}s`} onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          title={`No ${noun}s yet`}
          description={`Create the first ${noun} to start organizing stories.`}
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              New {noun}
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800/60 dark:bg-zinc-950">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800/70 dark:bg-zinc-900/40 dark:text-zinc-500">
                <th scope="col" className="px-4 py-3">Name</th>
                {extraHeaders}
                <th scope="col" className="px-4 py-3 text-center">Posts</th>
                <th scope="col" className="w-24 px-4 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
              {items.map((item) => (
                <tr
                  key={item._id}
                  className="group transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30"
                >
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                      /{item.slug}
                    </p>
                  </td>
                  {extraColumns?.(item)}
                  <td className="px-4 py-3.5 text-center">
                    <StatusBadge
                      status={item.postCount > 0 ? "primary" : "neutral"}
                      label={String(item.postCount)}
                      dot={false}
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="flex justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        aria-label={`Edit ${item.name}`}
                        className={cx(
                          "inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                          focusRing,
                        )}
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(item)}
                        aria-label={`Delete ${item.name}`}
                        className={cx(
                          "inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-950/40 dark:hover:text-red-400",
                          focusRing,
                        )}
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

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit ${noun}` : `New ${noun}`}
        description={
          editing
            ? "Renaming keeps the existing URL unless you set a slug explicitly."
            : "The URL slug is generated automatically unless you set one."
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={formId} loading={saving}>
              {editing ? "Save changes" : `Create ${noun}`}
            </Button>
          </>
        }
      >
        <form
          id={formId}
          onSubmit={(e) => {
            e.preventDefault();
            void submit(e);
          }}
          className="space-y-4"
        >
          {fields.map(renderField)}
          {formError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}
        </form>
      </Modal>

      {deleting && renderDeleteDialog(deleting, () => setDeleting(null))}
    </div>
  );
}
