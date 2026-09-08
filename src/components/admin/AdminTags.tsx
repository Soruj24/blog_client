"use client";

import {
  TaxonomyManager,
  type FieldDef,
  type FormValues,
} from "@/src/components/admin/TaxonomyManager";
import { TagDeleteDialog } from "@/src/components/admin/TagDeleteDialog";
import {
  useAdminListTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  type AdminTag,
  type TagInput,
} from "@/src/store/api/contentApi";

const FIELDS: FieldDef[] = [
  { key: "name", label: "Name", type: "text", required: true, placeholder: "e.g. machine learning" },
  {
    key: "slug",
    label: "Slug",
    type: "text",
    placeholder: "auto-generated",
    hint: "Lowercase letters, numbers, hyphens. Leave blank to auto-generate; renames keep the old URL.",
  },
  { key: "description", label: "Description", type: "textarea", placeholder: "What does this tag collect?" },
];

const DEFAULTS: FormValues = { name: "", slug: "", description: "" };

function toInput(v: FormValues): TagInput {
  return {
    name: String(v["name"] ?? ""),
    ...(typeof v["slug"] === "string" && v["slug"].trim() ? { slug: v["slug"].trim() } : {}),
    description: typeof v["description"] === "string" ? v["description"] : "",
  };
}

/** Admin tag console — list, create, rename, delete + detach. */
export function AdminTags() {
  const { data, isLoading, isError, refetch } = useAdminListTagsQuery();
  const [create] = useCreateTagMutation();
  const [update] = useUpdateTagMutation();

  return (
    <TaxonomyManager<AdminTag>
      title="Tags"
      description="Folksonomy labels. Deleting a tag unlabels posts — posts themselves stay intact."
      noun="tag"
      items={data}
      isLoading={isLoading}
      isError={isError}
      refetch={() => void refetch()}
      fields={FIELDS}
      defaults={DEFAULTS}
      onCreate={(v) => create(toInput(v)).unwrap()}
      onUpdate={(id, v) => update({ id, ...toInput(v) }).unwrap()}
      renderDeleteDialog={(item, onClose) => (
        <TagDeleteDialog tag={item} onClose={onClose} />
      )}
    />
  );
}
