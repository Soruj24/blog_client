import Link from "next/link";
import { Tag as TagIcon } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";

/** Rendered by notFound() for unknown tag slugs. */
export default function TagsNotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <EmptyState
        icon={<TagIcon className="h-5 w-5" aria-hidden />}
        title="Tag not found"
        description="This tag doesn't exist — it may have been renamed or removed."
        action={
          <span className="flex flex-wrap justify-center gap-2">
            <Link href="/tags">
              <Button size="sm">All tags</Button>
            </Link>
            <Link href="/blog">
              <Button size="sm" variant="secondary">
                Browse stories
              </Button>
            </Link>
          </span>
        }
      />
    </div>
  );
}
