import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { anon } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
};

const MAX_BODY = 8 * 1024;          // a legitimate payload is well under 1 KB
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 240;                // events per IP per minute — generous for real users
const DEDUPE_MS = 900;               // collapse identical double-fires

const BOT_RE =
  /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python-requests|axios|go-http|java\/|okhttp|postman|semrush|ahrefs|screaming|gtmetrix|pagespeed|chrome-lighthouse|dataprovider|scrapy/i;

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();
const seen = new Map<string, number>();

function sweep(now: number) {
  if (buckets.size > 8000) {
    for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k);
  }
  if (seen.size > 8000) {
    for (const [k, t] of seen) if (now - t > DEDUPE_MS) seen.delete(k);
  }
}

function rateLimited(key: string, now: number): boolean {
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  b.count += 1;
  return b.count > RATE_MAX;
}

/** Rotating daily salt: hashes are un-reversible and cannot be linked across
 *  days, so no persistent identifier ever exists for a visitor. */
const SALT_BASE = process.env.OA_SALT ?? 'openanalytics-default-salt-change-me';
const visitorHash = (site: string, ip: string, ua: string) =>
  createHash('sha256')
    .update(`${SALT_BASE}:${new Date().toISOString().slice(0, 10)}|${site}|${ip}|${ua}`)
    .digest('base64url')
    .slice(0, 24);

function clientIp(req: NextRequest): string {
  const h = req.headers;
  const fwd = h.get('x-forwarded-for');
  return (
    h.get('cf-connecting-ip') ||
    h.get('x-real-ip') ||
    (fwd ? fwd.split(',')[0].trim() : '') ||
    '0.0.0.0'
  );
}

const str = (v: unknown, max: number) =>
  typeof v === 'string' && v.length ? v.slice(0, max) : null;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const now = Date.now();
  sweep(now);

  const ua = req.headers.get('user-agent') ?? '';
  if (!ua || BOT_RE.test(ua)) return new NextResponse(null, { status: 204, headers: CORS });

  const len = Number(req.headers.get('content-length') ?? 0);
  if (len > MAX_BODY) {
    return NextResponse.json({ ok: false, error: 'payload_too_large' }, { status: 413, headers: CORS });
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY) {
    return NextResponse.json({ ok: false, error: 'payload_too_large' }, { status: 413, headers: CORS });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400, headers: CORS });
  }

  const site = str(body.site, 64);
  if (!site) return NextResponse.json({ ok: false, error: 'no_site' }, { status: 400, headers: CORS });

  const ip = clientIp(req);
  if (rateLimited(`${site}:${ip}`, now)) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429, headers: CORS });
  }

  const type = str(body.type, 32) ?? 'pageview';
  const path = str(body.path, 512) ?? '/';

  // collapse identical events fired twice in quick succession (StrictMode, double-mount)
  const dedupeKey = `${site}|${ip}|${type}|${path}|${str(body.name, 120) ?? ''}`;
  const last = seen.get(dedupeKey);
  if (last && now - last < DEDUPE_MS && type !== 'conversion') {
    return new NextResponse(null, { status: 204, headers: CORS });
  }
  seen.set(dedupeKey, now);

  const referrer = str(body.referrer, 512) ?? '';
  let referrerHost = str(body.referrer_host, 255) ?? '';
  if (!referrerHost && referrer) {
    try { referrerHost = new URL(referrer).hostname.replace(/^www\./, ''); } catch { /* ignore */ }
  }

  const h = req.headers;
  const payload = {
    site,
    visitor_hash: visitorHash(site, ip, ua),
    type,
    name: str(body.name, 120),
    path,
    title: str(body.title, 240),
    referrer,
    referrer_host: referrerHost || null,
    origin: h.get('origin') ?? null,
    source: str(body.source, 120),
    medium: str(body.medium, 120),
    campaign: str(body.campaign, 120),
    term: str(body.term, 120),
    content: str(body.content, 120),
    device: str(body.device, 24),
    os: str(body.os, 32),
    browser: str(body.browser, 32),
    screen_w: Number(body.screen_w ?? 0) || null,
    language: str(body.language, 12),
    duration_s: Math.min(3600, Math.max(0, Math.round(Number(body.duration_s ?? 0)) || 0)),
    revenue: Math.min(1_000_000, Math.max(0, Number(body.revenue ?? 0) || 0)),
    currency: str(body.currency, 8),
    ...(body.external_id ? { external_id: str(body.external_id, 120) } : {}),
    ...(body.email ? { email: str(body.email, 200) } : {}),
    ...(body.name_hint ? { name_hint: str(body.name_hint, 120) } : {}),
    props:
      typeof body.props === 'object' && body.props && JSON.stringify(body.props).length < 4096
        ? body.props
        : {},
    country: h.get('x-vercel-ip-country') ?? h.get('cf-ipcountry') ?? null,
    region: h.get('x-vercel-ip-country-region') ?? null,
    city: h.get('x-vercel-ip-city') ? decodeURIComponent(h.get('x-vercel-ip-city')!) : null,
  };

  if (payload.type === 'engagement' && payload.duration_s < 2) {
    return new NextResponse(null, { status: 204, headers: CORS });
  }

  try {
    const { error } = await anon().rpc('oa_ingest', { p: payload });
    if (error) throw error;
    // 204: nothing for the browser to parse — keeps the beacon as cheap as possible
    return new NextResponse(null, { status: 204, headers: CORS });
  } catch (e) {
    console.error('[oa] ingest failed', e);
    return NextResponse.json({ ok: false, error: 'ingest_failed' }, { status: 500, headers: CORS });
  }
}
