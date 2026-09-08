import { baseApi } from "./baseApi";

/* ------------------------------- types ---------------------------------- */

export interface AdminStats {
  posts: { total: number; published: number; draft: number; scheduled: number; archived: number };
  users: { total: number };
  comments: { total: number; pending: number };
  views: number;
  likes: number;
  bookmarks: number;
  newsletter: { active: number };
}

export interface AdminPost {
  _id: string;
  title: string;
  slug: string;
  status: string;
  visibility: string;
  views: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string | null;
  createdAt: string;
  author: { _id: string; name: string } | null;
  category: { _id: string; name: string; slug: string } | null;
}

export interface AdminComment {
  _id: string;
  content: string;
  status: string;
  likeCount: number;
  createdAt: string;
  author: { _id: string; name: string; email: string } | null;
  post: { _id: string; title: string; slug: string } | null;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface AdminMedia {
  _id: string;
  url: string;
  publicId: string;
  resourceType: string;
  format: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  alt: string;
  usage: string;
  folder: string;
  createdAt: string;
  owner: { _id: string; name: string; email?: string } | null;
  post: { _id: string; title: string; slug: string } | null;
}

export interface AdminSubscriber {
  _id: string;
  email: string;
  name: string | null;
  status: string;
  source: string;
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  postsPerPage: number;
  featuredLimit: number;
  registrationEnabled: boolean;
  commentsEnabled: boolean;
  newsletterEnabled: boolean;
  maintenanceMode: boolean;
  twitterUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  defaultSeoTitle: string | null;
  defaultSeoDescription: string | null;
}

export interface Analytics {
  days: string[];
  views: number[];
  uniqueVisitors: number[];
  posts: number[];
  users: number[];
  engagement: { likes: number[]; bookmarks: number[]; comments: number[] };
  totals: { views: number; uniqueVisitors: number; likes: number; bookmarks: number; comments: number };
  popular: Array<{ _id: string; title: string; slug: string; views: number; likes: number }>;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

/* ------------------------------ endpoints ------------------------------- */

export const adminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    adminStats: build.query<AdminStats, void>({
      query: () => "/admin/stats",
      transformResponse: (res: Envelope<AdminStats>) => res.data,
      providesTags: [{ type: "Admin", id: "STATS" }],
    }),
    adminPosts: build.query<
      Paged<AdminPost>,
      { page?: number; status?: string; search?: string }
    >({
      query: (p) => ({
        url: "/admin/posts",
        params: {
          ...(p.page ? { page: String(p.page) } : {}),
          ...(p.status ? { status: p.status } : {}),
          ...(p.search ? { search: p.search } : {}),
        },
      }),
      transformResponse: (res: Envelope<Paged<AdminPost>>) => res.data,
      providesTags: [{ type: "Admin", id: "POSTS" }],
    }),
    bulkPosts: build.mutation<
      { updated: number },
      { ids: string[]; action: "publish" | "draft" | "archive" | "delete" }
    >({
      query: (body) => ({ url: "/admin/posts/bulk", method: "PATCH", body }),
      transformResponse: (res: Envelope<{ updated: number }>) => res.data,
      invalidatesTags: [
        { type: "Admin", id: "POSTS" },
        { type: "Admin", id: "STATS" },
        { type: "Article", id: "LIST" },
      ],
    }),
    adminComments: build.query<
      Paged<AdminComment>,
      { page?: number; status?: string; search?: string }
    >({
      query: (p) => ({
        url: "/admin/comments",
        params: {
          ...(p.page ? { page: String(p.page) } : {}),
          ...(p.status ? { status: p.status } : {}),
          ...(p.search ? { search: p.search } : {}),
        },
      }),
      transformResponse: (res: Envelope<Paged<AdminComment>>) => res.data,
      providesTags: [{ type: "Admin", id: "COMMENTS" }],
    }),
    bulkComments: build.mutation<
      { updated: number },
      { ids: string[]; action: "approve" | "reject" | "spam" | "delete" }
    >({
      query: (body) => ({ url: "/admin/comments/bulk", method: "PATCH", body }),
      transformResponse: (res: Envelope<{ updated: number }>) => res.data,
      invalidatesTags: [
        { type: "Admin", id: "COMMENTS" },
        { type: "Admin", id: "STATS" },
      ],
    }),
    adminUsers: build.query<
      Paged<AdminUser>,
      { page?: number; role?: string; status?: string; search?: string }
    >({
      query: (p) => ({
        url: "/users",
        params: {
          ...(p.page ? { page: String(p.page) } : {}),
          limit: "20",
          ...(p.role ? { role: p.role } : {}),
          ...(p.status ? { status: p.status } : {}),
          ...(p.search ? { search: p.search } : {}),
        },
      }),
      transformResponse: (res: Envelope<Paged<AdminUser>>) => res.data,
      providesTags: [{ type: "Admin", id: "USERS" }],
    }),
    updateUser: build.mutation<AdminUser, { id: string; role?: string; status?: string }>({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: "PATCH", body }),
      transformResponse: (res: Envelope<AdminUser>) => res.data,
      invalidatesTags: [
        { type: "Admin", id: "USERS" },
        { type: "Admin", id: "STATS" },
      ],
    }),
    bulkUsers: build.mutation<{ updated: number }, { ids: string[]; status: string }>({
      query: (body) => ({ url: "/admin/users/bulk", method: "PATCH", body }),
      transformResponse: (res: Envelope<{ updated: number }>) => res.data,
      invalidatesTags: [
        { type: "Admin", id: "USERS" },
        { type: "Admin", id: "STATS" },
      ],
    }),
    adminMedia: build.query<Paged<AdminMedia>, { page?: number; usage?: string; search?: string; format?: string }>({
      query: (p) => ({
        url: "/admin/media",
        params: {
          ...(p.page ? { page: String(p.page) } : {}),
          ...(p.usage ? { usage: p.usage } : {}),
          ...(p.search ? { search: p.search } : {}),
          ...(p.format ? { format: p.format } : {}),
        },
      }),
      transformResponse: (res: Envelope<Paged<AdminMedia>>) => res.data,
      providesTags: [{ type: "Admin", id: "MEDIA" }],
    }),
    deleteMedia: build.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/admin/media/${id}`, method: "DELETE" }),
      transformResponse: (res: Envelope<{ deleted: boolean }>) => res.data,
      invalidatesTags: [{ type: "Admin", id: "MEDIA" }],
    }),
    updateMedia: build.mutation<AdminMedia, { id: string; alt?: string; usage?: string }>({
      query: ({ id, ...body }) => ({ url: `/media/${id}`, method: "PATCH", body }),
      transformResponse: (res: Envelope<AdminMedia>) => res.data,
      invalidatesTags: [{ type: "Admin", id: "MEDIA" }],
    }),
    adminNewsletter: build.query<
      Paged<AdminSubscriber> & { counts: Record<string, number> },
      { page?: number; status?: string; search?: string }
    >({
      query: (p) => ({
        url: "/admin/newsletter",
        params: {
          ...(p.page ? { page: String(p.page) } : {}),
          ...(p.status ? { status: p.status } : {}),
          ...(p.search ? { search: p.search } : {}),
        },
      }),
      transformResponse: (
        res: Envelope<Paged<AdminSubscriber> & { counts: Record<string, number> }>,
      ) => res.data,
      providesTags: [{ type: "Admin", id: "NEWSLETTER" }],
    }),
    deleteSubscriber: build.mutation<{ deleted: boolean }, string>({
      query: (id) => ({ url: `/admin/newsletter/${id}`, method: "DELETE" }),
      transformResponse: (res: Envelope<{ deleted: boolean }>) => res.data,
      invalidatesTags: [
        { type: "Admin", id: "NEWSLETTER" },
        { type: "Admin", id: "STATS" },
      ],
    }),
    updateSubscriber: build.mutation<AdminSubscriber, { id: string; status: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/newsletter/${id}`, method: "PATCH", body }),
      transformResponse: (res: Envelope<AdminSubscriber>) => res.data,
      invalidatesTags: [{ type: "Admin", id: "NEWSLETTER" }],
    }),
    siteSettings: build.query<SiteSettings, void>({
      query: () => "/admin/settings",
      transformResponse: (res: Envelope<SiteSettings>) => res.data,
      providesTags: [{ type: "Admin", id: "SETTINGS" }],
    }),
    updateSettings: build.mutation<SiteSettings, Partial<SiteSettings>>({
      query: (body) => ({ url: "/admin/settings", method: "PATCH", body }),
      transformResponse: (res: Envelope<SiteSettings>) => res.data,
      invalidatesTags: [{ type: "Admin", id: "SETTINGS" }],
    }),
    analytics: build.query<Analytics, 1 | 7 | 30 | 90 | { start: string; end: string }>({
      query: (arg) => {
        if (typeof arg === "object" && "start" in arg) {
          return { url: "/admin/analytics", params: { start: arg.start, end: arg.end } };
        }
        return { url: "/admin/analytics", params: { days: String(arg as number) } };
      },
      transformResponse: (res: Envelope<Analytics>) => res.data,
    }),
  }),
});

export const {
  useAdminStatsQuery,
  useAdminPostsQuery,
  useBulkPostsMutation,
  useAdminCommentsQuery,
  useBulkCommentsMutation,
  useAdminUsersQuery,
  useUpdateUserMutation,
  useBulkUsersMutation,
  useAdminMediaQuery,
  useDeleteMediaMutation,
  useUpdateMediaMutation,
  useAdminNewsletterQuery,
  useDeleteSubscriberMutation,
  useUpdateSubscriberMutation,
  useSiteSettingsQuery,
  useUpdateSettingsMutation,
  useAnalyticsQuery,
} = adminApi;
