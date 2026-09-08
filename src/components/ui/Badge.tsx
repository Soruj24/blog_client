import type { ReactNode } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        primary: "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900",
        success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        warning: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        danger: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
        info: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

export interface BadgeProps {
  children: ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ tone }), className)}
    >
      {children}
    </span>
  );
}
