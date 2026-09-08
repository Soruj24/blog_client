"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Input } from "@/src/components/ui/Input";
import { Modal } from "@/src/components/ui/Modal";
import { Pagination } from "@/src/components/ui/Pagination";
import { Select } from "@/src/components/ui/Select";
import { Skeleton } from "@/src/components/ui/Skeleton";
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

const ROLE_MAP: Record<string, string> = {
  admin: "danger",
  editor: "info",
  author: "primary",
  reader: "neutral",
};

function UsersSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading users">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 !rounded-xl" />
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
    }
  };

  const runBulkActivate = async () => {
    try {
      await bulk({ ids: [...sel.selected], status: "active" }).unwrap();
      sel.clear();
    } catch {
      // handled by cache invalidation
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description={`${data?.total ?? 0} accounts total.`} />

      <FilterBar>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resetPage();
            setSearch(draft.trim());
          }}
          className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center"
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
          <Select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              resetPage();
            }}
            aria-label="Filter by role"
            className="h-9 sm:w-36"
            options={[
              { value: "", label: "All roles" },
              { value: "admin", label: "Admin" },
              { value: "editor", label: "Editor" },
              { value: "author", label: "Author" },
              { value: "reader", label: "Reader" },
            ]}
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              resetPage();
            }}
            aria-label="Filter by status"
            className="h-9 sm:w-36"
            options={[
              { value: "", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ]}
          />
          <Button type="submit" variant="secondary" size="sm" className="h-9">
            Search
          </Button>
        </form>
      </FilterBar>

      {isLoading ? (
        <UsersSkeleton />
      ) : isError || !data ? (
        <ErrorState title="Couldn't load users" onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState title="No users found" description="Try clearing search or filters." />
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
                <th scope="col" className="px-4 py-3">Joined</th>
                <th scope="col" className="w-12 px-4 py-3 text-right">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
              {data.items.map((u) => (
                <tr
                  key={u._id}
                  className="group transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/30"
                >
                  <td className="px-4 py-3.5">
                    <RowCheckbox
                      checked={sel.selected.has(u._id)}
                      onChange={() => sel.toggle(u._id)}
                      label={`Select ${u.name}`}
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{u.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={ROLE_MAP[u.role] ?? "neutral"} label={u.role} />
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge
                      status={u.status === "active" ? "success" : "danger"}
                      label={u.status}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-zinc-500 dark:text-zinc-400">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                      aria-label={`Edit ${u.name}`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
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
        <Button size="sm" variant="secondary" onClick={runBulkActivate}>
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
