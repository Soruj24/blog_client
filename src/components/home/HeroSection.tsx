"use client";

import Link from "next/link";
import { ArrowRight, SquarePen } from "lucide-react";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { useListArticlesQuery, useListCategoriesQuery } from "@/src/store/api/contentApi";

export function HeroSection() {
  const articles = useListArticlesQuery({ limit: 1 });
  const categories = useListCategoriesQuery();

  const statsReady = articles.isSuccess && categories.isSuccess;
  const statsFailed = articles.isError || categories.isError;

  return (
    <section aria-labelledby="hero-heading" className="relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/80 via-white to-white dark:from-zinc-900/50 dark:via-zinc-950 dark:to-zinc-950" aria-hidden />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-zinc-100/50 blur-3xl dark:bg-zinc-800/20" aria-hidden />
      <div className="absolute -left-32 top-32 h-64 w-64 rounded-full bg-zinc-100/30 blur-3xl dark:bg-zinc-800/10" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <p className="eyebrow text-zinc-500 dark:text-zinc-400">
            Inkwell &middot; Editorial platform
          </p>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="headline mt-5 text-4xl leading-[1.08] tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl lg:text-6xl"
          >
            Ideas worth reading
            <span className="relative ml-2 inline-block">
              slowly
              <svg
                className="absolute -bottom-1 left-0 h-2 w-full"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  d="M0 8 Q25 0, 50 6 T100 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-zinc-300 dark:text-zinc-700"
                />
              </svg>
            </span>
          </h1>

          {/* Subhead */}
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-xl">
            Long-form essays and field notes on technology, design, and culture
            — written by people who do the work.
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="#latest"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-zinc-900 px-7 text-sm font-medium text-white shadow-sm transition-colors duration-150 outline-none hover:bg-zinc-800 active:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:active:bg-zinc-300 dark:focus-visible:outline-zinc-100"
            >
              Start reading
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/write"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-zinc-200 bg-white/50 px-7 text-sm font-medium text-zinc-700 transition-colors duration-150 outline-none hover:border-zinc-300 hover:bg-white active:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:active:bg-zinc-800 dark:focus-visible:outline-zinc-100"
            >
              <SquarePen className="h-4 w-4" aria-hidden />
              Write with us
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-10 flex min-h-6 flex-wrap items-center gap-x-8 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
            {statsReady ? (
              <>
                <span className="flex items-center gap-2">
                  <strong className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {articles.data?.total ?? 0}
                  </strong>
                  {(articles.data?.total ?? 0) === 1 ? "article" : "articles"}
                </span>
                <span className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" aria-hidden />
                <span className="flex items-center gap-2">
                  <strong className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {categories.data?.length ?? 0}
                  </strong>
                  {(categories.data?.length ?? 0) === 1 ? "category" : "categories"}
                </span>
              </>
            ) : statsFailed ? null : (
              <Skeleton className="h-5 w-48" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
