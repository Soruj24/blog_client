"use client";

import { Check, Flag, Heart, MessageCircle, Pencil, Reply, ShieldAlert, Trash, X } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/src/components/ui/Avatar";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Modal } from "@/src/components/ui/Modal";
import { Pagination } from "@/src/components/ui/Pagination";
import { SkeletonText } from "@/src/components/ui/Skeleton";
import { Textarea } from "@/src/components/ui/Textarea";
import { cx, focusRing } from "@/src/components/ui/shared";
import {
  useAddCommentMutation,
  useDeleteCommentMutation,
  useListCommentsQuery,
  useModerateCommentMutation,
  useReportCommentMutation,
  useToggleCommentLikeMutation,
  useUpdateCommentMutation,
  type ModerationStatus,
  type PostComment,
  type ReportReason,
} from "@/src/store/api/contentApi";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const REPORT_REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: "spam", label: "Spam or scam" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate-speech", label: "Hate speech" },
  { value: "misinformation", label: "Misinformation" },
  { value: "other", label: "Something else" },
];

const actionBtn = cx(
  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50",
  focusRing,
);
const mutedAction = "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100";
const dangerAction = "text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400";

function StatusChip({ status }: { status: string }) {
  if (status === "approved") return null;
  const tone =
    status === "pending" ? "warning" : status === "spam" ? "danger" : "neutral";
  const label =
    status === "pending" ? "Pending review" : status === "spam" ? "Marked spam" : "Rejected";
  return <Badge tone={tone as "warning" | "danger" | "neutral"}>{label}</Badge>;
}

function CommentItem({
  comment,
  slug,
  depth,
  currentUserId,
  isModerator,
  onReply,
}: {
  comment: PostComment;
  slug: string;
  depth: number;
  currentUserId: string | null;
  isModerator: boolean;
  onReply: (target: { id: string; name: string }) => void;
}) {
  const authed = currentUserId !== null;
  const own = comment.authorId !== null && comment.authorId === currentUserId;
  const name = comment.author?.name ?? "Deleted user";

  const [like, { isLoading: liking }] = useToggleCommentLikeMutation();
  const [saveEdit, { isLoading: saving }] = useUpdateCommentMutation();
  const [remove, { isLoading: deleting }] = useDeleteCommentMutation();
  const [report, { isLoading: reporting }] = useReportCommentMutation();
  const [moderate, { isLoading: moderating }] = useModerateCommentMutation();

  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(comment.content);
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [reportError, setReportError] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  const submitEdit = async () => {
    const content = editDraft.trim();
    if (!content) {
      setEditError("Comment cannot be empty.");
      return;
    }
    setEditError(null);
    try {
      await saveEdit({ slug, id: comment.id, content }).unwrap();
      setEditing(false);
    } catch {
      setEditError("Couldn't save — try again.");
    }
  };

  const submitDelete = async () => {
    try {
      await remove({ slug, id: comment.id }).unwrap();
      setConfirmDelete(false);
    } catch {
      setConfirmDelete(false);
    }
  };

  const submitReport = async () => {
    setReportError(null);
    try {
      await report({ slug, id: comment.id, reason }).unwrap();
      setReported(true);
      setReportOpen(false);
    } catch (e) {
      setReportError(
        (e as { data?: { message?: string } })?.data?.message ?? "Couldn't send report.",
      );
    }
  };

  const submitModerate = async (status: ModerationStatus) => {
    try {
      await moderate({ slug, id: comment.id, status }).unwrap();
    } catch {
      // list refetch on next invalidation; no local error surface needed
    }
  };

  return (
    <div className="flex gap-3">
      <Avatar name={name} src={comment.author?.avatarUrl} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="font-semibold">{name}</span>
          {comment.author?.username && (
            <span className="text-zinc-500 dark:text-zinc-400">@{comment.author.username}</span>
          )}
          {comment.createdAt && (
            <time dateTime={comment.createdAt} className="text-zinc-500 dark:text-zinc-400">
              {formatDate(comment.createdAt)}
            </time>
          )}
          {comment.isEdited && (
            <span className="text-xs italic text-zinc-400 dark:text-zinc-500">(edited)</span>
          )}
          <StatusChip status={comment.status} />
        </p>

        {editing ? (
          <div className="mt-2">
            <Textarea
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              rows={3}
              maxLength={2000}
              aria-label="Edit your comment"
              error={editError ?? undefined}
            />
            <div className="mt-2 flex gap-2">
              <Button size="sm" loading={saving} onClick={() => void submitEdit()}>
                Save
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setEditing(false);
                  setEditDraft(comment.content);
                  setEditError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-[15px] leading-relaxed">{comment.content}</p>
        )}

        {!comment.isDeleted && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {authed && (
              <button
                type="button"
                disabled={liking}
                onClick={() => void like({ slug, id: comment.id }).unwrap().catch(() => undefined)}
                aria-pressed={comment.liked}
                aria-label={comment.liked ? "Unlike comment" : "Like comment"}
                className={cx(actionBtn, comment.liked ? "text-red-600 dark:text-red-400" : mutedAction)}
              >
                <Heart
                  className="h-3.5 w-3.5"
                  aria-hidden
                  fill={comment.liked ? "currentColor" : "none"}
                />
                {comment.likeCount > 0 && <span aria-live="polite">{comment.likeCount}</span>}
              </button>
            )}
            {authed && depth === 0 && comment.author && (
              <button
                type="button"
                onClick={() => onReply({ id: comment.id, name: comment.author?.name ?? "author" })}
                className={cx(actionBtn, mutedAction)}
              >
                <Reply className="h-3.5 w-3.5" aria-hidden />
                Reply
              </button>
            )}
            {own && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    setEditDraft(comment.content);
                  }}
                  className={cx(actionBtn, mutedAction)}
                  aria-label="Edit your comment"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                  Edit
                </button>
                {confirmDelete ? (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {comment.replyCount > 0 ? "Delete (keeps replies as removed)?" : "Delete?"}
                    </span>
                    <button
                      type="button"
                      disabled={deleting}
                      onClick={() => void submitDelete()}
                      className={cx(actionBtn, "font-semibold text-red-600 dark:text-red-400")}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className={cx(actionBtn, mutedAction)}
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className={cx(actionBtn, dangerAction)}
                    aria-label="Delete your comment"
                  >
                    <Trash className="h-3.5 w-3.5" aria-hidden />
                    Delete
                  </button>
                )}
              </>
            )}
            {authed && !own && isModerator && (
              <button
                type="button"
                onClick={() => void submitDelete()}
                disabled={deleting}
                className={cx(actionBtn, dangerAction)}
                aria-label="Delete comment (moderator)"
              >
                <Trash className="h-3.5 w-3.5" aria-hidden />
                Delete
              </button>
            )}
            {authed && !own && !isModerator && !comment.isDeleted && (
              <button
                type="button"
                onClick={() => {
                  setReported(false);
                  setReportError(null);
                  setReportOpen(true);
                }}
                className={cx(actionBtn, mutedAction)}
                aria-label="Report comment"
              >
                <Flag className="h-3.5 w-3.5" aria-hidden />
                {reported ? "Reported" : "Report"}
              </button>
            )}
          </div>
        )}

        {isModerator && !comment.isDeleted && (
          <div className="mt-2 flex flex-wrap items-center gap-1 rounded-xl bg-amber-50 p-1.5 dark:bg-amber-950/30">
            <span className="inline-flex items-center gap-1 px-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
              Mod
            </span>
            {comment.status !== "approved" && (
              <button
                type="button"
                disabled={moderating}
                onClick={() => void submitModerate("approved")}
                className={cx(actionBtn, "text-emerald-700 dark:text-emerald-300")}
              >
                <Check className="h-3.5 w-3.5" aria-hidden />
                Approve
              </button>
            )}
            {comment.status !== "rejected" && (
              <button
                type="button"
                disabled={moderating}
                onClick={() => void submitModerate("rejected")}
                className={cx(actionBtn, mutedAction)}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Reject
              </button>
            )}
            {comment.status !== "spam" && (
              <button
                type="button"
                disabled={moderating}
                onClick={() => void submitModerate("spam")}
                className={cx(actionBtn, dangerAction)}
              >
                <Flag className="h-3.5 w-3.5" aria-hidden />
                Spam
              </button>
            )}
          </div>
        )}

        {comment.replies.length > 0 && (
          <ul className="mt-3 space-y-4 border-l-2 border-zinc-200 pl-4 dark:border-zinc-800">
            {comment.replies.map((reply) => (
              <li key={reply.id}>
                <CommentItem
                  comment={reply}
                  slug={slug}
                  depth={depth + 1}
                  currentUserId={currentUserId}
                  isModerator={isModerator}
                  onReply={onReply}
                />
              </li>
            ))}
          </ul>
        )}

        <Modal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          title="Report comment"
          description="Reports are anonymous to other users. Three reports queue a comment for review."
          footer={
            <>
              <Button variant="secondary" onClick={() => setReportOpen(false)}>
                Cancel
              </Button>
              <Button loading={reporting} onClick={() => void submitReport()}>
                Send report
              </Button>
            </>
          }
        >
          <div role="radiogroup" aria-label="Report reason" className="space-y-1">
            {REPORT_REASONS.map((r) => (
              <label
                key={r.value}
                className={cx(
                  "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors",
                  reason === r.value
                    ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                    : "border-zinc-200 dark:border-zinc-800",
                  focusRing,
                )}
              >
                <input
                  type="radio"
                  name="report-reason"
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="h-4 w-4 accent-zinc-900 dark:accent-zinc-100"
                />
                {r.label}
              </label>
            ))}
          </div>
          {reportError && (
            <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
              {reportError}
            </p>
          )}
        </Modal>
      </div>
    </div>
  );
}

/**
 * Discussion thread: paginated top-level comments (oldest first) with
 * nested one-level replies, edit/delete/report/likes, and a moderator
 * review queue. Counts stay consistent via tag invalidation.
 */
export function CommentsSection({ slug }: { slug: string }) {
  const { data: session, status } = useSession();
  const currentUserId = session?.user?.id ?? null;
  const isModerator = session?.user?.role === "admin" || session?.user?.role === "editor";
  const [page, setPage] = useState(1);
  const [queueOpen, setQueueOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useListCommentsQuery({
    slug,
    page,
    ...(queueOpen && isModerator ? { filter: "pending" as const } : {}),
  });
  const [addComment, { isLoading: posting }] = useAddCommentMutation();
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) {
      setFormError("Write something first.");
      return;
    }
    setFormError(null);
    try {
      await addComment({ slug, content, parent: replyTo?.id }).unwrap();
      setDraft("");
      setReplyTo(null);
      if (page !== 1) setPage(1);
    } catch {
      setFormError("Couldn't post your comment — try again.");
    }
  };

  return (
    <section aria-labelledby="comments-heading" className="mt-14">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="comments-heading" className="headline flex items-center gap-2 text-2xl text-zinc-900 dark:text-zinc-100">
          <MessageCircle className="h-5 w-5" aria-hidden />
          Discussion
          {data && data.total > 0 && (
            <span className="text-base font-normal text-zinc-500 dark:text-zinc-400">
              ({data.total})
            </span>
          )}
        </h2>
        {isModerator && (data?.pendingCount ?? 0) > 0 && (
          <Button
            size="sm"
            variant={queueOpen ? "primary" : "secondary"}
            onClick={() => {
              setQueueOpen((v) => !v);
              setPage(1);
            }}
            aria-pressed={queueOpen}
          >
            <ShieldAlert className="h-4 w-4" aria-hidden />
            Review queue ({data?.pendingCount ?? 0})
          </Button>
        )}
      </div>

      {status === "authenticated" ? (
        <form onSubmit={submit} className="mt-5">
          <div className="flex gap-3">
            <Avatar
              name={session?.user?.name ?? session?.user?.email ?? "You"}
              src={session?.user?.image}
              size="sm"
            />
            <div className="flex-1">
              {replyTo && (
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium dark:bg-zinc-900">
                  Replying to {replyTo.name}
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    aria-label="Cancel reply"
                    className={cx("rounded-full", focusRing)}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </p>
              )}
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder={replyTo ? `Reply to ${replyTo.name}…` : "Share your thoughts…"}
                aria-label={replyTo ? `Reply to ${replyTo.name}` : "Write a comment"}
                error={formError ?? undefined}
              />
              <div className="mt-2 flex justify-end">
                <Button type="submit" size="sm" loading={posting}>
                  {replyTo ? "Post reply" : "Post comment"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        status !== "loading" && (
          <p className="mt-5 rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-900 dark:text-zinc-400">
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/blog/${slug}`)}`}
              className="font-semibold text-zinc-900 underline underline-offset-2 dark:text-zinc-100"
            >
              Sign in
            </Link>{" "}
            to join the discussion.
          </p>
        )
      )}

      <div className="mt-6" aria-live="polite">
        {isLoading ? (
          <div aria-label="Loading comments">
            <SkeletonText lines={5} />
          </div>
        ) : isError || !data ? (
          <ErrorState
            title="Couldn't load comments"
            description="The discussion is temporarily unavailable."
            onRetry={() => void refetch()}
          />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="h-5 w-5" aria-hidden />}
            title={queueOpen ? "Queue is clear" : "No comments yet"}
            description={
              queueOpen
                ? "Nothing awaiting review."
                : "Start the conversation — thoughtful replies welcome."
            }
          />
        ) : (
          <>
            <ul className="space-y-6">
              {data.items.map((comment) => (
                <li key={comment.id}>
                  <CommentItem
                    comment={comment}
                    slug={slug}
                    depth={0}
                    currentUserId={currentUserId}
                    isModerator={isModerator}
                    onReply={setReplyTo}
                  />
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
