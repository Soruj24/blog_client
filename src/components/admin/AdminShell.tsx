"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import {
  ArrowUp,
  BarChart3,
  ChevronRight,
  FileText,
  Folder,
  Home,
  Image,
  LayoutDashboard,
  Mail,
  Menu,
  MessagesSquare,
  Newspaper,
  Settings,
  Tags,
  Users,
  X,
} from "lucide-react";
import { cx, focusRing } from "@/src/components/ui/shared";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: Folder },
  { href: "/admin/tags", label: "Tags", icon: Tags },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/comments", label: "Comments", icon: MessagesSquare },
  { href: "/admin/media", label: "Media", icon: Image },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const NAV_GROUPS = [
  { label: "Overview", items: [ADMIN_NAV[0]] },
  { label: "Content", items: ADMIN_NAV.slice(1, 4) },
  { label: "Community", items: ADMIN_NAV.slice(4, 6) },
  { label: "System", items: ADMIN_NAV.slice(6) },
];

const LABELS: Record<string, string> = Object.fromEntries(
  ADMIN_NAV.map((n) => [n.href, n.label]),
);

function isActive(pathname: string, item: AdminNavItem): boolean {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/* ------------------------------------------------------------------ */
/*  NavLinks — sidebar navigation items                                */
/* ------------------------------------------------------------------ */

function NavLinks({ onNavigate, pathname }: { onNavigate?: () => void; pathname: string }) {
  return (
    <nav aria-label="Admin navigation">
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.label} className={cx(gi > 0 && "mt-6")}>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(pathname, item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors duration-150",
                      focusRing,
                      active
                        ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                    )}
                  >
                    <item.icon
                      className={cx(
                        "h-4 w-4 shrink-0 transition-colors",
                        active
                          ? "text-white dark:text-zinc-900"
                          : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300",
                      )}
                      aria-hidden
                    />
                    {item.label}
                    {item.badge && (
                      <span
                        className={cx(
                          "ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                          active
                            ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                            : "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Breadcrumbs                                                        */
/* ------------------------------------------------------------------ */

function Breadcrumbs({ pathname }: { pathname: string }) {
  const crumbs =
    pathname === "/admin"
      ? [{ href: "/admin", label: "Dashboard" }]
      : [
          { href: "/admin", label: "Dashboard" },
          {
            href: pathname,
            label:
              LABELS[pathname] ??
              pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") ??
              "Details",
          },
        ];
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-400 dark:text-zinc-500">
        <li>
          <Link
            href="/"
            className="inline-flex items-center gap-1 transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Site</span>
          </Link>
        </li>
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-zinc-300 dark:text-zinc-600" aria-hidden />
            {i === crumbs.length - 1 ? (
              <span
                aria-current="page"
                className="font-medium text-zinc-900 dark:text-zinc-100"
              >
                {c.label}
              </span>
            ) : (
              <Link
                href={c.href}
                className="transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  AdminShell                                                         */
/* ------------------------------------------------------------------ */

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const close = useCallback(() => setOpen(false), []);

  // Close mobile drawer on route change
  const prevPathname = useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setOpen(false);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  // Scroll progress + scroll-to-top visibility
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const { scrollTop, scrollHeight, clientHeight } = el;
          const maxScroll = scrollHeight - clientHeight;
          const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
          setScrollProgress(progress);
          setShowScrollTop(scrollTop > 300);
          ticking = false;
        });
        ticking = true;
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Focus trap + escape + body scroll lock
  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement;

    const drawer = drawerRef.current;
    if (!drawer) return;

    const focusable = drawer.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length > 0) focusable[0]!.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      previousFocusRef.current?.focus();
    };
  }, [open, close]);

  return (
    <div className="admin-shell flex h-screen flex-col overflow-hidden lg:flex-row">
      {/* ── Scroll progress indicator ──────────────────────────────── */}
      <div
        className="scroll-progress"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden
      />

      {/* ── Desktop sidebar ────────────────────────────────────────── */}
      <aside
        className="admin-sidebar hidden w-64 shrink-0 border-r border-zinc-200 bg-white lg:flex lg:flex-col dark:border-zinc-800 dark:bg-zinc-950"
        aria-label="Admin navigation"
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-zinc-200 px-5 dark:border-zinc-800">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
              <Newspaper className="h-4 w-4 text-white dark:text-zinc-900" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Inkwell
              </p>
              <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Admin
              </p>
            </div>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4 admin-scroll">
          <NavLinks pathname={pathname} />
        </div>
      </aside>

      {/* ── Mobile drawer ──────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" ref={drawerRef}>
          <div
            aria-hidden
            onClick={close}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
                  <Newspaper className="h-4 w-4 text-white dark:text-zinc-900" aria-hidden />
                </div>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Admin
                </span>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close navigation"
                className={cx(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                  focusRing,
                )}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4 admin-scroll">
              <NavLinks pathname={pathname} />
            </div>
          </div>
        </div>
      )}

      {/* ── Main content area ──────────────────────────────────────── */}
      <div className="admin-main flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile header bar */}
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-zinc-200 px-4 lg:hidden dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open admin navigation"
            className={cx(
              "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
              focusRing,
            )}
          >
            <Menu className="h-4 w-4" aria-hidden />
          </button>
          <Breadcrumbs pathname={pathname} />
        </div>

        {/* Desktop breadcrumbs */}
        <div className="hidden h-12 shrink-0 items-center border-b border-zinc-200 px-6 lg:flex dark:border-zinc-800">
          <Breadcrumbs pathname={pathname} />
        </div>

        {/* Scrollable page content */}
        <div
          ref={mainRef}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 admin-scroll"
        >
          {children}
        </div>
      </div>

      {/* ── Scroll to top button ───────────────────────────────────── */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={cx(
          "scroll-top-btn fixed bottom-6 right-6 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-all hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300",
          showScrollTop && "visible",
        )}
      >
        <ArrowUp className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
