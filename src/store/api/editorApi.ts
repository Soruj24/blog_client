import { baseApi } from "./baseApi";

export interface EditorPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: { _id: string; name: string; slug: string } | null;
  tags: Array<{ _id: string; name: string; slug: string }>;
  status: string;
  visibility: string;
  featured: boolean;
  trending: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  ogImage: string | null;
  noIndex: boolean;
  scheduledAt: string | null;
  publishedAt: string | null;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostPayload {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string | null;
  category?: string | null;
  tags?: string[];
  status?: string;
  visibility?: string;
  featured?: boolean;
  trending?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
  noIndex?: boolean;
  scheduledAt?: string | null;
}

export interface UploadResult {
  url: string;
  publicId: string;
  mediaId: string;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

export const editorApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPostForEdit: build.query<EditorPost, string>({
      query: (id) => `/articles/id/${id}`,
      transformResponse: (res: Envelope<EditorPost>) => res.data,
      providesTags: (_r, _e, id) => [{ type: "Article", id }],
    }),
    createPost: build.mutation<EditorPost, CreatePostPayload>({
      query: (body) => ({ url: "/articles", method: "POST", body }),
      transformResponse: (res: Envelope<EditorPost>) => res.data,
      invalidatesTags: [
        { type: "Article", id: "LIST" },
        { type: "Admin", id: "POSTS" },
      ],
    }),
    updatePost: build.mutation<EditorPost, { id: string; body: CreatePostPayload }>({
      query: ({ id, body }) => ({ url: `/articles/${id}`, method: "PATCH", body }),
      transformResponse: (res: Envelope<EditorPost>) => res.data,
      invalidatesTags: (_r, _e, arg) => [
        { type: "Article", id: arg.id },
        { type: "Article", id: "LIST" },
        { type: "Admin", id: "POSTS" },
      ],
    }),
  myPosts: build.query<
      { items: Array<{ _id: string; title: string; slug: string; status: string; updatedAt: string }>; total: number; page: number; limit: number },
      { page?: number; status?: string }
    >({
      query: (p) => ({
        url: "/articles/mine/list",
        params: {
          ...(p.page ? { page: String(p.page) } : {}),
          ...(p.status ? { status: p.status } : {}),
        },
      }),
      transformResponse: (
        res: Envelope<{ items: Array<{ _id: string; title: string; slug: string; status: string; updatedAt: string }>; total: number; page: number; limit: number }>,
      ) => res.data,
      providesTags: [{ type: "Article", id: "LIST" }],
    }),
    categories: build.query<Array<{ _id: string; name: string; slug: string }>, void>({
      query: () => "/categories",
      transformResponse: (res: Envelope<Array<{ _id: string; name: string; slug: string }>>) => res.data,
    }),
    tags: build.query<Array<{ _id: string; name: string; slug: string }>, void>({
      query: () => "/tags?limit=100",
      transformResponse: (res: Envelope<Array<{ _id: string; name: string; slug: string }>>) => res.data,
    }),
  }),
});

export const {
  useGetPostForEditQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useMyPostsQuery,
  useCategoriesQuery,
  useTagsQuery,
} = editorApi;
