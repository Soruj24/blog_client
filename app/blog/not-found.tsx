import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";

/** Rendered by notFound() — bad slug, draft, or deleted article. */
export default function BlogNotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <EmptyState
        icon={<SearchX className="h-5 w-5" aria-hidden />}
        title="Article not found"
        description="This story doesn't exist, was removed, or isn't published yet."
        action={
          <span className="flex flex-wrap justify-center gap-2">
            <Link href="/blog">
              <Button size="sm">Browse all stories</Button>
            </Link>
            <Link href="/">
              <Button size="sm" variant="secondary">
                Back home
              </Button>
            </Link>
          </span>
        }
      />
    </div>
  );
}
