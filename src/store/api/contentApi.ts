import { baseApi } from "./baseApi";

export interface PublicAuthor {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
}

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

export interface ArticleTag {
  id: string;
  name: string;
  slug: string;
}

export interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  author: PublicAuthor | null;
  category: ArticleCategory | null;
  tags: ArticleTag[];
  readingTime: number;
  views: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string | null;
  featured: boolean;
  trending: boolean;
}

export interface ArticleDetail extends ArticleSummary {
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  ogImage: string | null;
  noIndex: boolean;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

export interface PagedArticles {
  items: ArticleSummary[];
  total: number;
  page: number;
  limit: number;
}

export interface SuggestResults {
  posts: Array<{ id: string; title: string; slug: string }>;
  tags: Array<{ id: string; name: string; slug: string }>;
}

export interface EngagementState {
  liked: boolean;
  bookmarked: boolean;
}

export interface LikeResult {
  liked: boolean;
  likeCount: number;
}

export interface BookmarkResult {
  bookmarked: boolean;
  bookmarkCount: number;
}

export interface PostComment {
  id: string;
  content: string;
  likeCount: number;
  replyCount: number;
  createdAt: string | null;
  author: { name: string; username: string; avatarUrl: string | null } | null;
  authorId: string | null;
  status: string;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  liked: boolean;
  flagCount: number;
  replies: PostComment[];
}

export interface PagedComments {
  items: PostComment[];
  total: number;
  pendingCount: number;
  page: number;
  limit: number;
}

export type ReportReason = "spam" | "harassment" | "hate-speech" | "misinformation" | "other";
export type ModerationStatus = "approved" | "rejected" | "spam";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  color: string | null;
  postCount: number;
}

export interface AdminCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  color: string | null;
  order: number;
  isActive: boolean;
  postCount: number;
  createdAt: string;
}

export interface AdminTag {
  _id: string;
  name: string;
  slug: string;
  description: string;
  postCount: number;
  createdAt: string;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description?: string;
  color?: string | null;
  order?: number;
  isActive?: boolean;
}

export interface TagInput {
  name: string;
  slug?: string;
  description?: string;
}

export interface DeleteCategoryResult {
  deleted: boolean;
  movedPosts: number;
}

export interface DeleteTagResult {
  deleted: boolean;
  detachedFrom: number;
}

export interface PopularAuthor {
  _id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  postCount: number;
  followerCount: number;
  user: { _id: string; name: string; image: string | null } | null;
}

export interface AuthorProfile {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
  linkedin: string | null;
  location: string | null;
  followerCount: number;
  followingCount: number;
  postCount: number;
  totalViews: number;
  joinedAt: string | null;
  name: string;
}

export interface FollowResult {
  following: boolean;
  followerCount: number;
}

export interface FollowState {
  following: boolean;
}

export interface MyStats {
  username: string;
  displayName: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  totalViews: number;
  bookmarksCount: number;
  unreadCount: number;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string | null;
  actor: { name: string; username: string; avatarUrl: string | null } | null;
  post: { title: string; slug: string } | null;
}

export interface PagedNotifications {
  items: AppNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

export interface ListArticlesParams {  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  author?: string;
  search?: string;
  featured?: boolean;
  trending?: boolean;
  sort?: "latest" | "popular" | "liked";
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

function toQuery(params: ListArticlesParams): Record<string, string> {
  const q: Record<string, string> = {};
  if (params.page !== undefined) q["page"] = String(params.page);
  if (params.limit !== undefined) q["limit"] = String(params.limit);
  if (params.category) q["category"] = params.category;
  if (params.tag) q["tag"] = params.tag;
  if (params.author) q["author"] = params.author;
  if (params.search) q["search"] = params.search;
  if (params.featured !== undefined) q["featured"] = String(params.featured);
  if (params.trending !== undefined) q["trending"] = String(params.trending);
  if (params.sort) q["sort"] = params.sort;
  return q;
}

/**
 * Public content endpoints — no auth needed. Article detail pages
 * prefer server fetch (SEO); interactive sections use these hooks.
 */
export const contentApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listArticles: build.query<PagedArticles, ListArticlesParams | void>({
      query: (params) => ({ url: "/articles", params: params ? toQuery(params) : undefined }),
      transformResponse: (res: Envelope<PagedArticles>) => res.data,
      providesTags: (result) => [
        ...(result?.items.map((a) => ({ type: "Article" as const, id: a.slug })) ?? []),
        { type: "Article" as const, id: "LIST" },
      ],
    }),
    articleBySlug: build.query<ArticleDetail, string>({
      query: (slug) => `/articles/${slug}`,
      transformResponse: (res: Envelope<ArticleDetail>) => res.data,
      providesTags: (_r, _e, slug) => [{ type: "Article", id: slug }],
    }),
    listCategories: build.query<Category[], void>({
      query: () => "/categories",
      transformResponse: (res: Envelope<Category[]>) => res.data,
    }),
    popularAuthors: build.query<PopularAuthor[], number | void>({
      query: (limit) => ({
        url: "/users/authors/popular",
        params: limit ? { limit: String(limit) } : undefined,
      }),
      transformResponse: (res: Envelope<PopularAuthor[]>) => res.data,
      providesTags: ["User"],
    }),
    subscribeNewsletter: build.mutation<
      { subscribed: boolean },
      { email: string; name?: string; consent: boolean; consentText?: string; source?: string }
    >({
      query: (body) => ({
        url: "/newsletter/subscribe",
        method: "POST",
        body: { source: "homepage", ...body },
      }),
      transformResponse: (res: Envelope<{ subscribed: boolean }>) => res.data,
    }),
    unsubscribeNewsletter: build.mutation<{ unsubscribed: boolean }, { email: string }>({
      query: (body) => ({
        url: "/newsletter/unsubscribe",
        method: "POST",
        body,
      }),
      transformResponse: (res: Envelope<{ unsubscribed: boolean }>) => res.data,
    }),
    trackView: build.mutation<{ counted: boolean }, { slug: string; viewerId: string; referrer?: string }>({
      query: ({ slug, ...body }) => ({
        url: `/articles/${slug}/views`,
        method: "POST",
        body,
      }),
      transformResponse: (res: Envelope<{ counted: boolean }>) => res.data,
    }),
    engagementState: build.query<EngagementState, string>({
      query: (slug) => `/articles/${slug}/state`,
      transformResponse: (res: Envelope<EngagementState>) => res.data,
      providesTags: (_r, _e, slug) => [{ type: "Engagement", id: slug }],
    }),
    toggleLike: build.mutation<LikeResult, string>({
      query: (slug) => ({ url: `/articles/${slug}/like`, method: "POST" }),
      transformResponse: (res: Envelope<LikeResult>) => res.data,
      invalidatesTags: (_r, _e, slug) => [
        { type: "Engagement", id: slug },
        { type: "Article", id: slug },
      ],
    }),
    toggleBookmark: build.mutation<BookmarkResult, string>({
      query: (slug) => ({ url: `/articles/${slug}/bookmark`, method: "POST" }),
      transformResponse: (res: Envelope<BookmarkResult>) => res.data,
      invalidatesTags: (_r, _e, slug) => [
        { type: "Engagement", id: slug },
        { type: "Article", id: slug },
      ],
    }),
    listComments: build.query<PagedComments, { slug: string; page?: number; filter?: "pending" | "all" }>({
      query: ({ slug, page, filter }) => ({
        url: `/articles/${slug}/comments`,
        params: {
          ...(page ? { page: String(page) } : {}),
          ...(filter ? { filter } : {}),
        },
      }),
      transformResponse: (res: Envelope<PagedComments>) => res.data,
      providesTags: (_r, _e, arg) => [{ type: "Comment", id: `list:${arg.slug}` }],
    }),
    addComment: build.mutation<PostComment, { slug: string; content: string; parent?: string }>({
      query: ({ slug, ...body }) => ({
        url: `/articles/${slug}/comments`,
        method: "POST",
        body,
      }),
      transformResponse: (res: Envelope<PostComment>) => res.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: "Comment", id: `list:${arg.slug}` },
        { type: "Article", id: arg.slug },
      ],
    }),
    updateComment: build.mutation<PostComment, { slug: string; id: string; content: string }>({
      query: ({ slug, id, content }) => ({
        url: `/articles/${slug}/comments/${id}`,
        method: "PATCH",
        body: { content },
      }),
      transformResponse: (res: Envelope<PostComment>) => res.data,
      invalidatesTags: (_r, _e, arg) => [{ type: "Comment", id: `list:${arg.slug}` }],
    }),
    deleteComment: build.mutation<{ deleted: boolean; tombstoned: boolean }, { slug: string; id: string }>({
      query: ({ slug, id }) => ({
        url: `/articles/${slug}/comments/${id}`,
        method: "DELETE",
      }),
      transformResponse: (res: Envelope<{ deleted: boolean; tombstoned: boolean }>) => res.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: "Comment", id: `list:${arg.slug}` },
        { type: "Article", id: arg.slug },
      ],
    }),
    toggleCommentLike: build.mutation<{ liked: boolean; likeCount: number }, { slug: string; id: string }>({
      query: ({ slug, id }) => ({
        url: `/articles/${slug}/comments/${id}/like`,
        method: "POST",
      }),
      transformResponse: (res: Envelope<{ liked: boolean; likeCount: number }>) => res.data,
      invalidatesTags: (_r, _e, arg) => [{ type: "Comment", id: `list:${arg.slug}` }],
    }),
    reportComment: build.mutation<{ flagCount: number; status: string }, { slug: string; id: string; reason: ReportReason }>({
      query: ({ slug, id, reason }) => ({
        url: `/articles/${slug}/comments/${id}/report`,
        method: "POST",
        body: { reason },
      }),
      transformResponse: (res: Envelope<{ flagCount: number; status: string }>) => res.data,
      invalidatesTags: (_r, _e, arg) => [{ type: "Comment", id: `list:${arg.slug}` }],
    }),
    moderateComment: build.mutation<PostComment, { slug: string; id: string; status: ModerationStatus }>({
      query: ({ slug, id, status }) => ({
        url: `/articles/${slug}/comments/${id}/moderate`,
        method: "PATCH",
        body: { status },
      }),
      transformResponse: (res: Envelope<PostComment>) => res.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: "Comment", id: `list:${arg.slug}` },
        { type: "Article", id: arg.slug },
      ],
    }),
    suggestArticles: build.query<SuggestResults, string>({
      query: (q) => ({ url: "/articles/suggest", params: { q } }),
      transformResponse: (res: Envelope<SuggestResults>) => res.data,
    }),
    adminListCategories: build.query<AdminCategory[], void>({
      query: () => "/categories/all",
      transformResponse: (res: Envelope<AdminCategory[]>) => res.data,
      providesTags: [{ type: "Category", id: "LIST" }],
    }),
    createCategory: build.mutation<AdminCategory, CategoryInput>({
      query: (body) => ({ url: "/categories", method: "POST", body }),
      transformResponse: (res: Envelope<AdminCategory>) => res.data,
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),
    updateCategory: build.mutation<AdminCategory, { id: string } & Partial<CategoryInput>>({
      query: ({ id, ...body }) => ({ url: `/categories/${id}`, method: "PATCH", body }),
      transformResponse: (res: Envelope<AdminCategory>) => res.data,
      invalidatesTags: [{ type: "Category", id: "LIST" }],
    }),
    deleteCategory: build.mutation<DeleteCategoryResult, { id: string; reassignTo?: string }>({
      query: ({ id, reassignTo }) => ({
        url: `/categories/${id}${reassignTo ? `?reassignTo=${reassignTo}` : ""}`,
        method: "DELETE",
      }),
      transformResponse: (res: Envelope<DeleteCategoryResult>) => res.data,
      invalidatesTags: [{ type: "Category", id: "LIST" }, { type: "Article", id: "LIST" }],
    }),
    adminListTags: build.query<AdminTag[], void>({
      query: () => ({ url: "/tags/all", params: { limit: "200" } }),
      transformResponse: (res: Envelope<AdminTag[]>) => res.data,
      providesTags: [{ type: "Tag", id: "LIST" }],
    }),
    createTag: build.mutation<AdminTag, TagInput>({
      query: (body) => ({ url: "/tags", method: "POST", body }),
      transformResponse: (res: Envelope<AdminTag>) => res.data,
      invalidatesTags: [{ type: "Tag", id: "LIST" }],
    }),
    updateTag: build.mutation<AdminTag, { id: string } & Partial<TagInput>>({
      query: ({ id, ...body }) => ({ url: `/tags/${id}`, method: "PATCH", body }),
      transformResponse: (res: Envelope<AdminTag>) => res.data,
      invalidatesTags: [{ type: "Tag", id: "LIST" }],
    }),
    deleteTag: build.mutation<DeleteTagResult, { id: string; detach?: boolean }>({
      query: ({ id, detach }) => ({
        url: `/tags/${id}${detach ? "?detach=true" : ""}`,
        method: "DELETE",
      }),
      transformResponse: (res: Envelope<DeleteTagResult>) => res.data,
      invalidatesTags: [{ type: "Tag", id: "LIST" }, { type: "Article", id: "LIST" }],
    }),
    authorProfile: build.query<AuthorProfile, string>({
      query: (username) => `/authors/${username}`,
      transformResponse: (res: Envelope<AuthorProfile>) => res.data,
      providesTags: (_r, _e, username) => [{ type: "User", id: `author:${username}` }],
    }),
    followState: build.query<FollowState, string>({
      query: (username) => `/follows/${username}/state`,
      transformResponse: (res: Envelope<FollowState>) => res.data,
      providesTags: (_r, _e, username) => [{ type: "Follow", id: username }],
    }),
    toggleFollow: build.mutation<FollowResult, string>({
      query: (username) => ({ url: `/follows/${username}/toggle`, method: "POST" }),
      transformResponse: (res: Envelope<FollowResult>) => res.data,
      invalidatesTags: (_r, _e, username) => [
        { type: "Follow", id: username },
        { type: "User", id: `author:${username}` },
      ],
    }),
    myBookmarks: build.query<PagedArticles, { page?: number }>({
      query: ({ page }) => ({
        url: "/users/me/bookmarks",
        params: page ? { page: String(page) } : undefined,
      }),
      transformResponse: (res: Envelope<PagedArticles>) => res.data,
      providesTags: [{ type: "Bookmark", id: "LIST" }],
    }),
    myStats: build.query<MyStats, void>({
      query: () => "/users/me/stats",
      transformResponse: (res: Envelope<MyStats>) => res.data,
      providesTags: ["User", "Bookmark", "Follow", "Article"],
    }),
    listNotifications: build.query<PagedNotifications, { page?: number }>({
      query: ({ page }) => ({
        url: "/notifications",
        params: page ? { page: String(page) } : undefined,
      }),
      transformResponse: (res: Envelope<PagedNotifications>) => res.data,
      providesTags: [{ type: "Notification", id: "LIST" }],
    }),
    markNotificationRead: build.mutation<{ id: string; isRead: boolean }, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      transformResponse: (res: Envelope<{ id: string; isRead: boolean }>) => res.data,
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
    markAllNotificationsRead: build.mutation<{ updated: number }, void>({
      query: () => ({ url: "/notifications/read-all", method: "PATCH" }),
      transformResponse: (res: Envelope<{ updated: number }>) => res.data,
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
    announceNotification: build.mutation<{ sent: number }, { title: string; body?: string }>({
      query: (body) => ({ url: "/notifications/announce", method: "POST", body }),
      transformResponse: (res: Envelope<{ sent: number }>) => res.data,
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
  }),
});

export const {
  useListArticlesQuery,
  useArticleBySlugQuery,
  useListCategoriesQuery,
  usePopularAuthorsQuery,
  useSubscribeNewsletterMutation,
  useTrackViewMutation,
  useEngagementStateQuery,
  useToggleLikeMutation,
  useToggleBookmarkMutation,
  useListCommentsQuery,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useToggleCommentLikeMutation,
  useReportCommentMutation,
  useModerateCommentMutation,
  useSuggestArticlesQuery,
  useAdminListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useAdminListTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
  useFollowStateQuery,
  useToggleFollowMutation,
  useMyBookmarksQuery,
  useMyStatsQuery,
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useUnsubscribeNewsletterMutation,
  useAnnounceNotificationMutation,
} = contentApi;
