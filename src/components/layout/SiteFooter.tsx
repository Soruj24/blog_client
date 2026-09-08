import Link from "next/link";
import { PRIMARY_LINKS } from "@/src/config/navigation";

const ACCOUNT_LINKS = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create account" },
  { href: "/profile", label: "Profile" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/notifications", label: "Notifications" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200/70 dark:border-zinc-800/70">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <p className="font-serif text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Inkwell
          </p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            A modern editorial platform for long-form ideas -- technology, design, and culture.
          </p>
        </div>
        <nav aria-label="Footer explore">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Explore
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {PRIMARY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-zinc-600 transition-colors duration-150 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/search"
                className="text-zinc-600 transition-colors duration-150 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Search
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Footer account">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Account
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-zinc-600 transition-colors duration-150 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Footer writing">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
            Write
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link
                href="/write"
                className="text-zinc-600 transition-colors duration-150 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Start writing
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard"
                className="text-zinc-600 transition-colors duration-150 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Dashboard
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-zinc-200/70 dark:border-zinc-800/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-5 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:text-zinc-400">
          <p>&copy; {new Date().getFullYear()} Inkwell. All rights reserved.</p>
          <p>Ideas worth reading slowly.</p>
        </div>
      </div>
    </footer>
  );
}
