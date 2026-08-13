import type { ReactNode } from 'react';
import { BRANDS, BROWSERS, SYSTEMS, brandKey, hueOf, type Mark } from './marks/brands';
import { CountryFlag } from './marks/flags';

export { CountryFlag } from './marks/flags';
export { BRANDS, brandKey } from './marks/brands';

function Tile({ mark, size, title }: { mark: Mark; size: number; title: string }) {
  const inner = mark.pad ?? 0.7;
  return (
    <span
      role="img" aria-label={title} title={title}
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[5px]"
      style={{ width: size, height: size, background: mark.bg === 'transparent' ? undefined : mark.bg }}
    >
      <svg
        width={mark.bg === 'transparent' ? size : size * inner}
        height={mark.bg === 'transparent' ? size : size * inner}
        viewBox="0 0 24 24"
        style={mark.bg === 'transparent' ? { borderRadius: 5 } : undefined}
      >
        {mark.d}
      </svg>
    </span>
  );
}

/** Logo for a traffic source. Falls back to a stable coloured monogram for
 *  domains we don't ship a mark for, so nothing ever renders blank. */
export function SourceMark({
  source, size = 16, className = '',
}: { source?: string | null; size?: number; className?: string }) {
  const raw = (source ?? 'direct').toLowerCase().replace(/^www\./, '');

  if (!raw || raw === 'direct' || raw === 'unknown' || raw === 'none') {
    return (
      <span
        role="img" aria-label="Direct traffic" title="Direct — typed or bookmarked"
        className={`inline-flex shrink-0 items-center justify-center rounded-[5px] border border-border bg-container-high text-fg-subtle ${className}`}
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M5 12h14M12 5v14" />
        </svg>
      </span>
    );
  }

  const key = brandKey(raw);
  if (key && BRANDS[key]) {
    return <span className={className}><Tile mark={BRANDS[key]} size={size} title={BRANDS[key].label} /></span>;
  }

  const h = hueOf(raw);
  const letter = raw.replace(/^(m|l|old|search|www)\./, '').replace(/\.(com|io|org|net|co|dev|ai|app|so|st)$/, '')[0]?.toUpperCase() ?? '?';
  return (
    <span
      role="img" aria-label={raw} title={raw}
      className={`inline-flex shrink-0 items-center justify-center rounded-[5px] font-semibold ${className}`}
      style={{
        width: size, height: size, fontSize: size * 0.55,
        background: `linear-gradient(140deg, hsl(${h} 58% 46%), hsl(${(h + 28) % 360} 58% 38%))`,
        color: '#fff',
      }}
    >
      {letter}
    </span>
  );
}

export function BrowserMark({ name, size = 15 }: { name?: string | null; size?: number }) {
  const mark = BROWSERS[name ?? ''] ?? BROWSERS.Other;
  return <span className="text-fg-subtle"><Tile mark={mark} size={size} title={name ?? 'Unknown browser'} /></span>;
}

export function OSMark({ name, size = 15 }: { name?: string | null; size?: number }) {
  const mark = SYSTEMS[name ?? ''] ?? SYSTEMS.Other;
  return <span className="text-fg-muted"><Tile mark={mark} size={size} title={name ?? 'Unknown OS'} /></span>;
}

export function DeviceMark({ kind, size = 15 }: { kind?: string | null; size?: number }) {
  const k = (kind ?? '').toLowerCase();
  const paths: Record<string, ReactNode> = {
    desktop: <><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
    mobile: <><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18.5h2" /></>,
    tablet: <><rect x="4" y="2" width="16" height="20" rx="2.5" /><path d="M10.5 18.5h3" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
         role="img" aria-label={kind ?? 'device'} className="shrink-0 text-fg-muted">
      <title>{kind ?? 'device'}</title>
      {paths[k] ?? paths.desktop}
    </svg>
  );
}

/** Favicon-style avatar for one of the user's own websites. */
export function SiteMark({ domain, size = 18 }: { domain: string; size?: number }) {
  const h = hueOf(domain);
  const letter = domain.replace(/^www\./, '')[0]?.toUpperCase() ?? '?';
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-[5px] font-semibold"
      style={{
        width: size, height: size, fontSize: size * 0.52,
        background: `linear-gradient(140deg, hsl(${h} 62% 52%), hsl(${(h + 40) % 360} 62% 40%))`,
        color: '#fff', boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.25)',
      }}
    >
      {letter}
    </span>
  );
}

/** Country flag plus its name — the pairing used in every table. */
export function CountryCell({ code, name, size = 15 }: { code?: string | null; name: string; size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <CountryFlag code={code} size={size} title={name} />
      <span className="truncate">{name}</span>
    </span>
  );
}
