"use client";

import { LogOut, Menu, SquarePen, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/src/components/ui/Avatar";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { cx, focusRing, hairline } from "@/src/components/ui/shared";
import {
  WRITE_LINK,
  getUserMenuItems,
} from "@/src/config/navigation";
import { NavLinks } from "./NavLinks";

/**
 * Mobile navigation drawer (lg:hidden). Slide-over from the left with
 * overlay, ESC, scroll-lock, initial focus, and auto-close on route
 * change. Reuses NavLinks + getUserMenuItems — no duplicated nav logic.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  // Close on navigation (covers back-button + programmatic nav;
  // link taps close via onNavigate/go directly). Render-time state
  // adjustment — the documented pattern for syncing to route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    previousActiveRef.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute("hidden"));
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      // Return focus to trigger
      (triggerRef.current ?? previousActiveRef.current)?.focus();
    };
  }, [open]);

  const user = session?.user;
  const displayName = user?.name ?? user?.username ?? user?.email ?? "Account";
  const closeMenu = () => setOpen(false);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-nav-dialog"
        aria-label="Open navigation menu"
        className={cx(
          "inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-100 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-900",
          focusRing,
        )}
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              aria-hidden
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/50 animate-overlay-in"
            />
            <div
              ref={panelRef}
              id="mobile-nav-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
              tabIndex={-1}
              className={cx(
                "absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-overlay dark:bg-zinc-950",
                "animate-drop-in",
              )}
            >
              <div className={cx("flex items-center justify-between border-b px-4 py-3", hairline)}>
                <span className="font-serif text-lg font-bold tracking-tight">
                  Inkwell
                </span>
                <span className="flex items-center gap-1">
                  <ThemeToggle />
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close navigation menu"
                    className={cx(
                      "inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900",
                      focusRing,
                    )}
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </span>
              </div>

              <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-2 py-3">
                <NavLinks
                  orientation="vertical"
                  onNavigate={() => setOpen(false)}
                />

                <div className={cx("mx-2 my-3 border-t", hairline)} />

                {status === "loading" ? (
                  <div className="space-y-2 px-2" aria-label="Loading account">
                    <Skeleton className="h-11 w-full !rounded-full" />
                    <Skeleton className="h-11 w-full !rounded-full" />
                  </div>
                ) : user ? (
                  <div className="space-y-1 px-2">
                    <div className="flex items-center gap-3 px-2 py-2">
                      <Avatar name={displayName} src={user.image} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{displayName}</p>
                        {user.username && (
                          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                            @{user.username}
                          </p>
                        )}
                      </div>
                    </div>
                    <Link
                      href={WRITE_LINK.href}
                      onClick={closeMenu}
                      className={cx(
                        "flex w-full items-center gap-3 rounded-full bg-zinc-900 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200",
                        focusRing,
                      )}
                    >
                      <SquarePen className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
                      Write
                    </Link>
                    {getUserMenuItems(user.role).map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={cx(
                          "flex w-full items-center gap-3 rounded-full px-4 py-3 text-left text-base font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                          focusRing,
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0 opacity-70" aria-hidden />
                        {item.label}
                      </Link>
                    ))}
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className={cx(
                        "flex w-full items-center gap-3 rounded-full px-4 py-3 text-left text-base font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
                        focusRing,
                      )}
                    >
                      <LogOut className="h-5 w-5 shrink-0 opacity-70" aria-hidden />
                      Log out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 px-2">
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className={cx(
                        "flex w-full items-center justify-center rounded-full border border-zinc-200 px-4 py-3 text-base font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900",
                        focusRing,
                      )}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className={cx(
                        "flex w-full items-center justify-center rounded-full bg-zinc-900 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200",
                        focusRing,
                      )}
                    >
                      Get started
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
