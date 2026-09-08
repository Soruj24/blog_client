import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role?: string;
    username?: string;
    backendToken?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      username?: string;
    };
    /** Express API bearer token (HS256, 7d) — attached by RTK Query. */
    backendToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    username?: string;
    backendToken?: string;
  }
}
