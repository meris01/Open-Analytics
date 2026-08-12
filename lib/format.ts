export function num(n: number | string | null | undefined, digits = 0): string {
  const v = Number(n ?? 0);
  if (!isFinite(v)) return '0';
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(2).replace(/\.00$/, '') + 'M';
  if (Math.abs(v) >= 10_000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return v.toLocaleString('en-US', { maximumFractionDigits: digits });
}

export function money(n: number | string | null | undefined, currency = 'USD', compact = false): string {
  const v = Number(n ?? 0);
  if (compact && Math.abs(v) >= 10_000) {
    return (
      new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 })
        .format(v / 1000)
        .replace(/[\d.,]+/, (m) => m) + 'k'
    ).replace(/(\d)k/, '$1k');
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(v) >= 1000 ? 0 : 2,
  }).format(v);
}

export function pct(n: number | string | null | undefined, digits = 1): string {
  return `${Number(n ?? 0).toFixed(digits)}%`;
}

export function duration(seconds: number | string | null | undefined): string {
  const s = Math.max(0, Math.round(Number(seconds ?? 0)));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

export function delta(cur: number, prev: number): { value: number; dir: 'up' | 'down' | 'flat' } {
  if (!prev) return { value: cur > 0 ? 100 : 0, dir: cur > 0 ? 'up' : 'flat' };
  const v = ((cur - prev) / Math.abs(prev)) * 100;
  return { value: Math.abs(v), dir: v > 0.05 ? 'up' : v < -0.05 ? 'down' : 'flat' };
}

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function shortDate(iso: string, bucket = 'day'): string {
  const d = new Date(iso);
  if (bucket === 'hour' || bucket === 'minute') {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const FLAGS: Record<string, string> = {
  US: '🇺🇸', GB: '🇬🇧', DE: '🇩🇪', FR: '🇫🇷', IN: '🇮🇳', CA: '🇨🇦', AU: '🇦🇺',
  JP: '🇯🇵', BR: '🇧🇷', NL: '🇳🇱', ES: '🇪🇸', IT: '🇮🇹', SE: '🇸🇪', SG: '🇸🇬',
  PL: '🇵🇱', MX: '🇲🇽', KR: '🇰🇷', CH: '🇨🇭', IE: '🇮🇪', NO: '🇳🇴',
};
export const flag = (code?: string | null) => (code ? FLAGS[code.toUpperCase()] ?? '🌐' : '🌐');

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', DE: 'Germany', FR: 'France', IN: 'India',
  CA: 'Canada', AU: 'Australia', JP: 'Japan', BR: 'Brazil', NL: 'Netherlands',
  ES: 'Spain', IT: 'Italy', SE: 'Sweden', SG: 'Singapore', PL: 'Poland',
  MX: 'Mexico', KR: 'South Korea', CH: 'Switzerland', IE: 'Ireland', NO: 'Norway',
};
export const countryName = (c?: string | null) =>
  c ? COUNTRY_NAMES[c.toUpperCase()] ?? c : 'Unknown';

export function sourceLabel(s?: string | null): string {
  if (!s || s === 'direct') return 'Direct';
  const map: Record<string, string> = {
    google: 'Google', 'google.com': 'Google', 'x.com': 'X / Twitter', 'twitter.com': 'X / Twitter',
    'reddit.com': 'Reddit', 'news.ycombinator.com': 'Hacker News', 'linkedin.com': 'LinkedIn',
    'github.com': 'GitHub', 'producthunt.com': 'Product Hunt', 'youtube.com': 'YouTube',
    'facebook.com': 'Facebook', 'bing.com': 'Bing', 'duckduckgo.com': 'DuckDuckGo',
    newsletter: 'Newsletter', email: 'Email',
  };
  return map[s.toLowerCase()] ?? s.replace(/^www\./, '');
}
