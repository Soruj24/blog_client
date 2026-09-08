import { baseApi } from "./baseApi";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  username: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

/**
 * Auth + self endpoints. Register is public; /users/me/* require the
 * session bearer token (attached by baseApi.prepareHeaders).
 * `token` in AuthResponse is consumed by Auth.js sign-in — RTK callers
 * should use the session, not store it manually.
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    register: build.mutation<
      AuthResponse,
      { name: string; email: string; password: string; username?: string }
    >({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: (res: Envelope<AuthResponse>) => res.data,
    }),
    getMe: build.query<{ user: AuthUser; profile: unknown }, void>({
      query: () => "/users/me",
      transformResponse: (
        res: Envelope<{ user: AuthUser; profile: unknown }>,
      ) => res.data,
      providesTags: ["User"],
    }),
    updateMe: build.mutation<AuthUser, { name?: string; image?: string }>({
      query: (body) => ({ url: "/users/me", method: "PATCH", body }),
      transformResponse: (res: Envelope<AuthUser>) => res.data,
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useGetMeQuery,
  useUpdateMeMutation,
} = authApi;
