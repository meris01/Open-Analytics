import { Card, PageHead, Table, Td, Tr, Meter, Empty, Kpi } from '@/components/ui';
import { IDoc, IClock, ISpark } from '@/components/icons';
import { getBreakdown, getKpis, getPages } from '@/lib/queries';
import { resolveRange } from '@/lib/range';
import { requireSite } from '@/lib/site';
import { duration, money, num, pct } from '@/lib/format';
import { ExportButton } from '@/components/export-button';

export const dynamic = 'force-dynamic';

export default async function Pages({
  searchParams,
}: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const { site } = await requireSite();
  const r = resolveRange(range);

  const [pages, k, entries, exits] = await Promise.all([
    getPages(site.public_id, r.d1, r.d2, 40),
    getKpis(site.public_id, r.d1, r.d2),
    getBreakdown(site.public_id, r.d1, r.d2, 'entry', 10),
    getBreakdown(site.public_id, r.d1, r.d2, 'exit', 10),
  ]);

  const c = k.current, p = k.previous;
  const maxViews = Math.max(...pages.map((x) => x.views), 1);

  return (
    <>
      <PageHead
        title="Content performance"
        sub={`Traffic volume, engagement quality and revenue per page — ${r.label.toLowerCase()}.`}
        action={<ExportButton what="pages" range={r.key} />}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Total pageviews" value={num(c.pageviews)} cur={c.pageviews} prev={p.pageviews} icon={<IDoc width={15} height={15} />} />
        <Kpi label="Avg. time on page" value={duration(c.avg_duration)} cur={c.avg_duration} prev={p.avg_duration} icon={<IClock width={15} height={15} />} />
        <Kpi label="Bounce rate" value={pct(c.bounce_rate)} cur={c.bounce_rate} prev={p.bounce_rate} invert icon={<ISpark width={15} height={15} />} />
      </section>

      <Card title="Top pages by volume" pad={false}>
        {pages.length === 0 ? (
          <Empty />
        ) : (
          <Table head={['Path', 'Views', 'Unique', 'Share', 'Avg time', 'Bounce', 'Revenue']}>
            {pages.map((pg, i) => (
              <Tr key={pg.path} i={i}>
                <Td mono><span className="text-fg-muted">{pg.path}</span></Td>
                <Td mono right>{num(pg.views)}</Td>
                <Td mono right className="text-fg-muted">{num(pg.uniques)}</Td>
                <Td right><Meter value={pg.views} max={maxViews} /></Td>
                <Td mono right>{duration(pg.avg_time)}</Td>
                <Td mono right className={pg.bounce_rate > 65 ? 'text-danger' : ''}>{pct(pg.bounce_rate)}</Td>
                <Td mono right className={Number(pg.revenue) > 0 ? 'text-[color:var(--c-accent)]' : 'text-fg-subtle'}>
                  {money(pg.revenue, site.currency)}
                </Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card title="Entry pages" sub="Where sessions begin" pad={false}>
          <Table head={['Path', 'Sessions', 'Bounce']}>
            {entries.map((e, i) => (
              <Tr key={e.label} i={i}>
                <Td mono><span className="text-fg-muted">{e.label}</span></Td>
                <Td mono right>{num(e.sessions)}</Td>
                <Td mono right className={e.bounce_rate > 65 ? 'text-danger' : ''}>{pct(e.bounce_rate)}</Td>
              </Tr>
            ))}
          </Table>
          {entries.length === 0 && <Empty />}
        </Card>
        <Card title="Exit pages" sub="Where sessions end — fix these first" pad={false}>
          <Table head={['Path', 'Sessions', 'Revenue']}>
            {exits.map((e, i) => (
              <Tr key={e.label} i={i}>
                <Td mono><span className="text-fg-muted">{e.label}</span></Td>
                <Td mono right>{num(e.sessions)}</Td>
                <Td mono right>{money(e.revenue, site.currency)}</Td>
              </Tr>
            ))}
          </Table>
          {exits.length === 0 && <Empty />}
        </Card>
      </section>
    </>
  );
}
