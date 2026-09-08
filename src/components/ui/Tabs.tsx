"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/src/lib/utils";
import { Badge } from "./Badge";

export interface TabItem {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  variant?: "underline" | "pills";
}

export function Tabs({ items, value, onChange, label, variant = "underline" }: TabsProps) {
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={onChange}
      className="flex flex-col gap-0"
    >
      <TabsPrimitive.List
        aria-label={label}
        className={cn(
          "flex gap-1 overflow-x-auto bg-transparent p-0 h-auto",
          variant === "underline" && "border-b border-zinc-200/70 dark:border-zinc-800/70",
          variant === "pills" && "rounded-full bg-zinc-100 p-1 dark:bg-zinc-800",
        )}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              "flex shrink-0 items-center gap-2 whitespace-nowrap text-sm font-medium transition-colors duration-150",
              "disabled:cursor-not-allowed disabled:opacity-40",
              "data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-zinc-900 data-[state=active]:dark:text-zinc-50",
              "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
              variant === "underline" &&
                "-mb-px border-b-2 px-3 py-2.5 border-transparent data-[state=active]:border-zinc-900 dark:data-[state=active]:border-zinc-50",
              variant === "pills" &&
                "rounded-full px-4 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-soft dark:data-[state=active]:bg-zinc-950",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <Badge tone={item.value === value ? "primary" : "neutral"}>{item.count}</Badge>
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
