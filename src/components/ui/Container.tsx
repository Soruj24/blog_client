import type { ReactNode } from "react";

/** Centered editorial content column. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-3xl px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}
