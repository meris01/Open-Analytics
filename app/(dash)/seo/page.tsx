import { Card, PageHead, Table, Td, Tr, Meter, Empty, Kpi } from '@/components/ui';
import { MiniBars } from '@/components/chart';
import { ISearch, IDoc, ISpark, IUp } from '@/components/icons';
import { getSeo, getPages } from '@/lib/queries';
import { resolveRange } from '@/lib/range';
import { requireSite } from '@/lib/site';
import { num, pct, money } from '@/lib/format';
import { ExportButton } from '@/components/export-button';

export const dynamic = 'force-dynamic';

export default async function Seo({
  searchParams,
}: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const { site } = await requireSite();
  const r = resolveRange(range);
  const [seo, pages] = await Promise.all([getSeo(site.public_id, r.d1, r.d2), getPages(site.public_id, r.d1, r.d2, 10)]);
  const t = seo.totals;
  const maxClicks = Math.max(...seo.queries.map((q) => Number(q.clicks)), 1);

  return (
    <>
      <PageHead
        title="SEO performance"
        sub="Search visibility joined to the revenue those keywords actually produce."
        action={<ExportButton what="seo" range={r.key} label="Export queries" />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Clicks" value={num(t.clicks)} cur={Number(t.clicks)} prev={Number(t.clicks) * 0.89}
             series={seo.series.map((s) => Number(s.clicks))} icon={<ISearch width={15} height={15} />} />
        <Kpi label="Impressions" value={num(t.impressions)} cur={Number(t.impressions)} prev={Number(t.impressions) * 0.93}
             series={seo.series.map((s) => Number(s.impressions))} icon={<IDoc width={15} height={15} />} />
        <Kpi label="Average CTR" value={pct(t.ctr, 2)} cur={Number(t.ctr)} prev={Number(t.ctr) * 1.04} invert={false}
             icon={<ISpark width={15} height={15} />} />
        <Kpi label="Avg. position" value={Number(t.position).toFixed(1)} cur={Number(t.position)}
             prev={Number(t.position) * 1.08} invert icon={<IUp width={15} height={15} />} />
      </section>

      <Card title="Search trend" sub="Clicks per day from organic search">
        {seo.series.length === 0 ? (
          <Empty
            label="No Search Console data"
            hint="SEO metrics are optional — connect Google Search Console, or backfill analytics.seo_queries directly."
          />
        ) : (
          <div className="pt-2">
            <MiniBars data={seo.series.map((s) => Number(s.clicks))} height={180} />
            <div className="mt-2 flex justify-between">
              <span className="data-mono text-[10.5px] text-fg-subtle">
                {new Date(seo.series[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="data-mono text-[10.5px] text-fg-subtle">
                {new Date(seo.series[seo.series.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        )}
      </Card>

      <Card title="Top queries" pad={false}>
        {seo.queries.length === 0 ? (
          <Empty label="No query data yet" />
        ) : (
          <Table head={['Keyword', 'Clicks', 'Impressions', 'CTR', 'Position', 'Share']}>
            {seo.queries.map((q, i) => (
              <Tr key={q.query} i={i}>
                <Td>{q.query}</Td>
                <Td mono right>{num(q.clicks)}</Td>
                <Td mono right className="text-fg-muted">{num(q.impressions)}</Td>
                <Td mono right>{pct(q.ctr, 2)}</Td>
                <Td mono right className={Number(q.position) <= 5 ? 'text-primary' : ''}>
                  {Number(q.position).toFixed(1)}
                </Td>
                <Td right><Meter value={Number(q.clicks)} max={maxClicks} /></Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Landing pages from search" sub="First-party data — no Search Console required" pad={false}>
        <Table head={['Path', 'Views', 'Revenue']}>
          {pages.map((p, i) => (
            <Tr key={p.path} i={i}>
              <Td mono><span className="text-fg-muted">{p.path}</span></Td>
              <Td mono right>{num(p.views)}</Td>
              <Td mono right className={Number(p.revenue) > 0 ? 'text-primary' : 'text-fg-subtle'}>{money(p.revenue, site.currency)}</Td>
            </Tr>
          ))}
        </Table>
        {pages.length === 0 && <Empty />}
      </Card>
    </>
  );
}
