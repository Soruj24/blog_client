import Link from "next/link";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { cx, focusRing } from "@/src/components/ui/shared";
import { HeaderAuth } from "./HeaderAuth";
import { HeaderSearch } from "./HeaderSearch";
import { MobileMenu } from "./MobileMenu";
import { NavLinks } from "./NavLinks";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-1.5 px-4 sm:px-6">
        <MobileMenu />
        <Link
          href="/"
          aria-label="Inkwell home"
          className={cx(
            "rounded-lg font-serif text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100",
            focusRing,
          )}
        >
          Inkwell
        </Link>

        <nav aria-label="Primary" className="ml-4 hidden items-center gap-0.5 lg:flex">
          <NavLinks orientation="horizontal" />
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <HeaderSearch />
          <span className="hidden sm:inline-flex">
            <ThemeToggle />
          </span>
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}
