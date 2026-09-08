"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { Select } from "@/src/components/ui/Select";
import { useDeleteCategoryMutation, type AdminCategory } from "@/src/store/api/contentApi";

/** Category deletion with orphan protection: posts must move first. */
export function CategoryDeleteDialog({
  category,
  categories,
  onClose,
}: {
  category: AdminCategory;
  categories: AdminCategory[];
  onClose: () => void;
}) {
  const [reassignTo, setReassignTo] = useState("");
  const [remove, { isLoading }] = useDeleteCategoryMutation();
  const [error, setError] = useState<string | null>(null);

  const others = categories.filter((c) => c._id !== category._id);
  const needsMove = category.postCount > 0;

  const confirm = async () => {
    if (needsMove && !reassignTo) {
      setError("Choose a surviving category — posts can't be left without one.");
      return;
    }
    setError(null);
    try {
      await remove({ id: category._id, ...(reassignTo ? { reassignTo } : {}) }).unwrap();
      onClose();
    } catch (err) {
      setError(
        (err as { data?: { message?: string } })?.data?.message ??
          "Couldn't delete this category.",
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
            disabled={needsMove && (others.length === 0 || !reassignTo)}
            onClick={() => void confirm()}
          >
            {needsMove ? `Move posts & delete` : "Delete category"}
          </Button>
        </>
      }
    >
      <div className="text-center sm:text-left">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Delete &ldquo;{category.name}&rdquo;?
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {needsMove
            ? `${category.postCount} ${category.postCount === 1 ? "post uses" : "posts use"} this category. Move them first — deletion without a home is refused.`
            : "Nothing references this category. This can't be undone."}
        </p>
      </div>
      {needsMove &&
        (others.length === 0 ? (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            No other category exists — create one first, then delete this.
          </p>
        ) : (
          <div className="mt-4">
            <Select
              label="Move posts to"
              value={reassignTo}
              onChange={(e) => setReassignTo(e.target.value)}
              options={[
                { value: "", label: "Choose a category…" },
                ...others.map((c) => ({
                  value: c._id,
                  label: `${c.name} (${c.postCount} posts)`,
                })),
              ]}
            />
          </div>
        ))}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </Modal>
  );
}
