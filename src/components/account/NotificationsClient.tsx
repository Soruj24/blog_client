"use client";

import { Bell, Bookmark, Check, Heart, MessageCircle, Send, UserPlus } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/src/components/ui/Avatar";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { Container } from "@/src/components/ui/Container";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Pagination } from "@/src/components/ui/Pagination";
import { SkeletonText } from "@/src/components/ui/Skeleton";
import { cx } from "@/src/components/ui/shared";
import { useNotificationSocket } from "@/src/hooks/useNotificationSocket";
import {
  useAnnounceNotificationMutation,
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  type AppNotification,
} from "@/src/store/api/contentApi";

function typeIcon(type: string) {
  if (type === "like") return Heart;
  if (type === "bookmark") return Bookmark;
  if (type === "comment" || type === "reply") return MessageCircle;
  if (type === "follow") return UserPlus;
  if (type === "publish") return Send;
  if (type === "approved") return Check;
  if (type === "system") return Bell;
  return Bell;
}

function typeLabel(type: string): string {
  if (type === "like") return "Liked";
  if (type === "bookmark") return "Bookmarked";
  if (type === "comment") return "Comment";
  if (type === "reply") return "Reply";
  if (type === "follow") return "Follow";
  if (type === "publish") return "Published";
  if (type === "approved") return "Approved";
  if (type === "system") return "Announcement";
  return type;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Inbox: unread-first list, mark-read on open, mark-all + admin announce. Real-time via socket, polling fallback. */
export function NotificationsClient() {
  useNotificationSocket();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const authed = status === "authenticated";
  const isAdmin = session?.user?.role === "admin";
  const { data, isLoading, isError, refetch } = useListNotificationsQuery(
    { page },
    { skip: !authed, pollingInterval: 30000 },
  );
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll, { isLoading: markingAll }] = useMarkAllNotificationsReadMutation();
  const [announce, { isLoading: announcing }] = useAnnounceNotificationMutation();
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");

  if (status === "loading") {
    return (
      <Container className="max-w-2xl py-10" aria-label="Loading notifications">
        <SkeletonText lines={5} />
      </Container>
    );
  }

  if (!authed) {
    return (
      <Container className="max-w-2xl py-10">
        <EmptyState
          icon={<Bell className="h-5 w-5" aria-hidden />}
          title="Sign in for notifications"
          description="Likes, replies, and new followers show up here once you're signed in."
          action={
            <Link href={`/login?callbackUrl=${encodeURIComponent("/notifications")}`}>
              <Button size="sm">Sign in</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  async function openNotification(n: AppNotification) {
    if (!n.isRead) {
      try {
        await markRead(n.id).unwrap();
      } catch {
        // Navigation still proceeds; badge syncs on next fetch.
      }
    }
    if (n.post) router.push(`/blog/${n.post.slug}`);
  }

  return (
    <Container className="max-w-2xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200/70 pb-5 dark:border-zinc-800/70">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            Inbox
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Notifications
          </h1>
        </div>
        {!!data && data.unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            loading={markingAll}
            onClick={() => void markAll().unwrap().catch(() => undefined)}
          >
            Mark all read
          </Button>
        )}
      </div>

      {isAdmin && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!annTitle.trim()) return;
            try {
              await announce({ title: annTitle.trim(), body: annBody.trim() || undefined }).unwrap();
              setAnnTitle("");
              setAnnBody("");
            } catch {
              // error shown via next fetch
            }
          }}
          className="mt-6 rounded-2xl border border-zinc-200/70 bg-zinc-50 p-5 dark:border-zinc-800/70 dark:bg-zinc-900/30"
        >
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Admin announcement</h2>
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">Broadcast a system notification to all users</p>
          <input
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
            placeholder="Title (required)"
            maxLength={140}
            className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm transition-colors placeholder:text-zinc-300 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
          />
          <textarea
            value={annBody}
            onChange={(e) => setAnnBody(e.target.value)}
            placeholder="Body (optional)"
            maxLength={300}
            rows={2}
            className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm transition-colors placeholder:text-zinc-300 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
          />
          <Button type="submit" size="sm" loading={announcing} disabled={!annTitle.trim()} className="mt-3">
            Send announcement
          </Button>
        </form>
      )}

      {isLoading ? (
        <div className="mt-6" aria-label="Loading notifications">
          <SkeletonText lines={5} />
        </div>
      ) : isError || !data ? (
        <div className="mt-6">
          <ErrorState
            title="Couldn't load notifications"
            description="Your inbox is temporarily unavailable."
            onRetry={() => void refetch()}
          />
        </div>
      ) : data.items.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            icon={<Bell className="h-5 w-5" aria-hidden />}
            title="You're all caught up"
            description="Likes on your stories, replies, and new followers will land here."
          />
        </div>
      ) : (
        <>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
            {data.unreadCount > 0
              ? `${data.unreadCount} unread of ${data.total}`
              : `${data.total} ${data.total === 1 ? "notification" : "notifications"}`}
          </p>
          <ul className="mt-4 space-y-2">
            {data.items.map((n) => {
              const Icon = typeIcon(n.type);
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => void openNotification(n)}
                    className={cx(
                      "flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition-all",
                      n.isRead
                        ? "border-zinc-200/70 hover:border-zinc-300/70 dark:border-zinc-800/70 dark:hover:border-zinc-700/70"
                        : "border-zinc-900/15 bg-zinc-50 hover:border-zinc-900/25 dark:border-zinc-100/15 dark:bg-zinc-900/50 dark:hover:border-zinc-100/25",
                      n.post ? "hover:shadow-sm" : "",
                    )}
                  >
                    {n.actor ? (
                      <Avatar name={n.actor.name} src={n.actor.avatarUrl} size="md" />
                    ) : (
                      <span
                        aria-hidden
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        {!n.isRead && (
                          <span aria-label="Unread" className="h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                        )}
                        <span className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{n.title}</span>
                        <Badge tone="neutral" className="text-xs">{typeLabel(n.type)}</Badge>
                      </span>
                      {n.body && (
                        <span className="mt-1 block truncate text-sm text-zinc-500 dark:text-zinc-400">
                          {n.body}
                        </span>
                      )}
                      <span className="mt-1.5 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                        <span>{formatDate(n.createdAt)}</span>
                        {n.post && <Badge tone="neutral">{n.post.title.slice(0, 40)}</Badge>}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </>
      )}
    </Container>
  );
}
