"use client";

import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { MailCheck, Send } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { useSubscribeNewsletterMutation } from "@/src/store/api/contentApi";

const emailSchema = z.email("Enter a valid email address");
const nameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(80).optional();

type Variant = "default" | "compact" | "inline";

/**
 * Reusable NewsletterForm — used in homepage hero, footer, sidebar.
 * Features: email validation, optional name, consent, duplicate handling,
 * accessible errors, dark variant. Emails never leak to client beyond submit.
 */
export function NewsletterForm({
  onDark = false,
  variant = "default",
  showName = false,
  source = "homepage",
}: {
  onDark?: boolean;
  variant?: Variant;
  showName?: boolean;
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successDetail, setSuccessDetail] = useState<string | null>(null);
  const [subscribe, { isLoading, isSuccess }] = useSubscribeNewsletterMutation();

  const inputClass = onDark
    ? "border-white/15 bg-white/10 text-white placeholder:text-zinc-500 hover:border-white/25 focus:border-white/40 focus:ring-2 focus:ring-white/10"
    : "border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-700 dark:focus:border-zinc-600 dark:focus:ring-zinc-100/10";

  const compact = variant === "compact";

  if (isSuccess) {
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
      >
        <MailCheck className="h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="font-medium">You&apos;re on the list — see you in your inbox.</p>
          {successDetail && <p className="text-xs opacity-80">{successDetail}</p>}
          <p className="mt-1 text-xs opacity-70">
            <Link href="/newsletter/unsubscribe" className="underline">
              Unsubscribe anytime
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedEmail = emailSchema.safeParse(email.trim());
    if (!parsedEmail.success) {
      setLocalError(parsedEmail.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    if (showName && name.trim()) {
      const parsedName = nameSchema.safeParse(name.trim());
      if (!parsedName.success) {
        setLocalError(parsedName.error.issues[0]?.message ?? "Invalid name");
        return;
      }
    }
    if (!consent) {
      setLocalError("Please accept the privacy consent to subscribe");
      return;
    }
    setLocalError(null);
    try {
      const res = await subscribe({
        email: parsedEmail.data,
        ...(showName && name.trim() ? { name: name.trim() } : {}),
        consent: true,
        consentText: "I agree to receive newsletters and accept the Privacy Policy",
        source,
      }).unwrap();
      setSuccessDetail(
        (res as unknown as { reactivated?: boolean })?.reactivated
          ? "Welcome back — your subscription was reactivated."
          : null,
      );
    } catch (err) {
      const msg =
        (err as { data?: { message?: string } })?.data?.message ||
        "Couldn't subscribe right now — please try again.";
      setLocalError(msg);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className={compact ? "space-y-2" : "space-y-3"}>
      {showName && (
        <label className="block">
          <span className="sr-only">Name</span>
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            className={`h-11 w-full rounded-full border px-5 text-sm outline-none transition-colors ${inputClass}`}
          />
        </label>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor={`newsletter-email-${variant}`} className="sr-only">
          Email address
        </label>
        <input
          id={`newsletter-email-${variant}`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-invalid={!!localError || undefined}
          className={`h-12 flex-1 rounded-full border px-5 text-sm outline-none transition-colors ${inputClass}`}
        />
        <Button
          type="submit"
          size={compact ? "md" : "lg"}
          loading={isLoading}
          variant={onDark ? "secondary" : "primary"}
          className="shrink-0"
        >
          <Send className="h-4 w-4" aria-hidden />
          Subscribe
        </Button>
      </div>

      <label className="flex items-start gap-2 text-xs leading-tight">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:accent-zinc-100"
        />
        <span className={onDark ? "text-zinc-400" : "text-zinc-600 dark:text-zinc-400"}>
          I agree to receive newsletters and accept the{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          . You can unsubscribe anytime.
        </span>
      </label>

      {localError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {localError}
        </p>
      )}
      <p className={`text-xs ${onDark ? "text-zinc-500" : "text-zinc-500 dark:text-zinc-400"}`}>
        No spam. Emails are private and never shown publicly. Duplicate emails are ignored.
      </p>
    </form>
  );
}

/** Lightweight unsubscribe helper — can be used on /newsletter/unsubscribe page */
export function NewsletterUnsubscribeForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Enter a valid email");
      return;
    }
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/newsletter/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: parsed.data }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || "Failed");
      setMsg("You have been unsubscribed. You can resubscribe anytime.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to unsubscribe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="h-12 w-full rounded-full border border-zinc-200 bg-white px-5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
      />
      <Button type="submit" loading={loading}>
        Unsubscribe
      </Button>
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      {msg && <p role="status" className="text-sm text-emerald-700">{msg}</p>}
    </form>
  );
}
