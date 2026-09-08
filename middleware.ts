import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Route protection — Edge-safe by design.
 * Must NEVER import "@/auth" here: the full Auth.js config pulls in the
 * MongoDB driver + node:crypto, which crash the Edge runtime (500s on
 * every matched route). Instead we verify the JWT session cookie
 * directly (jose/WebCrypto, edge-compatible); role comes from the
 * token claims our Auth.js jwt() callback sets.
 * - /dashboard/*, /write/* → any signed-in user (else /login?callbackUrl=…)
 * - /admin/* → role === "admin" (else home)
 * Public reading stays open — SEO pages are never gated.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let role: string | undefined;
  let signedIn = false;
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    signedIn = !!token;
    role = token?.role as string | undefined;
  } catch {
    signedIn = false;
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (
    (pathname.startsWith("/dashboard") || pathname.startsWith("/write")) &&
    !signedIn
  ) {
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/write/:path*", "/admin/:path*"],
};
