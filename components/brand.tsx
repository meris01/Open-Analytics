import type { ReactNode } from 'react';

/* ---------------------------------------------------------------------------
   Inline brand marks. No network requests, no emoji fonts, no broken glyphs
   on bare Linux containers — everything renders from the bundle.
   Marks are used nominatively, purely to identify the traffic source.
--------------------------------------------------------------------------- */

type Mark = { bg: string; fg: string; path: ReactNode; label: string };

const MARKS: Record<string, Mark> = {
  google: {
    label: 'Google', bg: '#ffffff', fg: '#000',
    path: (
      <>
        <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.55-5.17 3.55-8.87z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z" />
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.18 15.24 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
      </>
    ),
  },
  x: {
    label: 'X', bg: '#000000', fg: '#fff',
    path: <path fill="#fff" d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24H16.17l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z" />,
  },
  reddit: {
    label: 'Reddit', bg: '#FF4500', fg: '#fff',
    path: <path fill="#fff" d="M12 2c-.9 0-1.6.7-1.6 1.6 0 .1 0 .2.03.3l-.7 3.3c-1.9.1-3.6.7-4.9 1.6a2 2 0 1 0-2.2 3.3c0 .2-.03.4-.03.6 0 3.3 3.8 6 8.4 6s8.4-2.7 8.4-6c0-.2 0-.4-.03-.6a2 2 0 1 0-2.2-3.3c-1.3-.9-3-1.5-5-1.6l.6-2.8 2 .4a1.4 1.4 0 1 0 .16-.98l-2.4-.5a.5.5 0 0 0-.6.4l-.05.2A1.6 1.6 0 0 0 12 2zM8.4 12.6a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zm7.2 0a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zm-7.05 4.3a.5.5 0 0 1 .7 0c.75.75 2.05.8 2.75.8s2-.05 2.75-.8a.5.5 0 0 1 .7.7c-1.2 1.2-3.1 1.1-3.45 1.1s-2.25.1-3.45-1.1a.5.5 0 0 1 0-.7z" />,
  },
  linkedin: {
    label: 'LinkedIn', bg: '#0A66C2', fg: '#fff',
    path: <path fill="#fff" d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.86-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.56V9h3.56zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />,
  },
  github: {
    label: 'GitHub', bg: '#181717', fg: '#fff',
    path: <path fill="#fff" d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z" />,
  },
  producthunt: {
    label: 'Product Hunt', bg: '#DA552F', fg: '#fff',
    path: <path fill="#fff" d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm1.4 13.2h-2.8v3.6H8.2V7.2h5.2a3 3 0 0 1 0 6zm0-3.6h-2.8v1.2h2.8a.6.6 0 0 0 0-1.2z" />,
  },
  hackernews: {
    label: 'Hacker News', bg: '#FF6600', fg: '#fff',
    path: <path fill="#fff" d="M2 2h20v20H2zm9.1 11.4L7 6h2l3 5.7L15 6h2l-4.1 7.4V18h-1.8z" />,
  },
  bing: {
    label: 'Bing', bg: '#008373', fg: '#fff',
    path: <path fill="#fff" d="M5.5 1.5 10 3.1v13.3l5.6-3.2-2.7-1.3-1.7-4.3 8.3 2.9v4.6L10 22.5l-4.5-2.6z" />,
  },
  youtube: {
    label: 'YouTube', bg: '#FF0000', fg: '#fff',
    path: <path fill="#fff" d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6z" />,
  },
  facebook: {
    label: 'Facebook', bg: '#1877F2', fg: '#fff',
    path: <path fill="#fff" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />,
  },
  duckduckgo: {
    label: 'DuckDuckGo', bg: '#DE5833', fg: '#fff',
    path: <path fill="#fff" d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm.8 5.4c2.3 0 4.1 1.5 4.1 3.6 0 1.4-.7 2.3-1.7 3 1.5.6 2.6 1.7 2.6 3.4 0 2.5-2.2 4.2-5.2 4.2-1.5 0-2.8-.4-3.7-1V8.4c0-1.7 1.6-3 3.9-3z" />,
  },
  email: {
    label: 'Email', bg: '#6366F1', fg: '#fff',
    path: <path fill="#fff" d="M2 5h20a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm10 8.2 8.4-5.4H3.6z" />,
  },
};

const ALIASES: Record<string, keyof typeof MARKS> = {
  'google': 'google', 'google.com': 'google', 'www.google.com': 'google', 'googleads': 'google',
  'x.com': 'x', 'twitter.com': 'x', 't.co': 'x', 'x': 'x', 'twitter': 'x',
  'reddit.com': 'reddit', 'reddit': 'reddit', 'old.reddit.com': 'reddit',
  'linkedin.com': 'linkedin', 'lnkd.in': 'linkedin', 'linkedin': 'linkedin',
  'github.com': 'github', 'github': 'github',
  'producthunt.com': 'producthunt', 'producthunt': 'producthunt',
  'news.ycombinator.com': 'hackernews', 'hackernews': 'hackernews',
  'bing.com': 'bing', 'bing': 'bing',
  'youtube.com': 'youtube', 'youtu.be': 'youtube',
  'facebook.com': 'facebook', 'fb.com': 'facebook',
  'duckduckgo.com': 'duckduckgo',
  'newsletter': 'email', 'email': 'email', 'mail': 'email',
};

/** Deterministic colour for unknown domains so each keeps a stable identity. */
function hueOf(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export function SourceMark({ source, size = 16 }: { source?: string | null; size?: number }) {
  const key = (source ?? 'direct').toLowerCase().replace(/^www\./, '');

  if (key === 'direct' || key === 'unknown' || key === '') {
    return (
      <span
        aria-hidden
        className="inline-flex shrink-0 items-center justify-center rounded-[4px] border border-border bg-container-high text-fg-subtle"
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M4 12h16M12 4v16" />
        </svg>
      </span>
    );
  }

  const mark = MARKS[ALIASES[key] ?? ''];
  if (mark) {
    return (
      <span
        aria-hidden
        className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[4px]"
        style={{ width: size, height: size, background: mark.bg }}
      >
        <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 24 24">{mark.path}</svg>
      </span>
    );
  }

  const h = hueOf(key);
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-[4px] font-semibold"
      style={{
        width: size, height: size, fontSize: size * 0.52,
        background: `hsl(${h} 55% 42%)`, color: '#fff',
      }}
    >
      {key.replace(/\.(com|io|org|net|co|dev|ai)$/, '')[0]?.toUpperCase() ?? '?'}
    </span>
  );
}

/* ------------------------------- COUNTRY --------------------------------- */
/* Two-letter code in a tinted chip. Renders identically on every platform —
   unlike flag emoji, which show as tofu boxes on most Linux servers.        */
export function Flag({
  code, size = 16, title,
}: { code?: string | null; size?: number; title?: string }) {
  const cc = (code ?? '').toUpperCase().slice(0, 2) || '??';
  const h = hueOf(cc);
  return (
    <span
      role="img"
      aria-label={title ?? `Country ${cc}`}
      title={title ?? cc}
      className="inline-flex shrink-0 items-center justify-center rounded-[3px] font-semibold tracking-tight text-fg-muted"
      style={{
        width: Math.max(20, size * 1.5), height: Math.max(14, size),
        fontSize: Math.max(9, size * 0.58),
        background: `hsl(${h} 45% 50% / 0.16)`,
        border: `1px solid hsl(${h} 45% 50% / 0.3)`,
      }}
    >
      {cc}
    </span>
  );
}

export const DEVICE_ICON: Record<string, string> = {
  desktop: 'desktop', mobile: 'mobile', tablet: 'tablet',
};
