"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Archive,
  Bold,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  LoaderCircle,
  Save,
  Send,
  Clock,
  Italic,
  Heading2,
  Quote,
  Code,
  List,
  Link as LinkIcon,
} from "lucide-react";
import { Input } from "@/src/components/ui/Input";
import { Textarea } from "@/src/components/ui/Textarea";
import { Select } from "@/src/components/ui/Select";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { useToast } from "@/src/components/ui/Toast";
import { slugify } from "@/src/lib/slugify";
import {
  useCategoriesQuery,
  useCreatePostMutation,
  useGetPostForEditQuery,
  useTagsQuery,
  useUpdatePostMutation,
} from "@/src/store/api/editorApi";
import dynamic from "next/dynamic";
import { SeoPreview } from "./SeoPreview";
import { CoverUpload } from "./CoverUpload";

const AIAssistant = dynamic(() => import("./AIAssistant").then((m) => m.AIAssistant), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-zinc-200/70 bg-white p-5 dark:border-zinc-800/70 dark:bg-zinc-950" role="status" aria-label="Loading AI assistant">
      <div className="h-4 w-32 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  ),
});

const FORMAT_TOOLS = [
  { key: "bold", label: "Bold", prefix: "**", suffix: "**", Icon: Bold },
  { key: "italic", label: "Italic", prefix: "*", suffix: "*", Icon: Italic },
  { key: "heading", label: "Heading", prefix: "## ", suffix: "", Icon: Heading2 },
  { key: "quote", label: "Quote", prefix: "> ", suffix: "", Icon: Quote },
  { key: "code", label: "Code", prefix: "`", suffix: "`", Icon: Code },
  { key: "list", label: "Bulleted list", prefix: "- ", suffix: "", Icon: List },
  { key: "link", label: "Link", prefix: "[", suffix: "](url)", Icon: LinkIcon },
] as const;

const editorSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(150),
    slug: z.string().trim().max(180).optional(),
    excerpt: z.string().trim().max(300).optional(),
    content: z.string().trim().max(100000).optional(),
    coverImage: z.string().trim().max(1024).nullable().optional(),
    category: z.string().trim().max(80).nullable().optional(),
    tags: z.string().trim().max(500).optional(),
    seoTitle: z.string().trim().max(70).nullable().optional(),
    seoDescription: z.string().trim().max(160).nullable().optional(),
    canonicalUrl: z.string().trim().max(1024).nullable().optional(),
    ogImage: z.string().trim().max(1024).nullable().optional(),
    featured: z.boolean().optional(),
    status: z.enum(["draft", "published", "scheduled", "archived"]).optional(),
    scheduledAt: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.title && data.title.trim().length < 8) {
      ctx.addIssue({ code: "custom", path: ["title"], message: "Title must be at least 8 characters" });
    }
  });

type FormValues = z.infer<typeof editorSchema>;

function toPayload(values: FormValues, statusOverride?: string) {
  const tags = values.tags
    ? values.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 10)
    : undefined;
  const payload: Record<string, unknown> = {};
  if (values.title !== undefined) payload.title = values.title;
  if (values.slug) payload.slug = slugify(values.slug);
  if (values.excerpt !== undefined) payload.excerpt = values.excerpt;
  if (values.content !== undefined) payload.content = values.content;
  if (values.coverImage !== undefined) payload.coverImage = values.coverImage || null;
  if (values.category !== undefined) payload.category = values.category || null;
  if (tags !== undefined) payload.tags = tags;
  if (values.seoTitle !== undefined) payload.seoTitle = values.seoTitle || null;
  if (values.seoDescription !== undefined) payload.seoDescription = values.seoDescription || null;
  if (values.canonicalUrl !== undefined) payload.canonicalUrl = values.canonicalUrl || null;
  if (values.ogImage !== undefined) payload.ogImage = values.ogImage || null;
  if (values.featured !== undefined) payload.featured = values.featured;
  if (statusOverride) payload.status = statusOverride;
  else if (values.status) payload.status = values.status;
  if (values.scheduledAt !== undefined) payload.scheduledAt = values.scheduledAt || null;
  return payload;
}

function validateForPublish(values: FormValues): string | null {
  if (!values.title || values.title.trim().length < 8) return "Title must be at least 8 characters to publish";
  if (!values.excerpt || values.excerpt.trim().length < 20) return "Excerpt must be at least 20 characters to publish";
  if (!values.content || values.content.trim().length < 100) return "Content must be at least 100 characters to publish";
  if (!values.category) return "Category is required to publish";
  return null;
}

export function BlogEditor({ postId }: { postId?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const isEditing = !!postId;

  const { data: post, isLoading: postLoading } = useGetPostForEditQuery(postId || "", { skip: !postId });
  const { data: categories } = useCategoriesQuery();
  const { data: allTags } = useTagsQuery();
  const [createPost, { isLoading: creating }] = useCreatePostMutation();
  const [updatePost, { isLoading: updating }] = useUpdatePostMutation();

  const [showPreview, setShowPreview] = useState(false);
  const [slugEdited, setSlugEdited] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(postId || null);
  const [seoOpen, setSeoOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(true);

  const role = (session as unknown as { user?: { role?: string } })?.user?.role;
  const canFeature = role === "admin" || role === "editor";

  const handleAiApply = (field: string, value: string | string[]) => {
    const v = Array.isArray(value) ? value.join(", ") : value;
    const fieldMap: Record<string, keyof FormValues> = {
      title: "title",
      content: "content",
      excerpt: "excerpt",
      seoTitle: "seoTitle",
      seoDescription: "seoDescription",
      category: "category",
      tags: "tags",
    };
    const formField = fieldMap[field] ?? (field as keyof FormValues);
    setValue(formField, v as never, { shouldDirty: true, shouldTouch: true });
    toast(`Applied to ${field}`, { tone: "success" });
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(editorSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      category: "",
      tags: "",
      seoTitle: "",
      seoDescription: "",
      canonicalUrl: "",
      ogImage: "",
      featured: false,
      status: "draft",
      scheduledAt: "",
    },
  });

  const watchedTitle = watch("title");
  const watchedSlug = watch("slug");
  const watchedCover = watch("coverImage");
  const watchedContent = watch("content");
  const watchedExcerpt = watch("excerpt");
  const watchedSeoTitle = watch("seoTitle");
  const watchedSeoDesc = watch("seoDescription");
  const watchedSeoUrl = watch("canonicalUrl");
  const watchedOg = watch("ogImage");
  const watchedCategory = watch("category");
  const watchedStatus = watch("status");

  useEffect(() => {
    if (post) {
      reset({
        title: post.title || "",
        slug: post.slug || "",
        excerpt: post.excerpt || "",
        content: post.content || "",
        coverImage: post.coverImage || "",
        category: post.category?.slug || "",
        tags: post.tags?.map((t) => t.name).join(", ") || "",
        seoTitle: post.seoTitle || "",
        seoDescription: post.seoDescription || "",
        canonicalUrl: post.canonicalUrl || "",
        ogImage: post.ogImage || "",
        featured: post.featured || false,
        status: post.status as never,
        scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "",
      });
      setSlugEdited(true);
      setCreatedId(post._id);
    }
  }, [post, reset]);

  useEffect(() => {
    if (!slugEdited && watchedTitle) {
      const s = slugify(watchedTitle);
      setValue("slug", s, { shouldDirty: true });
    }
  }, [watchedTitle, slugEdited, setValue]);

  const saveDraftRef = useRef<() => void>(() => {});
  saveDraftRef.current = async () => {
    if (!isDirty) return;
    const vals = getValues();
    if (!vals.title || vals.title.trim().length < 2) return;
    setSavingDraft(true);
    try {
      const payload = toPayload(vals, "draft");
      if (createdId) {
        await updatePost({ id: createdId, body: payload as never }).unwrap();
      } else {
        const res = await createPost(payload as never).unwrap();
        setCreatedId(res._id);
        window.history.replaceState(null, "", `/write/${res._id}`);
      }
      setLastSaved(new Date());
    } catch {
      // silent autosave failure
    } finally {
      setSavingDraft(false);
    }
  };

  useEffect(() => {
    const id = setInterval(() => {
      void saveDraftRef.current();
    }, 45000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const readingTime = useMemo(() => {
    const words = (watchedContent || "").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 200));
  }, [watchedContent]);

  const wordCount = useMemo(() => {
    return (watchedContent || "").trim().split(/\s+/).filter(Boolean).length;
  }, [watchedContent]);

  const checklist = useMemo(() => [
    { label: "Title ≥8 chars", done: !!(watchedTitle && watchedTitle.length >= 8) },
    { label: "Excerpt ≥20 chars", done: !!(watchedExcerpt && watchedExcerpt.length >= 20) },
    { label: "Content ≥100 chars", done: !!(watchedContent && watchedContent.length >= 100) },
    { label: "Category selected", done: !!watchedCategory },
  ], [watchedTitle, watchedExcerpt, watchedContent, watchedCategory]);

  const checklistDone = checklist.filter((c) => c.done).length;

  const insertMarkdown = (prefix: string, suffix = "") => {
    const text = getValues("content") || "";
    const replacement = `${prefix}${"text"}${suffix}`;
    setValue("content", text + replacement, { shouldDirty: true });
  };

  const onSaveDraft = handleSubmit(async (values) => {
    const payload = toPayload(values, "draft");
    try {
      if (createdId) {
        await updatePost({ id: createdId, body: payload as never }).unwrap();
        toast("Draft saved", { tone: "success" });
      } else {
        const res = await createPost(payload as never).unwrap();
        setCreatedId(res._id);
        toast("Draft created", { tone: "success" });
        router.replace(`/write/${res._id}`);
      }
      setLastSaved(new Date());
      reset(values, { keepValues: true });
    } catch (e) {
      const msg = (e as { data?: { message?: string } })?.data?.message || "Failed to save draft";
      toast(msg, { tone: "error" });
    }
  });

  const onPublish = handleSubmit(async (values) => {
    const err = validateForPublish(values);
    if (err) {
      toast(err, { tone: "error" });
      return;
    }
    const payload = toPayload(values, "published");
    try {
      let res: { slug: string; _id: string };
      if (createdId) {
        res = (await updatePost({ id: createdId, body: payload as never }).unwrap()) as never;
      } else {
        res = (await createPost(payload as never).unwrap()) as never;
      }
      toast("Published!", { tone: "success" });
      router.push(`/blog/${res.slug}`);
    } catch (e) {
      const msg = (e as { data?: { message?: string } })?.data?.message || "Failed to publish";
      toast(msg, { tone: "error" });
    }
  });

  const onSchedule = handleSubmit(async (values) => {
    if (!values.scheduledAt) {
      toast("Pick a future date to schedule", { tone: "error" });
      return;
    }
    const err = validateForPublish(values);
    if (err) {
      toast(err, { tone: "error" });
      return;
    }
    const d = new Date(values.scheduledAt);
    if (d.getTime() <= Date.now()) {
      toast("Scheduled date must be in the future", { tone: "error" });
      return;
    }
    const payload = toPayload(values, "scheduled");
    try {
      const res = createdId
        ? ((await updatePost({ id: createdId, body: payload as never }).unwrap()) as { slug: string })
        : ((await createPost(payload as never).unwrap()) as { slug: string });
      toast(`Scheduled for ${d.toLocaleString()}`, { tone: "success" });
      router.push(`/blog/${(res as { slug: string }).slug}`);
    } catch (e) {
      const msg = (e as { data?: { message?: string } })?.data?.message || "Failed to schedule";
      toast(msg, { tone: "error" });
    }
  });

  const onArchive = handleSubmit(async (values) => {
    const payload = toPayload(values, "archived");
    try {
      if (createdId) await updatePost({ id: createdId, body: payload as never }).unwrap();
      else await createPost(payload as never).unwrap();
      toast("Archived", { tone: "success" });
      router.push("/dashboard");
    } catch (e) {
      const msg = (e as { data?: { message?: string } })?.data?.message || "Failed to archive";
      toast(msg, { tone: "error" });
    }
  });

  if (postLoading && isEditing) {
    return (
      <div className="min-h-screen" role="status" aria-label="Loading editor">
        <div className="border-b border-zinc-200/70 dark:border-zinc-800/70">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
            <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-4 w-24 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
            <div className="ml-auto h-8 w-24 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6">
          <div className="h-10 w-2/3 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-24 w-full animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-64 w-full animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  const isBusy = creating || updating || isSubmitting;

  return (
    <div className="min-h-screen pb-16">
      <h1 className="sr-only">{isEditing ? "Edit story" : "Write a new story"}</h1>
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="sticky top-16 z-20 border-b border-zinc-200/70 bg-white/80 backdrop-blur-md dark:border-zinc-800/70 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5 sm:gap-3 sm:px-6">
          {/* Left: back + status */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors outline-none hover:bg-zinc-100 hover:text-zinc-700 active:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 dark:active:bg-zinc-700 dark:focus-visible:outline-zinc-100"
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
            </button>
            <div className="flex min-w-0 items-center gap-2 text-sm" aria-live="polite">
              {savingDraft && (
                <span className="inline-flex items-center gap-1.5 text-zinc-500">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  <span className="hidden sm:inline">Saving…</span>
                </span>
              )}
              {!savingDraft && lastSaved && (
                <span className="truncate text-xs text-zinc-400 sm:text-sm">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
              {!savingDraft && !lastSaved && isDirty && (
                <Badge tone="warning">Unsaved</Badge>
              )}
              {!savingDraft && !lastSaved && !isDirty && (
                <span className="text-sm text-zinc-400">{isEditing ? "Editing" : "New draft"}</span>
              )}
            </div>
          </div>

          {/* Center: reading stats */}
          <div className="hidden items-center gap-4 text-xs tabular-nums text-zinc-400 md:flex">
            <span>{wordCount.toLocaleString()} words</span>
            <span className="h-3 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden />
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden />
              {readingTime} min read
            </span>
          </div>

          {/* Right: primary actions only — Schedule/Archive live in Publish settings */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview((v) => !v)}
              aria-pressed={showPreview}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="hidden sm:inline">{showPreview ? "Edit" : "Preview"}</span>
              <span className="sr-only sm:hidden">{showPreview ? "Back to editing" : "Preview story"}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSaveDraft}
              loading={isBusy}
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Save</span>
              <span className="sr-only sm:hidden">Save draft</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onPublish}
              loading={isBusy}
            >
              <Send className="h-4 w-4" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* ── Preview mode ────────────────────────────────────────── */}
      {showPreview ? (
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <p className="eyebrow text-zinc-500 dark:text-zinc-400">Preview</p>
          <h1 className="headline mt-3 text-4xl leading-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
            {watchedTitle || "Untitled"}
          </h1>
          {watchedCover && (
            <div className="mt-8 overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={watchedCover} alt="Cover" className="w-full object-cover" />
            </div>
          )}
          {watchedExcerpt && (
            <p className="mt-6 text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              {watchedExcerpt}
            </p>
          )}
          <div className="prose max-w-none mt-8 whitespace-pre-wrap leading-8 dark:prose-invert">
            {watchedContent || "Start writing to see preview…"}
          </div>
          <div className="mt-10">
            <SeoPreview
              title={watchedSeoTitle || watchedTitle || ""}
              description={watchedSeoDesc || watchedExcerpt || ""}
              url={watchedSeoUrl || `https://inkwell.demo/blog/${watchedSlug || "your-slug"}`}
              image={watchedOg || watchedCover}
            />
          </div>
        </div>
      ) : (
        /* ── Edit mode ──────────────────────────────────────────────── */
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            {/* ── Main content ──────────────────────────────────────── */}
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label htmlFor="post-title" className="sr-only">
                  Post title
                </label>
                <input
                  id="post-title"
                  type="text"
                  placeholder="Untitled"
                  aria-invalid={!!errors.title || undefined}
                  className="w-full border-none bg-transparent font-serif text-3xl font-bold tracking-tight text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-700 sm:text-4xl"
                  {...register("title")}
                />
              </div>
              {errors.title && (
                <p role="alert" className="text-sm text-red-500">{errors.title.message}</p>
              )}

              {/* Slug */}
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="shrink-0" aria-hidden>/blog/</span>
                <label htmlFor="post-slug" className="sr-only">
                  Post slug
                </label>
                <input
                  id="post-slug"
                  type="text"
                  placeholder="your-slug"
                  className="min-w-0 flex-1 border-none bg-transparent text-zinc-600 placeholder:text-zinc-300 focus:outline-none focus:ring-0 dark:text-zinc-400 dark:placeholder:text-zinc-700"
                  {...register("slug", { onChange: () => setSlugEdited(true) })}
                  onFocus={() => setSlugEdited(true)}
                />
              </div>

              {/* Excerpt */}
              <div>
                <Textarea
                  aria-label="Excerpt"
                  placeholder="Write a compelling excerpt — shown in feeds and previews."
                  rows={2}
                  error={errors.excerpt?.message}
                  {...register("excerpt")}
                  className="text-sm"
                />
                <p className="mt-1 text-right text-xs tabular-nums text-zinc-400">
                  {(watchedExcerpt || "").length}/300
                </p>
              </div>

              {/* Markdown toolbar */}
              <div
                role="toolbar"
                aria-label="Formatting"
                className="flex flex-wrap items-center gap-1 rounded-xl border border-zinc-200/70 bg-zinc-50 px-2 py-1.5 dark:border-zinc-800/70 dark:bg-zinc-900/50"
              >
                {FORMAT_TOOLS.map(({ key, label, prefix, suffix, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => insertMarkdown(prefix, suffix)}
                    aria-label={label}
                    title={label}
                    className="rounded-lg p-2 text-zinc-500 transition-colors outline-none hover:bg-zinc-200/70 hover:text-zinc-700 active:bg-zinc-300/70 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-900 dark:hover:bg-zinc-700/70 dark:hover:text-zinc-300 dark:active:bg-zinc-700 dark:focus-visible:outline-zinc-100"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </button>
                ))}
                <div className="mx-1 h-5 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden />
                <span className="px-2 text-xs text-zinc-400">Markdown supported</span>
              </div>

              {/* Content */}
              <div>
                <Textarea
                  aria-label="Story content (Markdown)"
                  placeholder="Start writing your story…"
                  rows={22}
                  error={errors.content?.message}
                  {...register("content")}
                  className="font-mono text-sm leading-relaxed"
                />
                <div className="mt-2 flex items-center justify-between text-xs tabular-nums text-zinc-400">
                  <span>{(watchedContent || "").length.toLocaleString()} characters</span>
                  <span>{wordCount.toLocaleString()} words · {readingTime} min read</span>
                </div>
              </div>

              {/* Cover image */}
              <section aria-labelledby="cover-heading" className="rounded-2xl border border-zinc-200/70 p-5 dark:border-zinc-800/70">
                <h2 id="cover-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cover image</h2>
                <div className="mt-3">
                  <CoverUpload
                    value={watchedCover || null}
                    onChange={(url) => setValue("coverImage", url, { shouldDirty: true })}
                    onRemove={() => setValue("coverImage", "", { shouldDirty: true })}
                  />
                </div>
                <div className="mt-3">
                  <Input
                    aria-label="Cover image URL"
                    placeholder="https://… or upload above"
                    {...register("coverImage")}
                    hint="Direct URL after upload, or paste external"
                  />
                </div>
              </section>

              {/* Category & Tags */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Category"
                  placeholder="Choose category"
                  options={[{ value: "", label: "No category" }, ...(categories || []).map((c) => ({ value: c.slug, label: c.name }))]}
                  {...register("category")}
                  error={errors.category?.message}
                />
                <Input
                  label="Tags"
                  placeholder="nextjs, design, craft (comma separated)"
                  {...register("tags")}
                  hint={allTags ? `Popular: ${allTags.slice(0, 5).map((t) => t.name).join(", ")}` : undefined}
                />
              </div>
            </div>

            {/* ── Sidebar: task flow — configure → verify → assist → optimize ── */}
            <div className="space-y-5">
              {/* Publish settings */}
              <section aria-labelledby="publish-heading" className="rounded-2xl border border-zinc-200/70 bg-white p-5 dark:border-zinc-800/70 dark:bg-zinc-950">
                <h2 id="publish-heading" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Publish</h2>
                <div className="mt-4 space-y-3">
                  <Select
                    label="Status"
                    options={[
                      { value: "draft", label: "Draft" },
                      { value: "published", label: "Published" },
                      { value: "scheduled", label: "Scheduled" },
                      { value: "archived", label: "Archived" },
                    ]}
                    {...register("status")}
                  />
                  {watchedStatus === "scheduled" && (
                    <Input
                      label="Schedule for"
                      type="datetime-local"
                      {...register("scheduledAt")}
                      hint="Must be in the future"
                    />
                  )}
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      {...register("featured")}
                      className="h-4 w-4 shrink-0 rounded accent-zinc-900 dark:accent-zinc-100"
                      disabled={!canFeature}
                    />
                    <span>Featured post</span>
                    {!canFeature && (
                      <span className="text-xs text-zinc-400">(admin/editor)</span>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={onSchedule}
                      loading={isBusy}
                      className="flex-1"
                    >
                      <Calendar className="h-4 w-4" aria-hidden />
                      Schedule
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onArchive}
                      disabled={isBusy}
                      className="flex-1"
                    >
                      <Archive className="h-4 w-4" aria-hidden />
                      Archive
                    </Button>
                  </div>
                </div>
              </section>

              {/* Publishing checklist — collapsible */}
              <div className="rounded-2xl border border-zinc-200/70 bg-white dark:border-zinc-800/70 dark:bg-zinc-950">
                <button
                  type="button"
                  onClick={() => setChecklistOpen((v) => !v)}
                  aria-expanded={checklistOpen}
                  aria-controls="editor-checklist"
                  className="flex w-full items-center justify-between rounded-2xl p-5 text-left outline-none transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-900 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Checklist</h2>
                    <span className="text-xs tabular-nums text-zinc-400" aria-hidden>{checklistDone}/{checklist.length}</span>
                    <span className="sr-only">{checklistDone} of {checklist.length} ready</span>
                  </div>
                  {checklistOpen ? (
                    <ChevronUp className="h-4 w-4 text-zinc-400" aria-hidden />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-400" aria-hidden />
                  )}
                </button>
                {checklistOpen && (
                  <div id="editor-checklist" className="space-y-2 px-5 pb-5">
                    {/* Progress bar */}
                    <div
                      role="progressbar"
                      aria-valuenow={checklistDone}
                      aria-valuemin={0}
                      aria-valuemax={checklist.length}
                      aria-label="Publishing readiness"
                      className="h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                    >
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${(checklistDone / checklist.length) * 100}%` }}
                      />
                    </div>
                    <ul className="space-y-2">
                      {checklist.map((item) => (
                        <li
                          key={item.label}
                          className={`flex items-center gap-2 text-sm ${
                            item.done ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          <span
                            aria-hidden
                            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current"
                          >
                            {item.done && <Check className="h-2.5 w-2.5" />}
                          </span>
                          {item.label}
                          <span className="sr-only">{item.done ? "done" : "pending"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* AI Assistant */}
              <AIAssistant
                title={watchedTitle || ""}
                excerpt={watchedExcerpt || ""}
                content={watchedContent || ""}
                onApply={handleAiApply}
              />

              {/* SEO — collapsible */}
              <div className="rounded-2xl border border-zinc-200/70 bg-white dark:border-zinc-800/70 dark:bg-zinc-950">
                <button
                  type="button"
                  onClick={() => setSeoOpen((v) => !v)}
                  aria-expanded={seoOpen}
                  aria-controls="editor-seo"
                  className="flex w-full items-center justify-between rounded-2xl p-5 text-left outline-none transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-zinc-900 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
                >
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">SEO</h2>
                  {seoOpen ? (
                    <ChevronUp className="h-4 w-4 text-zinc-400" aria-hidden />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-400" aria-hidden />
                  )}
                </button>
                {seoOpen && (
                  <div id="editor-seo" className="space-y-3 px-5 pb-5">
                    <Input
                      label="SEO Title"
                      placeholder="Defaults to post title"
                      hint="Max 70 chars"
                      error={errors.seoTitle?.message}
                      {...register("seoTitle")}
                    />
                    <div>
                      <Textarea
                        label="SEO Description"
                        placeholder="Defaults to excerpt"
                        rows={3}
                        error={errors.seoDescription?.message}
                        {...register("seoDescription")}
                      />
                      <p className="mt-1 text-right text-xs tabular-nums text-zinc-400">
                        {(watchedSeoDesc || "").length}/160
                      </p>
                    </div>
                    <Input
                      label="Canonical URL"
                      placeholder="https://inkwell.demo/blog/..."
                      {...register("canonicalUrl")}
                    />
                    <Input
                      label="OG Image"
                      placeholder="Defaults to cover"
                      {...register("ogImage")}
                    />
                    <SeoPreview
                      title={watchedSeoTitle || watchedTitle || ""}
                      description={watchedSeoDesc || watchedExcerpt || ""}
                      url={watchedSeoUrl || `https://inkwell.demo/blog/${watchedSlug || "your-slug"}`}
                      image={watchedOg || watchedCover}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
