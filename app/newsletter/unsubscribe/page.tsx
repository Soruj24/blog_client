import type { Metadata } from "next";
import { NewsletterUnsubscribeForm } from "@/src/components/blog/NewsletterForm";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Unsubscribe from Inkwell newsletter",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="headline text-2xl">Unsubscribe</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Enter your email to unsubscribe. You can resubscribe anytime.
      </p>
      <div className="mt-6">
        <NewsletterUnsubscribeForm />
      </div>
    </div>
  );
}
