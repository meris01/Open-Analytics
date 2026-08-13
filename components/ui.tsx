import type { ReactNode } from 'react';
import Link from 'next/link';
import { IUp, IDown, IChevronR } from './icons';
import { delta, num, pct } from '@/lib/format';

/* ------------------------------ PAGE HEAD -------------------------------- */
export function PageHead({
  title, sub, action, eyebrow,
}: { title: string; sub?: string; action?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="rise flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="headline-lg">{title}</h1>
        {sub && <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-fg-muted">{sub}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

/* --------------------------------- CARD ---------------------------------- */
export function Card({
  title, sub, action, children, className = '', pad = true, id, footer, icon,
}: {
  title?: string; sub?: string; action?: ReactNode; children: ReactNode;
  className?: string; pad?: boolean; id?: string; footer?: ReactNode; icon?: ReactNode;
}) {
  return (
    <section id={id} className={`card overflow-hidden scroll-mt-24 ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && <span className="shrink-0 text-fg-subtle">{icon}</span>}
            <div className="min-w-0">
              {title && <h2 className="headline-md truncate">{title}</h2>}
              {sub && <p className="mt-0.5 text-[12.5px] text-fg-muted">{sub}</p>}
            </div>
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
      {footer && <div className="border-t border-border bg-surface-low px-5 py-3">{footer}</div>}
    </section>
  );
}

/* ------------------------------- TREND PILL ------------------------------ */
export function Trend({
  cur, prev, invert = false, suffix = 'vs prev',
}: { cur: number; prev: number; invert?: boolean; suffix?: string }) {
  const d = delta(cur, prev);
  const good = invert ? d.dir === 'down' : d.dir === 'up';
  const cls =
    d.dir === 'flat' ? 'text-fg-subtle bg-container-high'
    : good ? 'text-primary bg-primary-soft'
    : 'text-danger bg-danger-soft';
  const Icon = d.dir === 'down' ? IDown : IUp;
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11.5px] font-medium tnum ${cls}`}>
        {d.dir !== 'flat' && <Icon width={11} height={11} />}
        {d.dir === 'flat' ? '—' : `${d.value.toFixed(1)}%`}
      </span>
      <span className="text-[11.5px] text-fg-subtle">{suffix}</span>
    </div>
  );
}

/* --------------------------------- KPI ----------------------------------- */
export function Kpi({
  label, value, cur, prev, series, accent = false, invert = false, icon, href, note,
}: {
  label: string; value: string; cur: number; prev: number;
  series?: number[]; accent?: boolean; invert?: boolean;
  icon?: ReactNode; href?: string; note?: string;
}) {
  const inner = (
    <>
      <div className="relative flex items-center justify-between">
        <span className="label-caps text-fg-subtle">{label}</span>
        <span className="text-fg-subtle transition-colors duration-150 group-hover:text-fg-muted">{icon}</span>
      </div>
      <div className="relative">
        <div className="kpi-xl">{value}</div>
        <div className="mt-2"><Trend cur={cur} prev={prev} invert={invert} /></div>
        {note && <p className="mt-1.5 text-[11.5px] text-fg-subtle">{note}</p>}
      </div>
      {series && series.length > 1 && (
        <Sparkline data={series} color={accent ? 'var(--c-accent)' : 'var(--c-primary)'} />
      )}
      {href && (
        <IChevronR
          width={14} height={14}
          className="absolute bottom-4 right-4 text-fg-subtle opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:opacity-100"
        />
      )}
    </>
  );

  const cls = 'card card-hover group relative flex flex-col gap-3 overflow-hidden p-5';
  const glow = accent && (
    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
         style={{ background: 'var(--c-accent)' }} />
  );

  return href
    ? <Link href={href} className={cls}>{glow}{inner}</Link>
    : <div className={cls}>{glow}{inner}</div>;
}

/* ------------------------------ SPARKLINE -------------------------------- */
export function Sparkline({
  data, color = 'var(--c-primary)', height = 32,
}: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * 100;
    const y = 28 - ((v - min) / span) * 25;
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const area = `${line} L100,30 L0,30 Z`;
  const gid = `sp${Math.round(max)}${data.length}${Math.round(min)}`;

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ height, width: '100%' }} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} className="fade" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"
            strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="draw" />
    </svg>
  );
}

/* ------------------------------- BAR LIST -------------------------------- */
export function BarList({
  rows, valueLabel = 'Visitors', renderValue, secondary,
}: {
  rows: { label: ReactNode; key: string; value: number; extra?: ReactNode }[];
  valueLabel?: string; renderValue?: (v: number) => string; secondary?: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (!rows.length) return <Empty label={`No ${valueLabel.toLowerCase()} yet`} />;
  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between px-2 pb-1.5">
        <span className="label-caps text-fg-subtle">{secondary ?? 'Name'}</span>
        <span className="label-caps text-fg-subtle">{valueLabel}</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.key}
             className="group relative flex items-center justify-between overflow-hidden rounded px-2 py-1.5 transition-colors hover:bg-container-high">
          <div className="grow absolute inset-y-0 left-0 rounded"
               style={{ width: `${(r.value / max) * 100}%`, background: 'var(--c-primary-soft)', animationDelay: `${i * 30}ms` }} />
          <span className="relative min-w-0 flex-1 truncate pr-3 text-[13px]">{r.label}</span>
          <span className="relative flex shrink-0 items-center gap-3 whitespace-nowrap">
            {r.extra}
            <span className="data-mono text-[12.5px]">{renderValue ? renderValue(r.value) : num(r.value)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- TABLE --------------------------------- */
export function Table({ head, children, minWidth = 560 }:
  { head: ReactNode[]; children: ReactNode; minWidth?: number }) {
  return (
    <div className="scroll-thin overflow-x-auto">
      <table className="w-full text-left" style={{ minWidth }}>
        <thead className="sticky top-0 z-10 bg-container">
          <tr className="border-b border-border">
            {head.map((h, i) => (
              <th key={i} scope="col"
                  className={`label-caps whitespace-nowrap bg-container px-5 py-2.5 font-semibold text-fg-subtle ${i > 0 ? 'text-right' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Td({ children, mono = false, right = false, className = '' }:
  { children: ReactNode; mono?: boolean; right?: boolean; className?: string }) {
  return (
    <td className={`px-5 py-3 text-[13px] ${mono ? 'data-mono' : ''} ${right ? 'text-right' : ''} ${className}`}>
      {children}
    </td>
  );
}

export function Tr({ children, i = 0 }: { children: ReactNode; i?: number }) {
  return (
    <tr className="rise border-b border-border/60 transition-colors last:border-0 hover:bg-container-high"
        style={{ animationDelay: `${Math.min(i, 12) * 26}ms` }}>
      {children}
    </tr>
  );
}

/* ------------------------------ EMPTY STATE ------------------------------ */
export function Empty({
  label = 'No data for this period', hint, action, icon,
}: { label?: string; hint?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="relative mb-1 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface-low text-fg-subtle">
        <div className="dot-grid absolute inset-0 rounded-xl opacity-60" />
        <span className="relative">{icon ?? <BarsGlyph />}</span>
      </div>
      <p className="text-[13px] font-medium">{label}</p>
      {hint && <p className="max-w-sm text-[12.5px] leading-5 text-fg-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function BarsGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M5 19v-5M10.5 19V9M16 19v-7M21.5 19V5" opacity="0.55" />
    </svg>
  );
}

/* -------------------------------- METER ---------------------------------- */
export function Meter({ value, max, tone = 'primary' }:
  { value: number; max: number; tone?: 'primary' | 'danger' | 'accent' }) {
  const w = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const bg = tone === 'danger' ? 'var(--c-danger)' : tone === 'accent' ? 'var(--c-accent)' : 'var(--c-primary)';
  return (
    <span className="inline-flex items-center gap-2">
      <span className="data-mono text-[12px] text-fg-muted">{pct(w, 0)}</span>
      <span className="block h-1.5 w-16 overflow-hidden rounded-full bg-container-highest">
        <span className="grow block h-full rounded-full" style={{ width: `${w}%`, background: bg }} />
      </span>
    </span>
  );
}

/* -------------------------------- BADGE ---------------------------------- */
export function Badge({ children, tone = 'muted' }:
  { children: ReactNode; tone?: 'muted' | 'primary' | 'danger' | 'accent' | 'outline' }) {
  const map = {
    muted: 'bg-container-high text-fg-muted',
    primary: 'bg-primary-soft text-primary',
    danger: 'bg-danger-soft text-danger',
    accent: 'bg-container-high text-[color:var(--c-accent)]',
    outline: 'border border-border text-fg-muted',
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${map[tone]}`}>
      {children}
    </span>
  );
}

/* --------------------------- SEGMENTED CONTROL --------------------------- */
export function Segmented({ options, active }:
  { options: { key: string; label: string; href: string }[]; active: string }) {
  return (
    <div className="flex rounded-md border border-border bg-container p-0.5" role="tablist">
      {options.map((o) => (
        <Link
          key={o.key} href={o.href} role="tab" aria-selected={o.key === active}
          className={`rounded px-3 py-1.5 text-[12.5px] transition-colors duration-150 ${
            o.key === active
              ? 'bg-primary-strong font-medium text-[color:var(--c-on-primary)]'
              : 'text-fg-muted hover:text-fg'
          }`}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}

/* ------------------------------- SKELETON -------------------------------- */
export function Skeleton({ className = '', h = 14, w = '100%' }:
  { className?: string; h?: number; w?: number | string }) {
  return <span className={`shimmer block rounded ${className}`} style={{ height: h, width: w }} />;
}

export function KpiSkeleton() {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <Skeleton h={10} w={70} />
      <Skeleton h={34} w={130} />
      <Skeleton h={12} w={100} />
      <Skeleton h={30} />
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton h={16} w={16} className="!rounded-md" />
          <Skeleton h={12} w={`${35 + ((i * 13) % 30)}%`} />
          <span className="flex-1" />
          <Skeleton h={12} w={54} />
        </div>
      ))}
    </div>
  );
}

/* --------------------------- STAT STRIP ---------------------------------- */
export function StatStrip({ items }: { items: { label: string; value: string; tone?: 'good' | 'bad' }[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((m) => (
        <div key={m.label} className="card card-hover flex items-center justify-between p-4">
          <span className="label-caps text-fg-subtle">{m.label}</span>
          <span className={`data-mono text-[15px] ${
            m.tone === 'good' ? 'text-primary' : m.tone === 'bad' ? 'text-danger' : ''
          }`}>{m.value}</span>
        </div>
      ))}
    </section>
  );
}
