import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "next-auth/react";

/**
 * RTK Query base API.
 * Feature endpoints (articles, comments, users...) use injectEndpoints
 * in their own files, e.g. src/store/api/articlesApi.ts (Phase 2+).
 *
 * Auth: the Express bearer token lives on the Auth.js session
 * (see auth.ts). prepareHeaders is async — next-auth caches the
 * session client-side, so this adds no extra network hop per call.
 * No secrets are hardcoded; logged-out users simply omit the header
 * and can still reach public endpoints.
 */
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1",
    credentials: "include",
    prepareHeaders: async (headers) => {
      if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      try {
        const session = await getSession();
        if (session?.backendToken) {
          headers.set("Authorization", `Bearer ${session.backendToken}`);
        }
      } catch {
        // Unauthenticated — public endpoints still work without the header.
      }
      return headers;
    },
  }),
  tagTypes: [
    "Article",
    "Comment",
    "User",
    "Like",
    "Bookmark",
    "Follow",
    "Engagement",
    "Category",
    "Tag",
    "Notification",
    "Admin",
  ] as const,
  endpoints: () => ({}),
});
