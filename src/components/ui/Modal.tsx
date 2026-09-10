"use client";

import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";

type ModalSize = "sm" | "md" | "lg";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
}

const panelSizes: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn(
          "w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0",
          "rounded-2xl",
          "max-h-[92dvh]",
          panelSizes[size],
        )}
      >
        <DialogHeader className="shrink-0 border-b border-zinc-200/70 px-5 pb-4 pt-5 text-left sm:px-6 sm:pt-6 dark:border-zinc-800/70">
          <DialogTitle className="headline pr-10 text-xl tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="admin-scroll overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
        {footer && (
          <DialogFooter className="flex shrink-0 flex-col-reverse gap-2 border-t border-zinc-200/70 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6 dark:border-zinc-800/70">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
