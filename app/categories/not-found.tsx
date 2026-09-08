import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";

/** Rendered by notFound() for unknown category slugs. */
export default function CategoriesNotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <EmptyState
        icon={<LayoutGrid className="h-5 w-5" aria-hidden />}
        title="Category not found"
        description="This topic doesn't exist — it may have been renamed or removed."
        action={
          <span className="flex flex-wrap justify-center gap-2">
            <Link href="/categories">
              <Button size="sm">All categories</Button>
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
