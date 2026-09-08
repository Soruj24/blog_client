import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";

/** Rendered by notFound() for unknown usernames. */
export default function AuthorNotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <EmptyState
        icon={<Users className="h-5 w-5" aria-hidden />}
        title="Author not found"
        description="This profile doesn't exist — the username may be misspelled."
        action={
          <span className="flex flex-wrap justify-center gap-2">
            <Link href="/blog">
              <Button size="sm">Browse stories</Button>
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
