import { rpc } from './supabase';
import type { Point } from '@/components/chart';

export type Kpis = {
  visitors: number; sessions: number; pageviews: number; revenue: number;
  orders: number; conversions: number; customers: number;
  bounce_rate: number; avg_duration: number; pages_per_session: number;
};
export type KpiResult = { current: Kpis; previous: Kpis };

const ZERO: Kpis = {
  visitors: 0, sessions: 0, pageviews: 0, revenue: 0, orders: 0,
  conversions: 0, customers: 0, bounce_rate: 0, avg_duration: 0, pages_per_session: 0,
};

/** Queries degrade to empty rather than crashing the page: a site with no
 *  traffic yet still renders the whole UI, just with zeroes. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error('[oa] query failed:', (e as Error).message);
    return fallback;
  }
}

export const getKpis = (site: string, d1: string, d2: string) =>
  safe<KpiResult>(() => rpc<KpiResult>('oa_kpis', { p_site: site, d1, d2 }), {
    current: ZERO, previous: ZERO,
  });

export const getSeries = (site: string, d1: string, d2: string, bucket: string) =>
  safe<Point[]>(() => rpc<Point[]>('oa_timeseries', { p_site: site, d1, d2, p_bucket: bucket }), []);

export type BreakdownRow = {
  label: string; visitors: number; sessions: number;
  customers: number; revenue: number; bounce_rate: number;
};
export const getBreakdown = (site: string, d1: string, d2: string, dim: string, limit = 20) =>
  safe<BreakdownRow[]>(
    () => rpc<BreakdownRow[]>('oa_breakdown', { p_site: site, d1, d2, p_dim: dim, p_limit: limit }), []);

export type PageRow = {
  path: string; views: number; uniques: number;
  avg_time: number; revenue: number; bounce_rate: number;
};
export const getPages = (site: string, d1: string, d2: string, limit = 25) =>
  safe<PageRow[]>(() => rpc<PageRow[]>('oa_pages', { p_site: site, d1, d2, p_limit: limit }), []);

export type Realtime = {
  active: number; desktop: number; mobile: number; pageviews_30m: number;
  top_pages: { path: string; views: number }[];
  countries: { country: string; visitors: number }[];
  stream: {
    id: number; type: string; name: string | null; path: string; revenue: number;
    created_at: string; country: string | null; city: string | null;
    source: string | null; device: string | null; os: string | null; browser: string | null;
  }[];
  series: { t: string; views: number }[];
};
export const getRealtime = (site: string) =>
  safe<Realtime>(() => rpc<Realtime>('oa_realtime', { p_site: site, p_window: 5 }), {
    active: 0, desktop: 0, mobile: 0, pageviews_30m: 0,
    top_pages: [], countries: [], stream: [], series: [],
  });

export type Customer = {
  id: string; email: string | null; name: string | null; external_id: string | null;
  first_source: string | null; first_medium: string | null; first_campaign: string | null;
  first_landing: string | null; country: string | null; device: string | null;
  total_revenue: number; first_seen_at: string; last_seen_at: string;
  pageviews: number; sessions: number;
};
export const getCustomers = (site: string, limit = 25, offset = 0, search?: string) =>
  safe<{ total: number; rows: Customer[] }>(
    () => rpc('oa_customers', { p_site: site, p_limit: limit, p_offset: offset, p_search: search ?? null }),
    { total: 0, rows: [] });

export type JourneyEvent = {
  id: number; type: string; name: string | null; path: string; title: string | null;
  revenue: number; created_at: string; props: Record<string, unknown>;
  source: string | null; medium: string | null; campaign: string | null;
  referrer_host: string | null; device: string | null; country: string | null;
};
export const getJourney = (visitorId: string) =>
  safe<{ visitor: Customer | null; events: JourneyEvent[] }>(
    () => rpc('oa_journey', { p_visitor: visitorId }), { visitor: null, events: [] });

export type Goal = {
  id: string; name: string; match_type: string; match_value: string; value: number;
  completions: number; unique_completions: number; revenue: number;
};
export const getGoals = (site: string, d1: string, d2: string) =>
  safe<{ total_sessions: number; goals: Goal[] }>(
    () => rpc('oa_goals', { p_site: site, d1, d2 }), { total_sessions: 0, goals: [] });

export type FunnelStep = {
  name: string; type: string; value: string;
  users: number; pct_of_start: number; pct_of_prev: number;
};
export const getFunnel = (site: string, funnelId: string, d1: string, d2: string) =>
  safe<{ id: string; name: string; steps: FunnelStep[] }>(
    () => rpc('oa_funnel', { p_site: site, p_funnel: funnelId, d1, d2 }),
    { id: '', name: '', steps: [] });

export const listFunnels = (site: string) =>
  safe<{ id: string; name: string; steps: unknown[] }[]>(async () => {
    const { sb } = await import('./supabase');
    const client = await sb();
    const { data: siteRow } = await client.schema('analytics').from('sites')
      .select('id').eq('public_id', site).maybeSingle();
    if (!siteRow) return [];
    const { data, error } = await client.schema('analytics').from('funnels')
      .select('id,name,steps').eq('site_id', siteRow.id).order('created_at');
    if (error) throw error;
    return (data ?? []).map((f) => ({
      ...f,
      steps: Array.isArray(f.steps) ? f.steps : [],
    })) as { id: string; name: string; steps: unknown[] }[];
  }, []);

export type Attribution = {
  source: string; medium: string; campaign: string;
  customers: number; orders: number; revenue: number;
};
export const getAttribution = (site: string, d1: string, d2: string, model: 'first' | 'last' = 'last') =>
  safe<Attribution[]>(
    () => rpc<Attribution[]>('oa_attribution', { p_site: site, d1, d2, p_model: model }), []);

export type Seo = {
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  series: { date: string; clicks: number; impressions: number }[];
  queries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[];
};
export const getSeo = (site: string, d1: string, d2: string) =>
  safe<Seo>(() => rpc<Seo>('oa_seo', { p_site: site, d1, d2 }), {
    totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 }, series: [], queries: [],
  });

export type InstallStatus = {
  connected: boolean; events: number;
  first_event_at: string | null; last_event_at: string | null;
  domain: string; public_id: string;
  recent: { path: string; type: string; name: string | null; created_at: string;
            country: string | null; device: string | null; referrer_host: string | null }[];
};
export const getInstallStatus = (site: string) =>
  safe<InstallStatus>(() => rpc('oa_install_status', { p_site: site }), {
    connected: false, events: 0, first_event_at: null, last_event_at: null,
    domain: '', public_id: site, recent: [],
  });
