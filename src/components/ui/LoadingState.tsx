import { LoaderCircle } from "lucide-react";
import { cx } from "./shared";

type LoadingSize = "sm" | "md" | "lg";

export interface LoadingStateProps {
  message?: string;
  size?: LoadingSize;
  className?: string;
}

const spinnerSizes: Record<LoadingSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function LoadingState({ message = "Loading...", size = "md", className = "" }: LoadingStateProps) {
  return (
    <div className={cx("flex flex-col items-center justify-center gap-3 px-6 py-14", className)}>
      <LoaderCircle aria-hidden className={cx("animate-spin text-zinc-400 dark:text-zinc-500", spinnerSizes[size])} />
      <p role="status" className="text-sm text-zinc-500 dark:text-zinc-400">
        {message}
      </p>
    </div>
  );
}
