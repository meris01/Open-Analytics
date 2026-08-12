import type { ReactNode } from 'react';
import { IUp, IDown } from './icons';
import { delta, num, pct } from '@/lib/format';

/* ---------------- Page header ---------------- */
export function PageHead({
  title, sub, action,
}: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="rise flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="headline-lg">{title}</h1>
        {sub && <p className="mt-1.5 text-[13px] text-fg-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------- Card ---------------- */
export function Card({
  title, sub, action, children, className = '', pad = true, id,
}: { title?: string; sub?: string; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean; id?: string }) {
  return (
    <section id={id} className={`card overflow-hidden scroll-mt-24 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3.5">
          <div>
            {title && <h2 className="headline-md">{title}</h2>}
            {sub && <p className="mt-0.5 text-[12.5px] text-fg-muted">{sub}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

/* ---------------- Delta pill ---------------- */
export function Trend({
  cur, prev, invert = false, suffix = 'vs prev',
}: { cur: number; prev: number; invert?: boolean; suffix?: string }) {
  const d = delta(cur, prev);
  const good = invert ? d.dir === 'down' : d.dir === 'up';
  const cls =
    d.dir === 'flat'
      ? 'text-fg-subtle bg-container-high'
      : good
        ? 'text-primary bg-primary-soft'
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

/* ---------------- KPI card ---------------- */
export function Kpi({
  label, value, cur, prev, series, accent = false, invert = false, icon,
}: {
  label: string; value: string; cur: number; prev: number;
  series?: number[]; accent?: boolean; invert?: boolean; icon?: ReactNode;
}) {
  return (
    <div className="card card-hover group relative flex flex-col gap-3 overflow-hidden p-5">
      {accent && (
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
             style={{ background: 'var(--c-primary-soft)' }} />
      )}
      <div className="relative flex items-center justify-between">
        <span className="label-caps text-fg-subtle">{label}</span>
        <span className="text-fg-subtle">{icon}</span>
      </div>
      <div className="relative">
        <div className="kpi-xl">{value}</div>
        <div className="mt-2"><Trend cur={cur} prev={prev} invert={invert} /></div>
      </div>
      {series && series.length > 1 && (
        <Sparkline data={series} color={accent ? 'var(--c-accent)' : 'var(--c-primary)'} />
      )}
    </div>
  );
}

/* ---------------- Sparkline ---------------- */
export function Sparkline({
  data, color = 'var(--c-primary)', height = 30,
}: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 28 - ((v - min) / span) * 26;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ height, width: '100%' }} className="relative">
      <polyline
        points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="draw"
      />
    </svg>
  );
}

/* ---------------- Bar list ---------------- */
export function BarList({
  rows, valueLabel = 'Visitors', renderValue, secondary,
}: {
  rows: { label: ReactNode; key: string; value: number; extra?: ReactNode }[];
  valueLabel?: string;
  renderValue?: (v: number) => string;
  secondary?: string;
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
        <div key={r.key} className="group relative flex items-center justify-between overflow-hidden rounded px-2 py-1.5 transition-colors hover:bg-container-high">
          <div
            className="grow absolute inset-y-0 left-0 rounded"
            style={{
              width: `${(r.value / max) * 100}%`,
              background: 'var(--c-primary-soft)',
              animationDelay: `${i * 35}ms`,
            }}
          />
          <span className="relative truncate pr-3 text-[13px]">{r.label}</span>
          <span className="relative flex items-center gap-3 whitespace-nowrap">
            {r.extra}
            <span className="data-mono text-[12.5px]">
              {renderValue ? renderValue(r.value) : num(r.value)}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Table ---------------- */
export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto scroll-thin">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="border-b border-border">
            {head.map((h, i) => (
              <th key={i} className={`label-caps px-5 py-2.5 font-semibold text-fg-subtle ${i > 0 ? 'text-right' : ''}`}>
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
        style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
      {children}
    </tr>
  );
}

/* ---------------- Empty / Meter ---------------- */
export function Empty({ label = 'No data for this period', hint }: { label?: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-14 text-center">
      <div className="dot-grid h-10 w-24 rounded opacity-60" />
      <p className="mt-2 text-[13px] text-fg-muted">{label}</p>
      {hint && <p className="max-w-xs text-[12px] text-fg-subtle">{hint}</p>}
    </div>
  );
}

export function Meter({ value, max, tone = 'primary' }: { value: number; max: number; tone?: 'primary' | 'danger' }) {
  const w = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="data-mono text-[12px] text-fg-muted">{pct(w, 0)}</span>
      <span className="block h-1.5 w-16 overflow-hidden rounded-full bg-container-highest">
        <span className="grow block h-full rounded-full"
              style={{ width: `${w}%`, background: tone === 'danger' ? 'var(--c-danger)' : 'var(--c-primary)' }} />
      </span>
    </span>
  );
}

export function Badge({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'primary' | 'danger' | 'accent' }) {
  const map = {
    muted: 'bg-container-high text-fg-muted',
    primary: 'bg-primary-soft text-primary',
    danger: 'bg-danger-soft text-danger',
    accent: 'text-[color:var(--c-accent)]',
  } as const;
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${map[tone]}`}>
      {children}
    </span>
  );
}
