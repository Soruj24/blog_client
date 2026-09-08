"use client";

import { cn } from "@/src/lib/utils";
import { Avatar as AvatarPrimitive } from "radix-ui";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps
  extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  name: string;
  src?: string | null;
  size?: AvatarSize;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase() || "?";
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-xl",
};

export function Avatar({ name, src, size = "md", className, ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      aria-label={name}
      title={name}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full",
        "bg-zinc-100 font-semibold text-zinc-600",
        "dark:bg-zinc-800 dark:text-zinc-300",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <AvatarPrimitive.Image
          src={src}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center">
          <span aria-hidden>{initials(name)}</span>
        </AvatarPrimitive.Fallback>
      )}
    </AvatarPrimitive.Root>
  );
}
