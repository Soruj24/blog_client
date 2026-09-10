import { Rss } from "lucide-react";
import { NewsletterForm } from "@/src/components/blog/NewsletterForm";

/** Dark signup panel: one standout band before the footer. */
export function NewsletterSection() {
  return (
    <section aria-labelledby="newsletter-heading">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="relative overflow-hidden rounded-3xl bg-zinc-950 px-6 py-14 sm:px-12 sm:py-16 dark:border dark:border-zinc-800">
          {/* Decorative elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-zinc-800/30 blur-3xl" aria-hidden />
          <div className="absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-zinc-800/20 blur-3xl" aria-hidden />

          <div className="relative mx-auto max-w-xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-100" aria-hidden>
              <Rss className="h-6 w-6" aria-hidden />
            </div>
            <h2
              id="newsletter-heading"
              className="headline mt-6 text-2xl text-white sm:text-3xl"
            >
              Never miss a good story
            </h2>
            <p className="mt-3 text-zinc-400">
              One thoughtful email a week — the best new essays, no noise,
              unsubscribe anytime.
            </p>
            <div className="mt-8 text-left">
              <NewsletterForm onDark />
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Join readers getting the weekly digest. No spam, ever.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
