import { AnalystView } from '@/components/analyst-view';
import { buildInsights } from '@/lib/analyst';
import { getAttribution, getBreakdown, getKpis, getPages, getSeries } from '@/lib/queries';
import { resolveRange } from '@/lib/range';
import { requireSite } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function AiAnalyst({
  searchParams,
}: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const { site } = await requireSite();
  const r = resolveRange(range);

  const [k, series, sources, pages, attribution] = await Promise.all([
    getKpis(site.public_id, r.d1, r.d2),
    getSeries(site.public_id, r.d1, r.d2, r.bucket),
    getBreakdown(site.public_id, r.d1, r.d2, 'source', 12),
    getPages(site.public_id, r.d1, r.d2, 12),
    getAttribution(site.public_id, r.d1, r.d2, 'last'),
  ]);

  const insights = buildInsights(k, series, sources, pages, attribution);
  return <AnalystView insights={insights} range={r.key} rangeLabel={r.label} />;
}
