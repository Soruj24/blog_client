import { z } from "zod";

/**
 * Client-safe env validation.
 * NEVER put secrets here. Only NEXT_PUBLIC_* vars are exposed to the browser.
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:5000/api/v1"),
  NEXT_PUBLIC_SOCKET_URL: z.string().url().default("http://localhost:5000"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

function getClientEnv(): ClientEnv {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  });
}

export const clientEnv = getClientEnv();
