"use client";

import { CircleAlert } from "lucide-react";
import {
  forwardRef,
  useId,
  type SelectHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/src/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  leftIcon?: ReactNode;
}

const fieldSizes = {
  sm: "h-9 px-3",
  md: "h-11 px-4",
  lg: "h-12 px-4 text-base",
} as const;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      label,
      hint,
      error,
      options,
      placeholder,
      size = "md",
      leftIcon,
      id,
      required,
      className,
      ...props
    },
    ref,
  ) {
    const autoId = useId();
    const selectId = id ?? autoId;
    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;

    return (
      <div className={cn("w-full", className)}>
        {label && (
          <label
            htmlFor={selectId}
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
          <select
            ref={ref}
            id={selectId}
            data-slot="select"
            required={required}
            aria-invalid={!!error || undefined}
            aria-describedby={cn(hintId, errorId) || undefined}
            className={cn(
              "flex w-full rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 shadow-xs transition-colors duration-150 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 disabled:hover:border-zinc-200",
              "dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:hover:border-zinc-700 dark:focus:border-zinc-600 dark:focus:ring-zinc-100/10 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-600 dark:disabled:hover:border-zinc-800",
              "aria-invalid:border-red-400 focus:aria-invalid:border-red-500 focus:aria-invalid:ring-red-500/10 dark:aria-invalid:border-red-500/70 dark:focus:aria-invalid:border-red-500 dark:focus:aria-invalid:ring-red-500/10",
              fieldSizes[size],
              leftIcon && "pl-10",
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
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
