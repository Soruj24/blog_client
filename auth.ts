import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { MongoClient } from "mongodb";

/**
 * Auth.js (NextAuth v5) — server-only configuration.
 *
 * Flow: Credentials authorize() calls Express POST /auth/login
 * (server-to-server via API_INTERNAL_URL, never exposed to the browser).
 * Express verifies the bcrypt password and returns its own HS256 JWT;
 * that backendToken is persisted in the Auth.js JWT and exposed on the
 * session so RTK Query can attach it as `Authorization: Bearer`.
 * requireAuth on Express verifies the same token (shared AUTH_SECRET).
 *
 * Required server env (see .env.example):
 *   AUTH_SECRET, AUTH_MONGODB_URI, API_INTERNAL_URL
 */

const mongoUri = process.env.AUTH_MONGODB_URI;
// Adapter is created only when configured — keeps `next build` (which
// evaluates this module without env) working; runtime requires the URI.
const adapter = mongoUri ? MongoDBAdapter(new MongoClient(mongoUri)) : undefined;

const apiBase =
  process.env.API_INTERNAL_URL ?? "http://localhost:5000/api/v1";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.["email"];
        const password = credentials?.["password"];
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }
        const res = await fetch(`${apiBase}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) return null;
        const json = (await res.json()) as {
          data?: {
            user?: {
              id: string;
              name: string;
              email: string;
              role: string;
              image?: string | null;
              username?: string;
            };
            token?: string;
          };
        };
        if (!json.data?.user || !json.data.token) return null;
        const { user, token } = json.data;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image ?? undefined,
          role: user.role,
          username: user.username,
          backendToken: token,
        };
      },
    }),
    // Phase 1b: Google/GitHub OAuth via AUTH_GOOGLE_* / AUTH_GITHUB_*.
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.username = user.username;
        token.backendToken = user.backendToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = token.role;
      session.user.username = token.username;
      session.backendToken = token.backendToken;
      return session;
    },
  },
});
