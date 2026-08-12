import Link from 'next/link';
import { AreaChart, Legend } from '@/components/chart';
import { Card, Kpi, PageHead, Table, Td, Tr, Meter, Empty } from '@/components/ui';
import { IUsers, IClock, IMoney, ISpark, IChevronR } from '@/components/icons';
import { getBreakdown, getKpis, getPages, getSeries } from '@/lib/queries';
import { resolveRange } from '@/lib/range';
import { requireSite } from '@/lib/site';
import { money, num, pct, sourceLabel, duration } from '@/lib/format';
import { SourceMark } from '@/components/brand';
import { ExportButton } from '@/components/export-button';

export const dynamic = 'force-dynamic';

export default async function Overview({
  searchParams,
}: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const { site } = await requireSite();
  const r = resolveRange(range);

  const [k, series, sources, pages] = await Promise.all([
    getKpis(site.public_id, r.d1, r.d2),
    getSeries(site.public_id, r.d1, r.d2, r.bucket),
    getBreakdown(site.public_id, r.d1, r.d2, 'source', 6),
    getPages(site.public_id, r.d1, r.d2, 6),
  ]);

  const c = k.current, p = k.previous;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const spark = (key: 'visitors' | 'sessions' | 'revenue' | 'pageviews') =>
    series.map((s) => Number(s[key]) || 0);
  const maxSourceVisitors = Math.max(...sources.map((s) => s.visitors), 1);

  return (
    <>
      <PageHead
        title={`${greet}.`}
        sub={`Here's what happened with ${site.domain} — ${r.label.toLowerCase()}.`}
        action={<ExportButton what="sources" range={r.key} label="Export" />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Visitors" value={num(c.visitors)} cur={c.visitors} prev={p.visitors}
             series={spark('visitors')} icon={<IUsers width={15} height={15} />} />
        <Kpi label="Sessions" value={num(c.sessions)} cur={c.sessions} prev={p.sessions}
             series={spark('sessions')} icon={<IClock width={15} height={15} />} />
        <Kpi label="Revenue" value={money(c.revenue, site.currency)} cur={c.revenue} prev={p.revenue}
             series={spark('revenue')} accent icon={<IMoney width={15} height={15} />} />
        <Kpi
          label="Conversion" value={pct(c.sessions ? (c.conversions / c.sessions) * 100 : 0)}
          cur={c.sessions ? (c.conversions / c.sessions) * 100 : 0}
          prev={p.sessions ? (p.conversions / p.sessions) * 100 : 0}
          series={spark('pageviews')} icon={<ISpark width={15} height={15} />}
        />
      </section>

      <Card
        title="Traffic vs Revenue"
        sub="Where attention turns into money"
        action={<Legend keys={['visitors', 'revenue']} />}
      >
        <AreaChart data={series} keys={['visitors', 'revenue']} bucket={r.bucket} />
      </Card>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Traffic sources" pad={false}
          action={
            <Link href={`/sources?range=${r.key}`} className="btn btn-ghost">
              All sources <IChevronR width={13} height={13} />
            </Link>
          }
        >
          {sources.length === 0 ? (
            <Empty hint="Install the tracking script to start collecting data." />
          ) : (
            <Table head={['Source', 'Visitors', 'Customers', 'Revenue']}>
              {sources.map((s, i) => (
                <Tr key={s.label} i={i}>
                  <Td>
                    <div className="relative">
                      <span className="flex items-center gap-2.5"><SourceMark source={s.label} /> {sourceLabel(s.label)}</span>
                      <span className="absolute -bottom-2 left-0 block h-[2px] rounded-full bg-primary/70"
                            style={{ width: `${(s.visitors / maxSourceVisitors) * 100}%` }} />
                    </div>
                  </Td>
                  <Td mono right>{num(s.visitors)}</Td>
                  <Td mono right>{num(s.customers)}</Td>
                  <Td mono right className="text-primary">{money(s.revenue, site.currency)}</Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>

        <Card
          title="Top pages" pad={false}
          action={
            <Link href={`/pages?range=${r.key}`} className="btn btn-ghost">
              All pages <IChevronR width={13} height={13} />
            </Link>
          }
        >
          {pages.length === 0 ? (
            <Empty />
          ) : (
            <Table head={['Path', 'Views', 'Avg time', 'Bounce']}>
              {pages.map((pg, i) => (
                <Tr key={pg.path} i={i}>
                  <Td mono><span className="text-fg-muted">{pg.path}</span></Td>
                  <Td mono right>{num(pg.views)}</Td>
                  <Td mono right>{duration(pg.avg_time)}</Td>
                  <Td right><Meter value={pg.bounce_rate} max={100} tone={pg.bounce_rate > 65 ? 'danger' : 'primary'} /></Td>
                </Tr>
              ))}
            </Table>
          )}
        </Card>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { l: 'Pageviews', v: num(c.pageviews) },
          { l: 'Bounce rate', v: pct(c.bounce_rate) },
          { l: 'Avg. session', v: duration(c.avg_duration) },
          { l: 'Pages / session', v: Number(c.pages_per_session).toFixed(2) },
        ].map((m) => (
          <div key={m.l} className="card card-hover flex items-center justify-between p-4">
            <span className="label-caps text-fg-subtle">{m.l}</span>
            <span className="data-mono text-[15px]">{m.v}</span>
          </div>
        ))}
      </section>
    </>
  );
}
