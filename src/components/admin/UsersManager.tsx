"use client";

import { useState } from "react";
import { Pencil, Search } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Pagination } from "@/src/components/ui/Pagination";
import { Select } from "@/src/components/ui/Select";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { useToast } from "@/src/components/ui/Toast";
import { useAdminUsersQuery, useBulkUsersMutation, useUpdateUserMutation, type AdminUser } from "@/src/store/api/adminApi";
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

/* Only the privileged role gets visual weight — red would read as an error. */
const ROLE_MAP: Record<string, "primary" | "neutral"> = {
  admin: "primary",
  editor: "neutral",
  author: "neutral",
  reader: "neutral",
};

const ROLE_OPTIONS = [
  { value: "", label: "All roles" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "author", label: "Author" },
  { value: "reader", label: "Reader" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

function UsersSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-label="Loading users">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}

/** User administration: filters, role/status editing, bulk suspend. */
export function UsersManager() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const { data, isLoading, isError, refetch } = useAdminUsersQuery({
    page,
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(search ? { search } : {}),
  });
  const [updateUser, { isLoading: saving }] = useUpdateUserMutation();
  const [bulk, { isLoading: bulking }] = useBulkUsersMutation();
  const { toast } = useToast();
  const sel = useSelection();

  const rowIds = data?.items.map((u) => u._id) ?? [];
  const resetPage = () => {
    setPage(1);
    sel.clear();
  };

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setEditRole(u.role);
    setEditStatus(u.status);
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setEditError(null);
    try {
      await updateUser({ id: editing._id, role: editRole, status: editStatus }).unwrap();
      setEditing(null);
    } catch (e) {
      setEditError(
        (e as { data?: { message?: string } })?.data?.message ?? "Couldn't save user.",
      );
    }
  };

  const runBulkSuspend = async () => {
    try {
      await bulk({ ids: [...sel.selected], status: "suspended" }).unwrap();
      sel.clear();
      setConfirmSuspend(false);
    } catch {
      setConfirmSuspend(false);
      toast("Couldn't suspend users — please try again.", { tone: "error" });
    }
  };

  const runBulkActivate = async () => {
    try {
      await bulk({ ids: [...sel.selected], status: "active" }).unwrap();
      sel.clear();
    } catch {
      toast("Couldn't activate users — please try again.", { tone: "error" });
    }
  };

  const clearFilters = () => {
    setDraft("");
    setSearch("");
    setRole("");
    setStatus("");
    resetPage();
  };

  const hasFilters = search !== "" || role !== "" || status !== "";
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description={`${data?.total ?? 0} ${data?.total === 1 ? "account" : "accounts"} total.`} />

      <FilterBar>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resetPage();
            setSearch(draft.trim());
          }}
          role="search"
          aria-label="Filter users"
          className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            />
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search name or email…"
              aria-label="Search users"
              className="h-9 pl-9"
            />
          </div>
          <div className="flex gap-2.5">
            <div className="flex-1 sm:w-36 sm:flex-none">
              <Select
                size="sm"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  resetPage();
                }}
                aria-label="Filter by role"
                options={ROLE_OPTIONS}
              />
            </div>
            <div className="flex-1 sm:w-40 sm:flex-none">
              <Select
                size="sm"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  resetPage();
                }}
                aria-label="Filter by status"
                options={STATUS_OPTIONS}
              />
            </div>
          </div>
          <div className="flex gap-2.5">
            <Button type="submit" variant="secondary" size="sm" className="h-9 flex-1 sm:flex-none">
              Search
            </Button>
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 flex-1 sm:flex-none"
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
          </div>
        </form>
      </FilterBar>

      {data && (
        <p aria-live="polite" className="-mb-3 text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
          {data.total === 0
            ? "No accounts"
            : `${data.total} ${data.total === 1 ? "account" : "accounts"}`}
          {(role || status) && data.total > 0 && (
            <span>
              {" · "}
              {[role, status].filter(Boolean).join(" · ")}
            </span>
          )}
        </p>
      )}

      {isLoading ? (
        <UsersSkeleton />
      ) : isError || !data ? (
        <ErrorState title="Couldn't load users" onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState
          title="No users found"
          description={hasFilters ? "No accounts match this search or filter." : "New registrations will appear here."}
          action={
            hasFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Clear search & filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-800/60 dark:bg-zinc-950">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800/70 dark:bg-zinc-900/40 dark:text-zinc-500">
                <th scope="col" className="w-12 px-4 py-3">
                  <RowCheckbox
                    checked={rowIds.length > 0 && rowIds.every((id) => sel.selected.has(id))}
                    onChange={() => sel.toggleAll(rowIds)}
                    label="Select all users"
                  />
                </th>
                <th scope="col" className="px-4 py-3">User</th>
                <th scope="col" className="px-4 py-3">Role</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="hidden px-4 py-3 sm:table-cell">Joined</th>
                <th scope="col" className="w-12 px-4 py-3 text-right">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
              {data.items.map((u) => (
                <tr
                  key={u._id}
                  className="group transition-colors hover:bg-zinc-50/80 focus-within:bg-zinc-50/80 dark:hover:bg-zinc-900/30 dark:focus-within:bg-zinc-900/30"
                >
                  <td className="px-4 py-3.5">
                    <RowCheckbox
                      checked={sel.selected.has(u._id)}
                      onChange={() => sel.toggle(u._id)}
                      label={`Select ${u.name}`}
                    />
                  </td>
                  <td className="max-w-56 px-4 py-3.5">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-100" title={u.name}>{u.name}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400" title={u.email}>{u.email}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <StatusBadge status={ROLE_MAP[u.role] ?? "neutral"} label={u.role} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <StatusBadge
                      status={u.status === "active" ? "success" : "danger"}
                      label={u.status}
                    />
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3.5 tabular-nums text-zinc-500 sm:table-cell dark:text-zinc-400">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 opacity-100 outline-none transition-colors hover:bg-zinc-100 hover:text-zinc-900 active:bg-zinc-200 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-zinc-900 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:active:bg-zinc-700 dark:focus-visible:outline-zinc-100"
                      aria-label={`Edit ${u.name}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

      <BulkBar count={sel.count} onClear={sel.clear}>
        <Button size="sm" variant="secondary" loading={bulking} onClick={runBulkActivate}>
          Activate
        </Button>
        <Button size="sm" variant="danger" onClick={() => setConfirmSuspend(true)}>
          Suspend
        </Button>
      </BulkBar>

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.name ?? ""}`}
        description="Change role or account status. Changes take effect immediately."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={() => void saveEdit()}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Role"
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            options={[
              { value: "reader", label: "Reader" },
              { value: "author", label: "Author" },
              { value: "editor", label: "Editor" },
              { value: "admin", label: "Admin" },
            ]}
          />
          <Select
            label="Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            options={[
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ]}
          />
          {editError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {editError}
            </p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmSuspend}
        title={`Suspend ${sel.count} ${sel.count === 1 ? "user" : "users"}?`}
        description="Suspended users cannot sign in. They can be reactivated from this page."
        confirmLabel="Suspend"
        loading={bulking}
        onClose={() => setConfirmSuspend(false)}
        onConfirm={() => void runBulkSuspend()}
      />
    </div>
  );
}
