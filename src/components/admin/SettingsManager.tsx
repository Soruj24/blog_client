"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { ErrorState } from "@/src/components/ui/ErrorState";
import { Input } from "@/src/components/ui/Input";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { useSiteSettingsQuery, useUpdateSettingsMutation } from "@/src/store/api/adminApi";
import { PageHeader } from "./shared";

const BOOL_FIELDS = [
  { key: "registrationEnabled", label: "Open registration", description: "Allow new users to create accounts" },
  { key: "commentsEnabled", label: "Comments", description: "Enable commenting on published posts" },
  { key: "newsletterEnabled", label: "Newsletter", description: "Allow visitors to subscribe to the newsletter" },
  { key: "maintenanceMode", label: "Maintenance mode", description: "Show a maintenance page to non-admin visitors" },
] as const;

function SettingsSkeleton() {
  return (
    <div className="max-w-3xl space-y-4" role="status" aria-label="Loading settings">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-2xl" />
      ))}
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white p-6 dark:border-zinc-800/60 dark:bg-zinc-950">
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

/** Site settings: text + toggles, one PATCH for the dirty set. */
export function SettingsManager() {
  const { data, isLoading, isError, refetch } = useSiteSettingsQuery();
  const [update, { isLoading: saving, isSuccess }] = useUpdateSettingsMutation();

  const [form, setForm] = useState<Record<string, string | number | boolean | null>>({});
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      siteName: data.siteName,
      tagline: data.tagline,
      logoUrl: data.logoUrl ?? "",
      faviconUrl: data.faviconUrl ?? "",
      postsPerPage: data.postsPerPage,
      featuredLimit: data.featuredLimit,
      registrationEnabled: data.registrationEnabled,
      commentsEnabled: data.commentsEnabled,
      newsletterEnabled: data.newsletterEnabled,
      maintenanceMode: data.maintenanceMode,
      twitterUrl: data.twitterUrl ?? "",
      githubUrl: data.githubUrl ?? "",
      linkedinUrl: data.linkedinUrl ?? "",
      defaultSeoTitle: data.defaultSeoTitle ?? "",
      defaultSeoDescription: data.defaultSeoDescription ?? "",
    });
    setTouched(false);
  }, [data]);

  const set = (key: string, v: string | number | boolean | null) => {
    setForm((prev) => ({ ...prev, [key]: v }));
    setTouched(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !touched) return;
    setError(null);
    const patch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      const orig = (data as unknown as Record<string, unknown>)[k];
      const normalized =
        typeof v === "string" && v.trim() === "" && (k.endsWith("Url") || k.startsWith("defaultSeo"))
          ? null
          : v;
      if (normalized !== orig && !(normalized === "" && orig === null)) {
        patch[k] = normalized;
      }
    }
    if (Object.keys(patch).length === 0) return;
    try {
      await update(patch as never).unwrap();
      setTouched(false);
    } catch (e) {
      setError((e as { data?: { message?: string } })?.data?.message ?? "Couldn't save settings.");
    }
  };

  if (isLoading) return <SettingsSkeleton />;

  if (isError || !data) {
    return <ErrorState title="Couldn't load settings" onRetry={() => void refetch()} />;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Site-wide configuration. Changes apply immediately after saving." />

      <form onSubmit={save} className="space-y-6">
        <SettingsSection title="General" description="Basic site identity and branding.">
          <div className="space-y-4">
            <Input
              label="Site name"
              value={String(form["siteName"] ?? "")}
              onChange={(e) => set("siteName", e.target.value)}
            />
            <Input
              label="Tagline"
              value={String(form["tagline"] ?? "")}
              onChange={(e) => set("tagline", e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Logo URL"
                value={String(form["logoUrl"] ?? "")}
                onChange={(e) => set("logoUrl", e.target.value)}
              />
              <Input
                label="Favicon URL"
                value={String(form["faviconUrl"] ?? "")}
                onChange={(e) => set("faviconUrl", e.target.value)}
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Content" description="Defaults for new posts and featured slots.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Posts per page"
              type="number"
              value={Number(form["postsPerPage"] ?? 10)}
              onChange={(e) => set("postsPerPage", Number(e.target.value))}
            />
            <Input
              label="Featured limit"
              type="number"
              value={Number(form["featuredLimit"] ?? 5)}
              onChange={(e) => set("featuredLimit", Number(e.target.value))}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="SEO Defaults" description="Fallback meta tags when posts don't specify their own.">
          <div className="space-y-4">
            <Input
              label="Default SEO title"
              value={String(form["defaultSeoTitle"] ?? "")}
              onChange={(e) => set("defaultSeoTitle", e.target.value)}
            />
            <Input
              label="Default SEO description"
              value={String(form["defaultSeoDescription"] ?? "")}
              onChange={(e) => set("defaultSeoDescription", e.target.value)}
              hint={`${String(form["defaultSeoDescription"] ?? "").length}/160 characters`}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Social Links" description="Displayed in the site footer and meta tags.">
          <div className="space-y-4">
            <Input
              label="Twitter / X URL"
              placeholder="https://x.com/…"
              value={String(form["twitterUrl"] ?? "")}
              onChange={(e) => set("twitterUrl", e.target.value)}
            />
            <Input
              label="GitHub URL"
              placeholder="https://github.com/…"
              value={String(form["githubUrl"] ?? "")}
              onChange={(e) => set("githubUrl", e.target.value)}
            />
            <Input
              label="LinkedIn URL"
              placeholder="https://linkedin.com/…"
              value={String(form["linkedinUrl"] ?? "")}
              onChange={(e) => set("linkedinUrl", e.target.value)}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Features" description="Toggle platform capabilities on or off.">
          <div className="space-y-1" role="group" aria-label="Feature toggles">
            {BOOL_FIELDS.map(({ key, label, description }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-xl px-4 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              >
                <div className="min-w-0">
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
                  {description && (
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
                  )}
                </div>
                <div className="relative inline-flex h-6 w-11 shrink-0 items-center">
                  <input
                    type="checkbox"
                    checked={Boolean(form[key])}
                    onChange={(e) => set(key, e.target.checked)}
                    aria-label={label}
                    className="peer sr-only"
                  />
                  <span aria-hidden className="absolute inset-0 rounded-full bg-zinc-200 transition-colors peer-checked:bg-zinc-900 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-zinc-900 dark:bg-zinc-700 dark:peer-checked:bg-zinc-100 dark:peer-focus-visible:outline-zinc-100" />
                  <span aria-hidden className="pointer-events-none relative mx-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5 dark:bg-zinc-900 dark:peer-checked:bg-zinc-900" />
                </div>
              </label>
            ))}
          </div>
        </SettingsSection>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="sticky bottom-4 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-zinc-200/60 bg-white/95 px-6 py-4 shadow-xl shadow-zinc-900/5 backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/95 dark:shadow-zinc-950/20">
          <Button type="submit" loading={saving} disabled={!touched}>
            Save settings
          </Button>
          {touched ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          ) : isSuccess ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" aria-hidden />
              Saved
            </span>
          ) : (
            <span className="text-sm text-zinc-400 dark:text-zinc-500">
              No changes yet
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
