import { Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "./shared";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={cx("flex flex-col items-center px-6 py-14 text-center", className)}>
      <span
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
      >
        {icon ?? <Inbox className="h-5 w-5" />}
      </span>
      <h3 className="mt-4 font-serif text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
