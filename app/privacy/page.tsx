import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Inkwell privacy policy for newsletter and data handling",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="headline text-3xl">Privacy Policy</h1>
      <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        We respect your privacy. Newsletter emails are used only to send updates. We store your email,
        name (if provided), consent timestamp and IP for compliance. You can unsubscribe anytime via the
        unsubscribe page or the link in every email. We never share your email publicly and never sell your data.
        Contact us for data deletion requests.
      </p>
      <h2 className="mt-6 text-lg font-semibold">Consent</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        By checking the consent box you agree to receive newsletters. Consent is recorded with timestamp, text,
        and IP for GDPR compliance.
      </p>
    </div>
  );
}
