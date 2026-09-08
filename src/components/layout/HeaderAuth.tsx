"use client";

import { Bell, LogOut, SquarePen } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar } from "@/src/components/ui/Avatar";
import { Dropdown, DropdownItem, DropdownLinkItem } from "@/src/components/ui/Dropdown";
import { useListNotificationsQuery } from "@/src/store/api/contentApi";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { cx, focusRing } from "@/src/components/ui/shared";
import { WRITE_LINK, getUserMenuItems } from "@/src/config/navigation";
import { useNotificationSocket } from "@/src/hooks/useNotificationSocket";

/**
 * Session-aware header actions with proper loading state.
 * - loading: skeleton avatar + button (no layout shift, no flash)
 * - guest: Sign in + Get started
 * - user: Write, notifications bell, avatar dropdown menu
 */
export function HeaderAuth() {
  useNotificationSocket();
  const { data: session, status } = useSession();
  const { data: inbox } = useListNotificationsQuery(
    {},
    { skip: status !== "authenticated", pollingInterval: 30000 },
  );

  if (status === "loading") {
    return (
      <span className="flex items-center gap-2" aria-label="Loading account">
        <Skeleton className="hidden h-9 w-20 !rounded-full sm:block" />
        <Skeleton className="h-9 w-9 !rounded-full" />
      </span>
    );
  }

  if (!session?.user) {
    return (
      <span className="flex items-center gap-1.5">
        <Link
          href="/login"
          className={cx(
            "hidden rounded-full px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 sm:inline-flex dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
            focusRing,
          )}
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className={cx(
            "inline-flex h-8 items-center rounded-full bg-zinc-900 px-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 sm:hidden dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200",
            focusRing,
          )}
        >
          Join
        </Link>
        <Link
          href="/register"
          className={cx(
            "hidden rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 sm:inline-flex dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200",
            focusRing,
          )}
        >
          Get started
        </Link>
      </span>
    );
  }

  const user = session.user;
  const displayName = user.name ?? user.username ?? user.email ?? "Account";

  return (
    <span className="flex items-center gap-1 sm:gap-1.5">
      <Link
        href={WRITE_LINK.href}
        className={cx(
          "hidden items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 sm:inline-flex dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200",
          focusRing,
        )}
      >
        <SquarePen className="h-4 w-4" aria-hidden />
        Write
      </Link>
      <Tooltip content="Notifications" side="bottom">
        <Link
          href="/notifications"
          aria-label={
            inbox && inbox.unreadCount > 0
              ? `Notifications, ${inbox.unreadCount} unread`
              : "Notifications"
          }
          className={cx(
            "relative inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
            focusRing,
          )}
        >
          <Bell className="h-5 w-5" aria-hidden />
          {!!inbox && inbox.unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-zinc-950"
            />
          )}
        </Link>
      </Tooltip>
      <Dropdown
        label="Account menu"
        trigger={
          <button
            type="button"
            aria-label={`Account menu for ${displayName}`}
            className={cx("rounded-full", focusRing)}
          >
            <Avatar name={displayName} src={user.image} size="sm" />
          </button>
        }
      >
        <div className="border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800/70">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          {user.username && (
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              @{user.username}
            </p>
          )}
        </div>
        {getUserMenuItems(user.role).map((item) => (
          <DropdownLinkItem
            key={item.href}
            href={item.href}
            label={item.label}
            icon={<item.icon className="h-4 w-4" aria-hidden />}
          />
        ))}
        <div className="mt-1.5 border-t border-zinc-200/70 pt-1.5 dark:border-zinc-800/70">
          <DropdownItem
            label="Log out"
            icon={<LogOut className="h-4 w-4" aria-hidden />}
            onClick={() => signOut({ callbackUrl: "/" })}
          />
        </div>
      </Dropdown>
    </span>
  );
}
