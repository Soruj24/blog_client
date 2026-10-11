import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";

/** Catch-all for unknown routes — every dead end offers a way back. */
export default function RootNotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <EmptyState
        icon={<Compass className="h-5 w-5" aria-hidden />}
        title="Page not found"
        description="This address doesn't lead anywhere — it may have moved or never existed."
        action={
          <span className="flex flex-wrap justify-center gap-2">
            <Link href="/">
              <Button size="sm">Back home</Button>
            </Link>
            <Link href="/blog">
              <Button size="sm" variant="secondary">
                Browse stories
              </Button>
            </Link>
            <Link href="/search">
              <Button size="sm" variant="secondary">
                Search
              </Button>
            </Link>
          </span>
        }
      />
    </div>
  );
}
