import { BarList, Card, PageHead, Table, Td, Tr, Meter, Empty } from '@/components/ui';
import { getBreakdown, getKpis } from '@/lib/queries';
import { resolveRange } from '@/lib/range';
import { requireSite } from '@/lib/site';
import { money, num, pct, sourceLabel } from '@/lib/format';
import { SourceMark } from '@/components/brand';
import { ExportButton } from '@/components/export-button';

export const dynamic = 'force-dynamic';

export default async function Sources({
  searchParams,
}: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const { site } = await requireSite();
  const r = resolveRange(range);

  const [sources, mediums, campaigns, referrers, k] = await Promise.all([
    getBreakdown(site.public_id, r.d1, r.d2, 'source', 25),
    getBreakdown(site.public_id, r.d1, r.d2, 'medium', 8),
    getBreakdown(site.public_id, r.d1, r.d2, 'campaign', 10),
    getBreakdown(site.public_id, r.d1, r.d2, 'referrer', 10),
    getKpis(site.public_id, r.d1, r.d2),
  ]);

  const maxRev = Math.max(...sources.map((s) => Number(s.revenue)), 1);
  const totalVisitors = k.current.visitors || 1;

  return (
    <>
      <PageHead
        title="Sources"
        sub={`Which channels send people, and which of those people become customers — ${r.label.toLowerCase()}.`}
        action={<ExportButton what="sources" range={r.key} />}
      />

      <section className="grid gap-5 md:grid-cols-3">
        <Card title="Mediums">
          <BarList secondary="Medium" rows={mediums.map((x) => ({ key: x.label, label: x.label, value: x.visitors }))} />
        </Card>
        <Card title="Campaigns">
          <BarList
            secondary="Campaign"
            rows={campaigns.filter((c) => c.label !== 'unknown').map((x) => ({
              key: x.label, label: x.label, value: x.visitors,
            }))}
          />
        </Card>
        <Card title="Referrers">
          <BarList secondary="Domain" rows={referrers.map((x) => ({ key: x.label, label: (<span className="flex items-center gap-2"><SourceMark source={x.label} /> {sourceLabel(x.label)}</span>), value: x.visitors }))} />
        </Card>
      </section>

      <Card title="All sources" sub="Sorted by sessions — revenue column is what actually matters" pad={false}>
        {sources.length === 0 ? (
          <Empty hint="Add the tracking script to your site to see where visitors come from." />
        ) : (
          <Table head={['Source', 'Visitors', 'Sessions', 'Share', 'Bounce', 'Customers', 'Revenue']}>
            {sources.map((s, i) => (
              <Tr key={s.label} i={i}>
                <Td><span className="flex items-center gap-2.5"><SourceMark source={s.label} /> {sourceLabel(s.label)}</span></Td>
                <Td mono right>{num(s.visitors)}</Td>
                <Td mono right>{num(s.sessions)}</Td>
                <Td right><Meter value={s.visitors} max={totalVisitors} /></Td>
                <Td mono right className={s.bounce_rate > 70 ? 'text-danger' : ''}>{pct(s.bounce_rate)}</Td>
                <Td mono right>{num(s.customers)}</Td>
                <Td mono right className={Number(s.revenue) > 0 ? 'text-primary' : 'text-fg-subtle'}>
                  {money(s.revenue, site.currency)}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Revenue per source" sub="Not all traffic is equal">
        <BarList
          secondary="Source"
          valueLabel="Revenue"
          renderValue={(v) => money(v, site.currency)}
          rows={sources
            .filter((s) => Number(s.revenue) > 0)
            .slice(0, 10)
            .map((s) => ({
              key: s.label,
              label: (<span className="flex items-center gap-2"><SourceMark source={s.label} /> {sourceLabel(s.label)}</span>),
              value: Number(s.revenue),
              extra: (
                <span className="text-[11.5px] text-fg-subtle tnum">
                  {money(s.visitors ? Number(s.revenue) / s.visitors : 0, site.currency)} / visitor
                </span>
              ),
            }))}
        />
        {maxRev <= 1 && <Empty label="No revenue attributed yet" />}
      </Card>
    </>
  );
}
