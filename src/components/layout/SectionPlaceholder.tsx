import type { LucideIcon } from "lucide-react";
import { Container } from "@/src/components/ui/Container";
import { EmptyState } from "@/src/components/ui/EmptyState";
import type { ReactNode } from "react";

export interface SectionPlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

/**
 * Temporary section scaffold: every navbar destination resolves to a
 * real page with proper metadata today, and gets its full UI in its
 * feature phase. Keeps nav honest — no dead links, no duplicated copy.
 */
export function SectionPlaceholder({
  icon: Icon,
  title,
  description,
  action,
}: SectionPlaceholderProps) {
  return (
    <Container className="max-w-2xl py-10">
      <EmptyState
        icon={<Icon className="h-5 w-5" aria-hidden />}
        title={title}
        description={description}
        action={action}
      />
    </Container>
  );
}
