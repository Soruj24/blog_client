import { CircleAlert } from "lucide-react";
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/src/lib/utils";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const fieldSizes = {
  sm: "h-9 px-3",
  md: "h-11 px-4",
  lg: "h-12 px-4 text-base",
} as const;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      label,
      hint,
      error,
      size = "md",
      leftIcon,
      rightIcon,
      id,
      required,
      className,
      ...props
    },
    ref,
  ) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className={cn("w-full", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            {label}
            {required && (
              <span aria-hidden className="ml-0.5 text-red-500">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
            >
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            data-slot="input"
            required={required}
            aria-invalid={!!error || undefined}
            aria-describedby={cn(hintId, errorId) || undefined}
            className={cn(
              "flex h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs transition-colors duration-150 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 disabled:hover:border-zinc-200",
              "dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:hover:border-zinc-700 dark:focus:border-zinc-600 dark:focus:ring-zinc-100/10 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-600 dark:disabled:hover:border-zinc-800",
              "aria-invalid:border-red-400 focus:aria-invalid:border-red-500 focus:aria-invalid:ring-red-500/10 dark:aria-invalid:border-red-500/70 dark:focus:aria-invalid:border-red-500 dark:focus:aria-invalid:ring-red-500/10",
              fieldSizes[size],
              leftIcon && "pl-10",
              rightIcon && "pr-10",
            )}
            {...props}
          />
          {rightIcon && (
            <span
              aria-hidden
              className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
            >
              {rightIcon}
            </span>
          )}
        </div>
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={errorId}
            role="alert"
            className="mt-1.5 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400"
          >
            <CircleAlert className="h-4 w-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}
      </div>
    );
  },
);
