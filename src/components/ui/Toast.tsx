"use client";

import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { toast as sonnerToast, Toaster } from "sonner";
import { useTheme } from "next-themes";
import type { ReactNode } from "react";

export type ToastTone = "success" | "error" | "info";

interface ToastContextValue {
  toast: (title: string, options?: { description?: string; tone?: ToastTone }) => void;
  dismiss: (id: string | number) => void;
}

const toneIcons: Record<ToastTone, typeof Info> = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { theme = "system" } = useTheme();

  return (
    <>
      {children}
      <Toaster
        theme={theme as "light" | "dark" | "system"}
        position="bottom-right"
        expand={true}
        richColors={false}
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "group toast bg-white border border-zinc-200/70 shadow-overlay dark:bg-zinc-950 dark:border-zinc-800/70",
            description: "text-zinc-500 dark:text-zinc-400",
            actionButton:
              "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900",
            cancelButton:
              "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
          },
        }}
      />
    </>
  );
}

export function useToast(): ToastContextValue {
  const toast = (title: string, options?: { description?: string; tone?: ToastTone }) => {
    const tone = options?.tone ?? "info";
    const Icon = toneIcons[tone];

    sonnerToast.custom(
      () => (
        <div className="flex w-full items-start gap-3 overflow-hidden">
          <span
            aria-hidden
            className={`w-1 self-stretch shrink-0 ${
              tone === "success"
                ? "bg-emerald-500"
                : tone === "error"
                  ? "bg-red-500"
                  : "bg-zinc-900 dark:bg-zinc-100"
            }`}
          />
          <Icon
            aria-hidden
            className="mt-3.5 h-5 w-5 shrink-0 text-zinc-500 dark:text-zinc-400"
          />
          <div className="min-w-0 flex-1 py-3">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</p>
            {options?.description && (
              <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
                {options.description}
              </p>
            )}
          </div>
        </div>
      ),
      {
        duration: 4500,
      },
    );
  };

  const dismiss = (id: string | number) => {
    sonnerToast.dismiss(id);
  };

  return { toast, dismiss };
}
