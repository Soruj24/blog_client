"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PRIMARY_LINKS,
  isActiveLink,
  type NavLink,
} from "@/src/config/navigation";
import { cx, focusRing } from "@/src/components/ui/shared";

export interface NavLinksProps {
  links?: NavLink[];
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
  className?: string;
}

const base = cx(
  "flex items-center gap-1.5 rounded-full text-sm font-medium transition-colors duration-150",
  focusRing,
);

export function NavLinks({
  links = PRIMARY_LINKS,
  orientation = "horizontal",
  onNavigate,
  className = "",
}: NavLinksProps) {
  const pathname = usePathname();

  return (
    <>
      {links.map((link) => {
        const active = isActiveLink(pathname, link);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cx(
              base,
              orientation === "horizontal" ? "px-3 py-2" : "w-full px-4 py-3 text-base",
              active
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
              className,
            )}
          >
            {orientation === "vertical" && (
              <Icon className="h-5 w-5 shrink-0 opacity-70" aria-hidden />
            )}
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
