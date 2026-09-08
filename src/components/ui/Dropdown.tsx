"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/src/components/ui/dropdown-menu";

export interface DropdownItemProps
  extends React.ComponentProps<typeof DropdownMenuItem> {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactElement;
  children: ReactNode;
  label?: string;
  align?: "start" | "center" | "end";
}

export function Dropdown({ trigger, children, label, align = "end" }: DropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        aria-label={label}
        className="min-w-48 rounded-xl border border-zinc-200/70 bg-white py-1.5 shadow-overlay dark:border-zinc-800/70 dark:bg-zinc-950"
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DropdownItem({
  label,
  icon,
  danger = false,
  className,
  ...props
}: DropdownItemProps) {
  return (
    <DropdownMenuItem
      className={cn(
        "flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors duration-150 cursor-default",
        danger
          ? "text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 dark:focus:bg-red-950/40"
          : "text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800",
        className,
      )}
      {...props}
    >
      {icon && (
        <span aria-hidden className="shrink-0 opacity-70">
          {icon}
        </span>
      )}
      {label}
    </DropdownMenuItem>
  );
}

export interface DropdownLinkItemProps {
  href: string;
  label: string;
  icon?: ReactNode;
  className?: string;
}

export function DropdownLinkItem({ href, label, icon, className }: DropdownLinkItemProps) {
  return (
    <DropdownMenuItem asChild>
      <Link
        href={href}
        className={cn(
          "flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors duration-150",
          "text-zinc-700 hover:bg-zinc-100 focus:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800",
          className,
        )}
      >
        {icon && (
          <span aria-hidden className="shrink-0 opacity-70">
            {icon}
          </span>
        )}
        {label}
      </Link>
    </DropdownMenuItem>
  );
}
