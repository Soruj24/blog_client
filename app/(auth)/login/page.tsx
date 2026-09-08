import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Inkwell account.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400">
            Sign in to write, comment, and follow authors.
          </p>
        </div>

        {/* Form card */}
        <div className="mt-8 rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-soft sm:p-8 dark:border-zinc-800/70 dark:bg-zinc-950">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
