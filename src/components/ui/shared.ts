import { cx } from "@/src/lib/cx";

/* ═══════════════════════════════════════════════════════════════════
   SHARED DESIGN TOKENS — single source of truth
   Import these, never re-declare Tailwind strings per component.
   ═══════════════════════════════════════════════════════════════════ */

/* ── Focus ring ───────────────────────────────────────────────── */
export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100";

/* ── Border ───────────────────────────────────────────────────── */
export const hairline = "border-zinc-200/70 dark:border-zinc-800/70";
export const borderStandard = "border border-zinc-200 dark:border-zinc-800";

/* ── Surface ──────────────────────────────────────────────────── */
export const surface = "bg-white dark:bg-zinc-950";
export const surfaceRaised = "bg-white dark:bg-zinc-950";
export const surfaceSunken = "bg-zinc-50 dark:bg-zinc-900";

/* ── Typography ───────────────────────────────────────────────── */
export const textPrimary = "text-zinc-900 dark:text-zinc-100";
export const textSecondary = "text-zinc-600 dark:text-zinc-400";
export const textMuted = "text-zinc-500 dark:text-zinc-400";
export const textDisabled = "text-zinc-400 dark:text-zinc-600";

/* ── Field chrome (Input / Textarea / Select) ─────────────────── */
export const fieldBase = cx(
  "w-full rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900",
  "placeholder:text-zinc-400 transition-colors duration-150",
  "hover:border-zinc-300 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10",
  "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400 disabled:hover:border-zinc-200",
  "dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100",
  "dark:placeholder:text-zinc-600 dark:hover:border-zinc-700 dark:focus:border-zinc-600 dark:focus:ring-zinc-100/10",
  "dark:disabled:bg-zinc-900 dark:disabled:text-zinc-600 dark:disabled:hover:border-zinc-800",
);

export const fieldSizes = {
  sm: "h-9 px-3",
  md: "h-11 px-4",
  lg: "h-12 px-4 text-base",
} as const;

export const fieldError =
  "border-red-400 focus:border-red-500 focus:ring-red-500/10 dark:border-red-500/70 dark:focus:border-red-500 dark:focus:ring-red-500/10";

/* ── Button base ──────────────────────────────────────────────── */
export const btnBase = cx(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150",
  "disabled:pointer-events-none disabled:opacity-50",
  focusRing,
);

export const btnPill = "rounded-full";
export const btnRadius = "rounded-xl";

export const btnSizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-9 w-9",
} as const;

/* ── Interactive hover ────────────────────────────────────────── */
export const hoverLift = "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift";
export const hoverGlow = "transition-shadow duration-200 hover:shadow-lift";

/* ── Re-exports ───────────────────────────────────────────────── */
export { cx };
