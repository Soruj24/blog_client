import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/src/components/ui/Button";
import { cx } from "./shared";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this content. Check your connection and try again.",
  retryLabel = "Try again",
  onRetry,
  action,
  className = "",
}: ErrorStateProps) {
  return (
    <div role="alert" className={cx("flex flex-col items-center px-6 py-14 text-center", className)}>
      <span
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950 dark:text-red-400"
      >
        <TriangleAlert className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-serif text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}
