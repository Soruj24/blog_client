"use client";

import Link from "next/link";
import { Button } from "@/src/components/ui/Button";
import { ErrorState } from "@/src/components/ui/ErrorState";

/** Route-level failure boundary — retry the segment or leave safely. */
export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <ErrorState
        title="Something went wrong"
        description="This section hit an unexpected error. Try again, or head somewhere safe."
        action={
          <span className="flex flex-wrap justify-center gap-2">
            <Button size="sm" onClick={() => reset()}>
              Try again
            </Button>
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
