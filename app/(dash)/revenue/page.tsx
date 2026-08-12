import Link from 'next/link';
import { AreaChart, Legend } from '@/components/chart';
import { Card, Kpi, PageHead, Table, Td, Tr, Meter, Empty, Badge } from '@/components/ui';
import { IMoney, IUsers, ISpark, IClock } from '@/components/icons';
import { getAttribution, getKpis, getSeries } from '@/lib/queries';
import { resolveRange } from '@/lib/range';
import { requireSite } from '@/lib/site';
import { money, num, pct, sourceLabel } from '@/lib/format';
import { SourceMark } from '@/components/brand';
import { ExportButton } from '@/components/export-button';

export const dynamic = 'force-dynamic';

const MODELS = [
  { key: 'last', label: 'Last touch' },
  { key: 'first', label: 'First touch' },
] as const;

export default async function Revenue({
  searchParams,
}: { searchParams: Promise<{ range?: string; model?: string }> }) {
  const { range, model } = await searchParams;
  const { site } = await requireSite();
  const r = resolveRange(range);
  const m = model === 'first' ? 'first' : 'last';

  const [k, series, attribution] = await Promise.all([
    getKpis(site.public_id, r.d1, r.d2),
    getSeries(site.public_id, r.d1, r.d2, r.bucket),
    getAttribution(site.public_id, r.d1, r.d2, m),
  ]);

  const c = k.current, p = k.previous;
  const aov = c.orders ? c.revenue / c.orders : 0;
  const prevAov = p.orders ? p.revenue / p.orders : 0;
  const totalRev = attribution.reduce((s, a) => s + Number(a.revenue), 0);
  const maxRev = Math.max(...attribution.map((a) => Number(a.revenue)), 1);
  const rpv = c.visitors ? c.revenue / c.visitors : 0;
  const prevRpv = p.visitors ? p.revenue / p.visitors : 0;

  return (
    <>
      <PageHead
        title="Where is revenue coming from?"
        sub={`Revenue attributed back to the channel that earned it — ${r.label.toLowerCase()}.`}
        action={
          <div className="flex rounded-md border border-border bg-container p-0.5">
            {MODELS.map((x) => (
              <Link
                key={x.key}
                href={`/revenue?range=${r.key}&model=${x.key}`}
                className={`rounded px-3 py-1.5 text-[12.5px] transition-colors ${
                  m === x.key ? 'bg-primary-strong font-medium text-[color:var(--c-on-primary)]' : 'text-fg-muted hover:text-fg'
                }`}
              >
                {x.label}
              </Link>
            ))}
            <span className="ml-2"><ExportButton what="revenue" range={r.key} model={m} /></span>
          </div>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total revenue" value={money(c.revenue, site.currency)} cur={c.revenue} prev={p.revenue}
             series={series.map((s) => s.revenue)} accent icon={<IMoney width={15} height={15} />} />
        <Kpi label="Paying customers" value={num(c.customers)} cur={c.customers} prev={p.customers}
             icon={<IUsers width={15} height={15} />} />
        <Kpi label="Avg. order value" value={money(aov, site.currency)} cur={aov} prev={prevAov}
             icon={<ISpark width={15} height={15} />} />
        <Kpi label="Revenue / visitor" value={money(rpv, site.currency)} cur={rpv} prev={prevRpv}
             icon={<IClock width={15} height={15} />} />
      </section>

      <Card title="Revenue over time" action={<Legend keys={['revenue', 'visitors']} />}>
        <AreaChart data={series} keys={['revenue', 'visitors']} bucket={r.bucket} currency={site.currency} />
      </Card>

      <Card
        title="Source → revenue flow"
        sub={`${m === 'first' ? 'First-touch' : 'Last-touch'} attribution — who actually brought the money in`}
      >
        {attribution.length === 0 ? (
          <Empty label="No revenue recorded yet" hint="Call oa('revenue', 49.00) after a successful payment." />
        ) : (
          <div className="space-y-3">
            {attribution.slice(0, 8).map((a, i) => {
              const share = totalRev ? (Number(a.revenue) / totalRev) * 100 : 0;
              return (
                <div key={`${a.source}-${a.medium}-${a.campaign}-${i}`} className="rise" style={{ animationDelay: `${i * 45}ms` }}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-4">
                    <span className="flex items-center gap-2 text-[13px]">
                      <SourceMark source={a.source} /> {sourceLabel(a.source)}
                      {a.campaign !== '-' && <Badge>{a.campaign}</Badge>}
                      <span className="text-[11.5px] text-fg-subtle">{a.medium}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="data-mono text-[12px] text-fg-subtle">{num(a.customers)} customers</span>
                      <span className="data-mono text-[13px] text-primary">{money(a.revenue, site.currency)}</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-container-highest">
                    <div
                      className="grow h-full rounded-full"
                      style={{
                        width: `${(Number(a.revenue) / maxRev) * 100}%`,
                        background: 'linear-gradient(90deg, var(--c-primary-strong), var(--c-primary))',
                        animationDelay: `${i * 45}ms`,
                      }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-fg-subtle tnum">{pct(share)} of total revenue</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="Channels" sub="Full attribution table" pad={false}>
        {attribution.length === 0 ? (
          <Empty />
        ) : (
          <Table head={['Source', 'Medium', 'Campaign', 'Customers', 'Orders', 'Revenue', 'Share']}>
            {attribution.map((a, i) => (
              <Tr key={`${a.source}-${a.medium}-${a.campaign}-${i}`} i={i}>
                <Td><span className="flex items-center gap-2.5"><SourceMark source={a.source} /> {sourceLabel(a.source)}</span></Td>
                <Td right className="!text-left text-fg-muted">{a.medium}</Td>
                <Td right className="!text-left text-fg-muted">{a.campaign}</Td>
                <Td mono right>{num(a.customers)}</Td>
                <Td mono right>{num(a.orders)}</Td>
                <Td mono right className="text-primary">{money(a.revenue, site.currency)}</Td>
                <Td right><Meter value={Number(a.revenue)} max={totalRev || 1} /></Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
