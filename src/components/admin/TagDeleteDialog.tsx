"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { useDeleteTagMutation, type AdminTag } from "@/src/store/api/contentApi";

/** Tag deletion with orphan protection: posts must be explicitly detached. */
export function TagDeleteDialog({
  tag,
  onClose,
}: {
  tag: AdminTag;
  onClose: () => void;
}) {
  const [detach, setDetach] = useState(false);
  const [remove, { isLoading }] = useDeleteTagMutation();
  const [error, setError] = useState<string | null>(null);

  const used = tag.postCount > 0;

  const confirm = async () => {
    if (used && !detach) {
      setError("Tick the confirmation — tagged posts must be explicitly detached.");
      return;
    }
    setError(null);
    try {
      await remove({ id: tag._id, detach: used ? true : undefined }).unwrap();
      onClose();
    } catch (err) {
      setError(
        (err as { data?: { message?: string } })?.data?.message ?? "Couldn't delete this tag.",
      );
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title=""
      description=""
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={isLoading}
            disabled={used && !detach}
            onClick={() => void confirm()}
          >
            Delete tag
          </Button>
        </>
      }
    >
      <div className="text-center sm:text-left">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Delete &ldquo;{tag.name}&rdquo;?
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {used
            ? `${tag.postCount} ${tag.postCount === 1 ? "post carries" : "posts carry"} this tag. Deleting strips the label — confirm that's intended.`
            : "Nothing references this tag. This can't be undone."}
        </p>
      </div>
      {used && (
        <label className="mt-4 flex items-start gap-3 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
          <input
            type="checkbox"
            checked={detach}
            onChange={(e) => setDetach(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-zinc-900 dark:accent-zinc-100"
          />
          <span className="text-zinc-700 dark:text-zinc-300">
            Strip <strong>#{tag.name}</strong> from all {tag.postCount}{" "}
            {tag.postCount === 1 ? "post" : "posts"}. Posts themselves stay intact.
          </span>
        </label>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </Modal>
  );
}
