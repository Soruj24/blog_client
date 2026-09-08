import {
  Bell,
  Bookmark,
  Compass,
  Flame,
  House,
  LayoutDashboard,
  LayoutGrid,
  ShieldCheck,
  SquarePen,
  User,
  type LucideIcon,
} from "lucide-react";

/**
 * SINGLE SOURCE OF TRUTH for navigation.
 * Desktop nav, mobile drawer, and user menu all consume these —
 * never hardcode a nav href/label anywhere else.
 */

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  /** "exact" for /, "prefix" for sections (/explore/trending…). */
  match: "exact" | "prefix";
}

export const PRIMARY_LINKS: NavLink[] = [
  { href: "/", label: "Home", icon: House, match: "exact" },
  { href: "/blog", label: "Explore", icon: Compass, match: "prefix" },
  { href: "/categories", label: "Categories", icon: LayoutGrid, match: "prefix" },
  { href: "/trending", label: "Trending", icon: Flame, match: "prefix" },
];

export function isActiveLink(pathname: string, link: NavLink): boolean {
  if (link.match === "exact") return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
  username?: string;
}

/** Central role check — future role renames touch this function only. */
export function isAdminRole(role?: string | null): boolean {
  return role === "admin";
}

export interface UserMenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const ALL_USER_ITEMS: UserMenuItem[] = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/admin", label: "Admin Dashboard", icon: ShieldCheck, adminOnly: true },
];

/** Role-filtered account menu. Logout is rendered separately (an action, not a link). */
export function getUserMenuItems(role?: string | null): UserMenuItem[] {
  return ALL_USER_ITEMS.filter((item) => !item.adminOnly || isAdminRole(role));
}

export const WRITE_LINK: NavLink = {
  href: "/write",
  label: "Write",
  icon: SquarePen,
  match: "prefix",
};
