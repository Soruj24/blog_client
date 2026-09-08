"use client";

import { cx } from "@/src/components/ui/shared";
import { compact } from "./shared";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function niceMax(max: number): number {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  const n = max / pow;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return nice * pow;
}

function xLabels(labels: string[], maxTicks = 6): Array<{ i: number; text: string }> {
  if (labels.length <= maxTicks) {
    return labels.map((text, i) => ({ i, text: text.slice(5) }));
  }
  const step = Math.ceil((labels.length - 1) / (maxTicks - 1));
  const out: Array<{ i: number; text: string }> = [];
  for (let i = 0; i < labels.length; i += step) {
    out.push({ i, text: labels[i]!.slice(5) });
  }
  const last = labels.length - 1;
  if (out[out.length - 1]!.i !== last) {
    out.push({ i: last, text: labels[last]!.slice(5) });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const W = 640;
const H = 220;
const PAD = { l: 44, r: 12, t: 16, b: 28 };

/* ------------------------------------------------------------------ */
/*  Grid                                                               */
/* ------------------------------------------------------------------ */

function Grid({ max, ticks = 4 }: { max: number; ticks?: number }) {
  const innerH = H - PAD.t - PAD.b;
  return (
    <g aria-hidden>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const y = PAD.t + (innerH * i) / ticks;
        return (
          <g key={i}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y}
              y2={y}
              className="stroke-zinc-100 dark:stroke-zinc-800/80"
              strokeWidth={1}
            />
            <text
              x={PAD.l - 8}
              y={y + 3.5}
              textAnchor="end"
              className="fill-zinc-400 text-[10px] font-medium dark:fill-zinc-500"
            >
              {compact(Math.round((max * (ticks - i)) / ticks))}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Series type                                                        */
/* ------------------------------------------------------------------ */

export interface Series {
  label: string;
  values: number[];
  color: string;
}

/* ------------------------------------------------------------------ */
/*  TimeSeries — area + line                                           */
/* ------------------------------------------------------------------ */

export function TimeSeries({
  title,
  labels,
  series,
}: {
  title: string;
  labels: string[];
  series: Series[];
}) {
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const x = (i: number) => PAD.l + (innerW * i) / Math.max(1, labels.length - 1);
  const y = (v: number) => PAD.t + innerH - (innerH * v) / max;
  const line = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  const baseline = (PAD.t + innerH).toFixed(1);

  return (
    <figure>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={title}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <title>{title}</title>
        <Grid max={max} />
        {series.map((s) => (
          <g key={s.label}>
            <path
              d={`${line(s.values)} L${x(labels.length - 1).toFixed(1)},${baseline} L${PAD.l},${baseline} Z`}
              fill={s.color}
              opacity={0.08}
              aria-hidden
            />
            <path
              d={line(s.values)}
              fill="none"
              stroke={s.color}
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              <title>{`${s.label}: latest ${s.values[s.values.length - 1] ?? 0}`}</title>
            </path>
          </g>
        ))}
        {xLabels(labels).map(({ i, text }) => (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            className="fill-zinc-400 text-[10px] font-medium dark:fill-zinc-500"
          >
            {text}
          </text>
        ))}
      </svg>
      {series.length > 1 && (
        <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {series.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400"
            >
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/*  Bars — vertical bar chart                                          */
/* ------------------------------------------------------------------ */

export function Bars({
  title,
  labels,
  values,
  color = "#18181b",
}: {
  title: string;
  labels: string[];
  values: number[];
  color?: string;
}) {
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;
  const max = niceMax(Math.max(0, ...values));
  const slot = innerW / Math.max(1, labels.length);
  const bw = Math.min(36, slot * 0.5);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={title}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{title}</title>
      <Grid max={max} />
      {values.map((v, i) => {
        const h = (innerH * v) / max;
        const cxp = PAD.l + slot * i + slot / 2;
        return (
          <g key={i}>
            <rect
              x={cxp - bw / 2}
              y={PAD.t + innerH - h}
              width={bw}
              height={Math.max(h, 2)}
              rx={3}
              fill={color}
              opacity={v === 0 ? 0.15 : 0.85}
            >
              <title>{`${labels[i]}: ${v}`}</title>
            </rect>
            {xLabels(labels).some((t) => t.i === i) && (
              <text
                x={cxp}
                y={H - 8}
                textAnchor="middle"
                className="fill-zinc-400 text-[10px] font-medium dark:fill-zinc-500"
              >
                {labels[i]!.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Donut — ring with center total + legend                            */
/* ------------------------------------------------------------------ */

export function Donut({
  title,
  total,
  segments,
}: {
  title: string;
  total: number;
  segments: Array<{ label: string; value: number; color: string }>;
}) {
  const R = 66;
  const C = 2 * Math.PI * R;
  const sum = segments.reduce((s, g) => s + g.value, 0) || 1;
  const offsets = segments.reduce<number[]>((arr, _, i) => {
    arr.push(i === 0 ? 0 : arr[i - 1]! + segments[i - 1]!.value / sum);
    return arr;
  }, []);

  return (
    <figure className="flex items-center gap-8">
      <svg viewBox="0 0 180 180" role="img" aria-label={title} className="h-40 w-40 shrink-0">
        <title>{title}</title>
        <circle
          cx={90}
          cy={90}
          r={R}
          fill="none"
          className="stroke-zinc-100 dark:stroke-zinc-800"
          strokeWidth={20}
        />
        {segments.map((s, idx) => {
          const frac = s.value / sum;
          const dash = `${(frac * C).toFixed(1)} ${(C - frac * C).toFixed(1)}`;
          return (
            <circle
              key={s.label}
              cx={90}
              cy={90}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={20}
              strokeDasharray={dash}
              strokeDashoffset={(-offsets[idx]! * C).toFixed(1)}
              transform="rotate(-90 90 90)"
              strokeLinecap="butt"
            >
              <title>{`${s.label}: ${s.value}`}</title>
            </circle>
          );
        })}
        <text x={90} y={86} textAnchor="middle" className="fill-zinc-900 text-2xl font-bold dark:fill-zinc-50">
          {compact(total)}
        </text>
        <text x={90} y={104} textAnchor="middle" className="fill-zinc-400 text-[11px] font-medium dark:fill-zinc-500">
          total
        </text>
      </svg>
      <ul className="space-y-2.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2.5 text-sm">
            <span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{s.label}</span>
            <span className="tabular-nums text-zinc-500 dark:text-zinc-400">{compact(s.value)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/*  ChartCard — wrapper panel                                          */
/* ------------------------------------------------------------------ */

export function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-label={title}
      className={cx(
        "rounded-2xl border border-zinc-200/60 bg-white p-5 dark:border-zinc-800/60 dark:bg-zinc-950",
        className,
      )}
    >
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}
