import { clientEnv } from "./env";

export class ApiClientError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string;
};

/**
 * Thin fetch wrapper for the Express API.
 * - Keeps base URL in one place
 * - Sends cookies for Auth.js session flows where needed
 * - Never imports server secrets
 */
export async function apiClient<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { body, token, headers, ...rest } = options;

  const res = await fetch(`${clientEnv.NEXT_PUBLIC_API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // non-JSON error body
    }
    throw new ApiClientError(
      res.status,
      `API ${res.status} on ${path}`,
      data,
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
