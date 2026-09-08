import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  action?: ReactNode;
}

export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
  action,
}: SectionHeadingProps) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-xl">
        <p className="eyebrow text-zinc-500 dark:text-zinc-400">
          {eyebrow}
        </p>
        <h2
          id={id}
          className="headline mt-2 text-2xl tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>
      {action ??
        (actionHref && actionLabel && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          >
            {actionLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ))}
    </div>
  );
}
