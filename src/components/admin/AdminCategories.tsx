"use client";

import {
  TaxonomyManager,
  type FieldDef,
  type FormValues,
} from "@/src/components/admin/TaxonomyManager";
import { CategoryDeleteDialog } from "@/src/components/admin/CategoryDeleteDialog";
import {
  useAdminListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  type AdminCategory,
  type CategoryInput,
} from "@/src/store/api/contentApi";
import { StatusBadge } from "./shared";

const FIELDS: FieldDef[] = [
  { key: "name", label: "Name", type: "text", required: true, placeholder: "e.g. Web Development" },
  {
    key: "slug",
    label: "Slug",
    type: "text",
    placeholder: "auto-generated",
    hint: "Lowercase letters, numbers, hyphens. Leave blank to auto-generate; renames keep the old URL.",
  },
  { key: "description", label: "Description", type: "textarea", placeholder: "What belongs in this topic?" },
  { key: "color", label: "Color", type: "color" },
  { key: "order", label: "Order", type: "number", hint: "Lower appears first in navigation." },
  { key: "isActive", label: "Visible to readers", type: "checkbox" },
];

const DEFAULTS: FormValues = {
  name: "",
  slug: "",
  description: "",
  color: "#71717a",
  order: 0,
  isActive: true,
};

function toInput(v: FormValues): CategoryInput {
  return {
    name: String(v["name"] ?? ""),
    ...(typeof v["slug"] === "string" && v["slug"].trim() ? { slug: v["slug"].trim() } : {}),
    description: typeof v["description"] === "string" ? v["description"] : "",
    color: typeof v["color"] === "string" && v["color"] ? v["color"] : null,
    order: Number(v["order"] ?? 0),
    isActive: v["isActive"] !== false,
  };
}

/** Admin category console — list, create, rename, hide, delete + reassign. */
export function AdminCategories() {
  const { data, isLoading, isError, refetch } = useAdminListCategoriesQuery();
  const [create] = useCreateCategoryMutation();
  const [update] = useUpdateCategoryMutation();

  return (
    <TaxonomyManager<AdminCategory>
      title="Categories"
      description="Curated topics. Posts always belong somewhere — deletion moves them first."
      noun="category"
      items={data}
      isLoading={isLoading}
      isError={isError}
      refetch={() => void refetch()}
      fields={FIELDS}
      defaults={DEFAULTS}
      extraHeaders={
        <th scope="col" className="px-4 py-3">Status</th>
      }
      extraColumns={(item) => (
        <td className="px-4 py-3.5">
          <StatusBadge
            status={item.isActive ? "success" : "neutral"}
            label={item.isActive ? "Visible" : "Hidden"}
          />
        </td>
      )}
      onCreate={(v) => create(toInput(v)).unwrap()}
      onUpdate={(id, v) => update({ id, ...toInput(v) }).unwrap()}
      renderDeleteDialog={(item, onClose) => (
        <CategoryDeleteDialog
          category={item}
          categories={data ?? []}
          onClose={onClose}
        />
      )}
    />
  );
}
