import type { ReactNode } from 'react';

/* ---------------------------------------------------------------------------
   Real country flags, drawn as inline SVG.

   Most national flags are a handful of geometric primitives, so we describe
   them as data rather than shipping 250 image files. Everything renders in a
   4:3 viewBox and is clipped to a rounded rect — crisp at 14px, and immune to
   the missing-emoji-font problem that plagues Linux servers.
--------------------------------------------------------------------------- */

type Spec =
  | { t: 'h'; c: string[] }
  | { t: 'v'; c: string[] }
  | { t: 'hx'; c: string[]; w: number[] }
  | { t: 'custom'; bg: string; d: ReactNode };

const W = 24, H = 18;

const nordic = (bg: string, cross: string, inner?: string): Spec => ({
  t: 'custom', bg,
  d: (
    <>
      {inner && (<>
        <rect x="6.5" y="0" width="5" height={H} fill={inner} />
        <rect x="0" y="6.5" width={W} height="5" fill={inner} />
      </>)}
      <rect x={inner ? 7.75 : 7} y="0" width={inner ? 2.5 : 3.2} height={H} fill={cross} />
      <rect x="0" y={inner ? 7.75 : 7} width={W} height={inner ? 2.5 : 3.2} fill={cross} />
    </>
  ),
});

const FLAGS: Record<string, Spec> = {
  DE: { t: 'h', c: ['#000000', '#DD0000', '#FFCE00'] },
  NL: { t: 'h', c: ['#AE1C28', '#FFFFFF', '#21468B'] },
  AT: { t: 'h', c: ['#ED2939', '#FFFFFF', '#ED2939'] },
  RU: { t: 'h', c: ['#FFFFFF', '#0039A6', '#D52B1E'] },
  BG: { t: 'h', c: ['#FFFFFF', '#00966E', '#D62612'] },
  HU: { t: 'h', c: ['#CE2939', '#FFFFFF', '#477050'] },
  UA: { t: 'h', c: ['#0057B7', '#0057B7', '#FFD700'] },
  PL: { t: 'h', c: ['#FFFFFF', '#FFFFFF', '#DC143C'] },
  ID: { t: 'h', c: ['#FF0000', '#FF0000', '#FFFFFF'] },
  EE: { t: 'h', c: ['#0072CE', '#000000', '#FFFFFF'] },
  LT: { t: 'h', c: ['#FDB913', '#006A44', '#C1272D'] },
  AR: { t: 'h', c: ['#74ACDF', '#FFFFFF', '#74ACDF'] },
  EG: { t: 'h', c: ['#CE1126', '#FFFFFF', '#000000'] },
  CO: { t: 'hx', c: ['#FCD116', '#003893', '#CE1126'], w: [2, 1, 1] },
  ES: { t: 'hx', c: ['#AA151B', '#F1BF00', '#AA151B'], w: [1, 2, 1] },
  TH: { t: 'hx', c: ['#A51931', '#F4F5F8', '#2D2A4A'], w: [1, 1, 2] },

  FR: { t: 'v', c: ['#002395', '#FFFFFF', '#ED2939'] },
  IT: { t: 'v', c: ['#009246', '#F1F2F1', '#CE2B37'] },
  IE: { t: 'v', c: ['#169B62', '#FFFFFF', '#FF883E'] },
  BE: { t: 'v', c: ['#000000', '#FAE042', '#ED2939'] },
  RO: { t: 'v', c: ['#002B7F', '#FCD116', '#CE1126'] },
  NG: { t: 'v', c: ['#008751', '#FFFFFF', '#008751'] },
  PE: { t: 'v', c: ['#D91023', '#FFFFFF', '#D91023'] },
  MX: { t: 'v', c: ['#006847', '#FFFFFF', '#CE1126'] },

  SE: nordic('#006AA7', '#FECC00'),
  NO: nordic('#BA0C2F', '#00205B', '#FFFFFF'),
  DK: nordic('#C8102E', '#FFFFFF'),
  FI: nordic('#FFFFFF', '#003580'),
  IS: nordic('#02529C', '#DC1E35', '#FFFFFF'),

  US: { t: 'custom', bg: '#FFFFFF', d: (<>
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <rect key={i} y={i * 2.77} width={W} height="1.385" fill="#B22234" />
    ))}
    <rect width="10.5" height="9.7" fill="#3C3B6E" />
    {[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => (
      <circle key={`${r}-${c}`} cx={1.4 + c * 2.1} cy={1.5 + r * 2.3} r="0.42" fill="#FFFFFF" />
    )))}
  </>) },
  GB: { t: 'custom', bg: '#012169', d: (<>
    <path d="M0 0 L24 18 M24 0 L0 18" stroke="#FFFFFF" strokeWidth="3.8" />
    <path d="M0 0 L24 18" stroke="#C8102E" strokeWidth="1.9" />
    <path d="M24 0 L0 18" stroke="#C8102E" strokeWidth="1.9" />
    <path d="M12 0 V18 M0 9 H24" stroke="#FFFFFF" strokeWidth="6" />
    <path d="M12 0 V18 M0 9 H24" stroke="#C8102E" strokeWidth="3.4" />
  </>) },
  JP: { t: 'custom', bg: '#FFFFFF', d: <circle cx="12" cy="9" r="5.2" fill="#BC002D" /> },
  BD: { t: 'custom', bg: '#006A4E', d: <circle cx="10.8" cy="9" r="5" fill="#F42A41" /> },
  IN: { t: 'custom', bg: '#FFFFFF', d: (<>
    <rect width={W} height="6" fill="#FF9933" />
    <rect y="12" width={W} height="6" fill="#138808" />
    <circle cx="12" cy="9" r="2.5" fill="none" stroke="#000088" strokeWidth="0.7" />
    <circle cx="12" cy="9" r="0.6" fill="#000088" />
  </>) },
  CA: { t: 'custom', bg: '#FFFFFF', d: (<>
    <rect width="6" height={H} fill="#FF0000" /><rect x="18" width="6" height={H} fill="#FF0000" />
    <path d="M12 4.4 l.85 2.3 2.1-.62-.72 2.1 1.9.55-1.75 1.4.55 1.5-2.1-.5-.18 2.4h-1.3l-.18-2.4-2.1.5.55-1.5L8.9 8.73l1.9-.55-.72-2.1 2.1.62z" fill="#FF0000" />
  </>) },
  CH: { t: 'custom', bg: '#FF0000', d: (<>
    <rect x="10.6" y="4.6" width="2.8" height="8.8" fill="#FFFFFF" />
    <rect x="7.6" y="7.6" width="8.8" height="2.8" fill="#FFFFFF" />
  </>) },
  BR: { t: 'custom', bg: '#009B3A', d: (<>
    <path d="M12 2.2 L21.6 9 L12 15.8 L2.4 9 Z" fill="#FEDF00" />
    <circle cx="12" cy="9" r="3.5" fill="#002776" />
    <path d="M8.7 8 a4.6 4.6 0 0 1 6.6 1.4" stroke="#FFFFFF" strokeWidth="0.9" fill="none" />
  </>) },
  AU: { t: 'custom', bg: '#00247D', d: (<>
    <path d="M0 0 L12 9 M12 0 L0 9" stroke="#FFFFFF" strokeWidth="1.9" />
    <path d="M6 0 V9 M0 4.5 H12" stroke="#FFFFFF" strokeWidth="3" />
    <path d="M6 0 V9 M0 4.5 H12" stroke="#CF142B" strokeWidth="1.6" />
    <circle cx="6" cy="14" r="1.5" fill="#FFFFFF" />
    {[[17.5,4.5],[20,8],[17.5,12],[15.5,8],[21.5,12.5]].map(([x,y],i)=>
      <circle key={i} cx={x} cy={y} r="0.85" fill="#FFFFFF" />)}
  </>) },
  NZ: { t: 'custom', bg: '#00247D', d: (<>
    <path d="M0 0 L12 9 M12 0 L0 9" stroke="#FFFFFF" strokeWidth="1.7" />
    <path d="M6 0 V9 M0 4.5 H12" stroke="#FFFFFF" strokeWidth="2.8" />
    <path d="M6 0 V9 M0 4.5 H12" stroke="#CC142B" strokeWidth="1.5" />
    {[[17.5,5],[20.5,9],[17.5,13.5],[15,9]].map(([x,y],i)=>
      <circle key={i} cx={x} cy={y} r="1" fill="#CC142B" stroke="#FFFFFF" strokeWidth="0.4" />)}
  </>) },
  PT: { t: 'custom', bg: '#FF0000', d: (<>
    <rect width="9.6" height={H} fill="#006600" />
    <circle cx="9.6" cy="9" r="3.1" fill="#FFFF00" />
    <circle cx="9.6" cy="9" r="2" fill="#FF0000" />
    <circle cx="9.6" cy="9" r="1.1" fill="#FFFFFF" />
  </>) },
  KR: { t: 'custom', bg: '#FFFFFF', d: (<>
    <circle cx="12" cy="9" r="4" fill="#CD2E3A" />
    <path d="M8 9a4 4 0 0 1 8 0 2 2 0 0 1-4 0 2 2 0 0 0-4 0z" fill="#0047A0" />
    <path d="M3.4 4.4 l2.6 1.8M3.4 5.8 l2.6 1.8M18 11.4 l2.6 1.8M18 12.8 l2.6 1.8" stroke="#000000" strokeWidth="0.7" />
  </>) },
  CN: { t: 'custom', bg: '#DE2910', d: (<>
    <path d="M4.6 2.4 l.83 2.55h2.68L5.9 6.53l.83 2.55-2.17-1.58-2.17 1.58.83-2.55L1.05 4.95h2.68z" fill="#FFDE00" />
    {[[9.6,2.4],[11.4,4.2],[11.4,6.9],[9.6,8.6]].map(([x,y],i)=>
      <circle key={i} cx={x} cy={y} r="0.75" fill="#FFDE00" />)}
  </>) },
  SG: { t: 'custom', bg: '#FFFFFF', d: (<>
    <rect width={W} height="9" fill="#ED2939" />
    <circle cx="5.6" cy="4.5" r="3" fill="#FFFFFF" />
    <circle cx="7.3" cy="4.5" r="3" fill="#ED2939" />
    {[[9.5,2.6],[10.6,4.4],[10.2,6.4],[8.4,6.4],[8,4.4]].map(([x,y],i)=>
      <circle key={i} cx={x} cy={y} r="0.5" fill="#FFFFFF" />)}
  </>) },
  TR: { t: 'custom', bg: '#E30A17', d: (<>
    <circle cx="9" cy="9" r="4" fill="#FFFFFF" />
    <circle cx="10.5" cy="9" r="3.2" fill="#E30A17" />
    <path d="M14.2 9 l3.4-1.15-2.1 2.9v-3.5l2.1 2.9z" fill="#FFFFFF" />
  </>) },
  ZA: { t: 'custom', bg: '#007A4D', d: (<>
    <rect width={W} height="5.6" fill="#DE3831" />
    <rect y="12.4" width={W} height="5.6" fill="#002395" />
    <path d="M0 0 L10 9 L0 18 Z" fill="#000000" />
    <path d="M0 2.4 L7.4 9 L0 15.6 Z" fill="#FFB612" />
  </>) },
  IL: { t: 'custom', bg: '#FFFFFF', d: (<>
    <rect y="2.2" width={W} height="2.2" fill="#0038B8" />
    <rect y="13.6" width={W} height="2.2" fill="#0038B8" />
    <path d="M12 5.6 l2.7 4.6h-5.4z M12 12.4 l-2.7-4.6h5.4z" fill="none" stroke="#0038B8" strokeWidth="0.85" />
  </>) },
  GR: { t: 'custom', bg: '#FFFFFF', d: (<>
    {[0,1,2,3,4].map((i)=><rect key={i} y={i*4} width={W} height="2" fill="#0D5EAF" />)}
    <rect width="10" height="10" fill="#0D5EAF" />
    <rect x="4" y="0" width="2" height="10" fill="#FFFFFF" />
    <rect x="0" y="4" width="10" height="2" fill="#FFFFFF" />
  </>) },
  CZ: { t: 'custom', bg: '#FFFFFF', d: (<>
    <rect y="9" width={W} height="9" fill="#D7141A" />
    <path d="M0 0 L11 9 L0 18 Z" fill="#11457E" />
  </>) },
  PH: { t: 'custom', bg: '#0038A8', d: (<>
    <rect y="9" width={W} height="9" fill="#CE1126" />
    <path d="M0 0 L11 9 L0 18 Z" fill="#FFFFFF" />
    <circle cx="3.6" cy="9" r="1.7" fill="#FCD116" />
  </>) },
  MY: { t: 'custom', bg: '#FFFFFF', d: (<>
    {[0,1,2,3,4,5,6].map((i)=><rect key={i} y={i*2.57} width={W} height="1.285" fill="#CC0001" />)}
    <rect width="12" height="9" fill="#010066" />
    <circle cx="4.8" cy="4.5" r="2.4" fill="#FFCC00" />
    <circle cx="6" cy="4.5" r="2.1" fill="#010066" />
    <path d="M8.8 3 l.5 1.4 1.4.1-1.1.9.4 1.4-1.2-.8-1.2.8.4-1.4-1.1-.9 1.4-.1z" fill="#FFCC00" />
  </>) },
  VN: { t: 'custom', bg: '#DA251D', d: (
    <path d="M12 4.6 l1.55 4.75h5l-4.05 2.95 1.55 4.75L12 14.05 7.95 17l1.55-4.75L5.45 9.35h5z" fill="#FFFF00" />
  ) },
  SA: { t: 'custom', bg: '#006C35', d: (<>
    <rect x="4.5" y="11.8" width="15" height="1.3" fill="#FFFFFF" />
    <rect x="5" y="5.4" width="14" height="1.1" fill="#FFFFFF" />
  </>) },
  AE: { t: 'custom', bg: '#FFFFFF', d: (<>
    <rect width={W} height="6" fill="#00732F" />
    <rect y="12" width={W} height="6" fill="#000000" />
    <rect width="6" height={H} fill="#FF0000" />
  </>) },
  PK: { t: 'custom', bg: '#01411C', d: (<>
    <rect width="6" height={H} fill="#FFFFFF" />
    <circle cx="15" cy="9" r="4" fill="#FFFFFF" />
    <circle cx="16.6" cy="8" r="3.5" fill="#01411C" />
    <path d="M18.6 4.4 l.45 1.25 1.25.1-.95.8.35 1.25-1.1-.7-1.1.7.35-1.25-.95-.8 1.25-.1z" fill="#FFFFFF" />
  </>) },
  CL: { t: 'custom', bg: '#FFFFFF', d: (<>
    <rect y="9" width={W} height="9" fill="#D52B1E" />
    <rect width="9" height="9" fill="#0039A6" />
    <path d="M4.5 2.2 l.9 2.7h2.85L5.95 6.6l.9 2.7L4.5 7.6 2.2 9.3l.9-2.7L.75 4.9H3.6z" fill="#FFFFFF" />
  </>) },
};

export const HAS_FLAG = (code?: string | null) => Boolean(code && FLAGS[code.toUpperCase()]);

export function CountryFlag({
  code, size = 16, title, className = '',
}: { code?: string | null; size?: number; title?: string; className?: string }) {
  const cc = (code ?? '').toUpperCase().slice(0, 2);
  const spec = FLAGS[cc];
  const w = Math.round(size * 1.34);
  const h = Math.round(size);

  if (!spec) {
    return (
      <span
        role="img" aria-label={title ?? 'Unknown country'} title={title ?? (cc || 'Unknown')}
        className={`inline-flex shrink-0 items-center justify-center rounded-[2px] border border-border bg-container-high text-fg-subtle ${className}`}
        style={{ width: w, height: h, fontSize: Math.max(7, size * 0.5), fontWeight: 600, letterSpacing: '-0.03em' }}
      >
        {cc || '··'}
      </span>
    );
  }

  let body: ReactNode;
  if (spec.t === 'custom') {
    body = <><rect width={W} height={H} fill={spec.bg} />{spec.d}</>;
  } else if (spec.t === 'h' || spec.t === 'hx') {
    const weights = spec.t === 'hx' ? spec.w : spec.c.map(() => 1);
    const total = weights.reduce((a, b) => a + b, 0);
    let y = 0;
    body = <>{spec.c.map((col, i) => {
      const bh = (weights[i] / total) * H;
      const r = <rect key={i} y={y} width={W} height={bh + 0.03} fill={col} />;
      y += bh;
      return r;
    })}</>;
  } else {
    const bw = W / spec.c.length;
    body = <>{spec.c.map((col, i) => (
      <rect key={i} x={i * bw} width={bw + 0.03} height={H} fill={col} />
    ))}</>;
  }

  const id = `fl${cc}`;
  return (
    <svg
      width={w} height={h} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title ?? cc}
      className={`shrink-0 ${className}`}
      style={{ borderRadius: 2.5, boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / 0.16)' }}
    >
      <title>{title ?? cc}</title>
      <defs><clipPath id={id}><rect width={W} height={H} rx="2" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>{body}</g>
    </svg>
  );
}
