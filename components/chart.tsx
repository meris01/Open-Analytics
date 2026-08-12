'use client';

import { useMemo, useState } from 'react';
import { money, num, shortDate } from '@/lib/format';

export type Point = { t: string; visitors: number; sessions: number; pageviews: number; revenue: number };

type SeriesKey = 'visitors' | 'sessions' | 'pageviews' | 'revenue';

const META: Record<SeriesKey, { label: string; color: string; money?: boolean }> = {
  visitors:  { label: 'Visitors',  color: 'var(--c-primary)' },
  sessions:  { label: 'Sessions',  color: 'var(--c-fg-subtle)' },
  pageviews: { label: 'Pageviews', color: 'var(--c-fg-subtle)' },
  revenue:   { label: 'Revenue',   color: 'var(--c-accent)', money: true },
};

const W = 1000;
const H = 300;
const PAD = { l: 46, r: 16, t: 16, b: 26 };

export function AreaChart({
  data, keys = ['visitors', 'revenue'], height = 320, currency = 'USD', bucket = 'day',
}: {
  data: Point[]; keys?: SeriesKey[]; height?: number; currency?: string; bucket?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const geom = useMemo(() => {
    const n = Math.max(data.length, 1);
    const iw = W - PAD.l - PAD.r;
    const ih = H - PAD.t - PAD.b;
    const x = (i: number) => PAD.l + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);

    return keys.map((k) => {
      const vals = data.map((d) => Number(d[k]) || 0);
      const max = Math.max(...vals, 1);
      const y = (v: number) => PAD.t + ih - (v / max) * ih;
      const line = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
      const area = `${line} L${x(vals.length - 1).toFixed(1)},${PAD.t + ih} L${x(0).toFixed(1)},${PAD.t + ih} Z`;
      return { k, vals, max, x, y, line, area };
    });
  }, [data, keys]);

  if (!data.length) {
    return <div className="flex h-64 items-center justify-center text-[13px] text-fg-subtle">No data in this range</div>;
  }

  const primary = geom[0];
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const labelEvery = Math.max(1, Math.ceil(data.length / 6));

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
        className="h-full w-full" role="img" aria-label="Trend chart"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const rel = (e.clientX - r.left) / r.width;
          const ix = Math.round(((rel * W - PAD.l) / (W - PAD.l - PAD.r)) * (data.length - 1));
          setHover(Math.max(0, Math.min(data.length - 1, ix)));
        }}
      >
        <defs>
          {geom.map((g) => (
            <linearGradient key={g.k} id={`grad-${g.k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={META[g.k as SeriesKey].color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={META[g.k as SeriesKey].color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {ticks.map((t) => {
          const y = PAD.t + (H - PAD.t - PAD.b) * t;
          return <line key={t} x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} stroke="var(--c-border)" strokeWidth="1" vectorEffect="non-scaling-stroke" />;
        })}

        {geom.map((g, gi) => (
          <g key={g.k}>
            {gi === 0 && <path d={g.area} fill={`url(#grad-${g.k})`} className="fade" />}
            <path
              d={g.line} fill="none" stroke={META[g.k as SeriesKey].color}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={gi > 0 ? '5 4' : undefined}
              vectorEffect="non-scaling-stroke" className="draw"
              style={{ animationDelay: `${gi * 120}ms` }}
            />
          </g>
        ))}

        {hover !== null && (
          <g>
            <line x1={primary.x(hover)} x2={primary.x(hover)} y1={PAD.t} y2={H - PAD.b}
                  stroke="var(--c-border-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {geom.map((g) => (
              <circle key={g.k} cx={g.x(hover)} cy={g.y(g.vals[hover])} r="4"
                      fill={META[g.k as SeriesKey].color} stroke="var(--c-container)" strokeWidth="2"
                      vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        )}
      </svg>

      {/* axes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 flex flex-col justify-between text-right"
             style={{ top: `${(PAD.t / H) * 100}%`, bottom: `${(PAD.b / H) * 100}%`, width: 38 }}>
          {[...ticks].reverse().map((t) => (
            <span key={t} className="data-mono text-[10.5px] leading-none text-fg-subtle">
              {num(Math.round(primary.max * t))}
            </span>
          ))}
        </div>
        <div className="absolute bottom-0 flex justify-between"
             style={{ left: `${(PAD.l / W) * 100}%`, right: `${(PAD.r / W) * 100}%` }}>
          {data.filter((_, i) => i % labelEvery === 0 || i === data.length - 1).map((d) => (
            <span key={d.t} className="data-mono text-[10.5px] text-fg-subtle">{shortDate(d.t, bucket)}</span>
          ))}
        </div>
      </div>

      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 min-w-[150px] -translate-x-1/2 rounded-md border border-border bg-container p-2.5"
          style={{
            left: `${(primary.x(hover) / W) * 100}%`,
            top: 8,
            boxShadow: 'var(--shadow-overlay)',
          }}
        >
          <div className="mb-1.5 text-[11.5px] font-medium text-fg-muted">
            {new Date(data[hover].t).toLocaleString('en-US', {
              month: 'short', day: 'numeric',
              ...(bucket === 'hour' || bucket === 'minute' ? { hour: 'numeric' } : {}),
            })}
          </div>
          {keys.map((k) => (
            <div key={k} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5 text-[12px] text-fg-muted">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: META[k].color }} />
                {META[k].label}
              </span>
              <span className="data-mono text-[12px]">
                {META[k].money ? money(data[hover][k], currency) : num(data[hover][k])}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Legend({ keys }: { keys: SeriesKey[] }) {
  return (
    <div className="flex items-center gap-4">
      {keys.map((k) => (
        <span key={k} className="flex items-center gap-1.5 text-[12px] text-fg-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: META[k].color }} />
          {META[k].label}
        </span>
      ))}
    </div>
  );
}

export function MiniBars({ data, height = 64, color = 'var(--c-primary)' }:
  { data: number[]; height?: number; color?: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-[2px] transition-all duration-300"
             style={{ height: `${Math.max(2, (v / max) * 100)}%`, background: color, opacity: 0.35 + (v / max) * 0.65 }}
             title={String(v)} />
      ))}
    </div>
  );
}
