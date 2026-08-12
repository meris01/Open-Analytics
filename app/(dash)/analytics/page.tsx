import { AreaChart, Legend } from '@/components/chart';
import { BarList, Card, Kpi, PageHead } from '@/components/ui';
import { IUsers, IClock, IDoc, ISpark } from '@/components/icons';
import { getBreakdown, getKpis, getSeries } from '@/lib/queries';
import { resolveRange } from '@/lib/range';
import { requireSite } from '@/lib/site';
import { countryName, duration, num, pct, sourceLabel } from '@/lib/format';
import { Flag, SourceMark } from '@/components/brand';
import { ExportButton } from '@/components/export-button';

export const dynamic = 'force-dynamic';

export default async function Analytics({
  searchParams,
}: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const { site } = await requireSite();
  const r = resolveRange(range);

  const [k, series, countries, devices, browsers, os, langs, entries] = await Promise.all([
    getKpis(site.public_id, r.d1, r.d2),
    getSeries(site.public_id, r.d1, r.d2, r.bucket),
    getBreakdown(site.public_id, r.d1, r.d2, 'country', 8),
    getBreakdown(site.public_id, r.d1, r.d2, 'device', 4),
    getBreakdown(site.public_id, r.d1, r.d2, 'browser', 6),
    getBreakdown(site.public_id, r.d1, r.d2, 'os', 6),
    getBreakdown(site.public_id, r.d1, r.d2, 'language', 6),
    getBreakdown(site.public_id, r.d1, r.d2, 'entry', 8),
  ]);

  const c = k.current, p = k.previous;

  return (
    <>
      <PageHead title="Analytics" sub={`Audience, engagement and behaviour — ${r.label.toLowerCase()}.`}
        action={<ExportButton what="countries" range={r.key} label="Export countries" />} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Visitors" value={num(c.visitors)} cur={c.visitors} prev={p.visitors}
             series={series.map((s) => s.visitors)} icon={<IUsers width={15} height={15} />} />
        <Kpi label="Pageviews" value={num(c.pageviews)} cur={c.pageviews} prev={p.pageviews}
             series={series.map((s) => s.pageviews)} icon={<IDoc width={15} height={15} />} />
        <Kpi label="Bounce rate" value={pct(c.bounce_rate)} cur={c.bounce_rate} prev={p.bounce_rate}
             invert icon={<ISpark width={15} height={15} />} />
        <Kpi label="Avg. session" value={duration(c.avg_duration)} cur={c.avg_duration} prev={p.avg_duration}
             icon={<IClock width={15} height={15} />} />
      </section>

      <Card title="Audience over time" action={<Legend keys={['visitors', 'pageviews']} />}>
        <AreaChart data={series} keys={['visitors', 'pageviews']} bucket={r.bucket} />
      </Card>

      <section className="grid gap-5 lg:grid-cols-2">
        <Card title="Countries">
          <BarList
            secondary="Country"
            rows={countries.map((x) => ({
              key: x.label,
              label: (<span className="flex items-center gap-2"><Flag code={x.label} /> {countryName(x.label)}</span>),
              value: x.visitors,
            }))}
          />
        </Card>
        <Card title="Entry pages">
          <BarList
            secondary="Landing page"
            rows={entries.map((x) => ({
              key: x.label,
              label: <span className="data-mono text-fg-muted">{x.label}</span>,
              value: x.sessions,
            }))}
            valueLabel="Sessions"
          />
        </Card>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Devices">
          <BarList secondary="Device" rows={devices.map((x) => ({ key: x.label, label: <span className="capitalize">{x.label}</span>, value: x.visitors }))} />
        </Card>
        <Card title="Browsers">
          <BarList secondary="Browser" rows={browsers.map((x) => ({ key: x.label, label: x.label, value: x.visitors }))} />
        </Card>
        <Card title="Operating systems">
          <BarList secondary="OS" rows={os.map((x) => ({ key: x.label, label: x.label, value: x.visitors }))} />
        </Card>
        <Card title="Languages">
          <BarList secondary="Language" rows={langs.map((x) => ({ key: x.label, label: x.label, value: x.visitors }))} />
        </Card>
      </section>

      <Card title="Traffic quality by source" sub="Bounce rate tells you which channels send people who actually care" pad={false}>
        <div className="p-5">
          <BarList
            secondary="Source"
            valueLabel="Bounce rate"
            renderValue={(v) => pct(v)}
            rows={(await getBreakdown(site.public_id, r.d1, r.d2, 'source', 8)).map((x) => ({
              key: x.label,
              label: (<span className="flex items-center gap-2"><SourceMark source={x.label} /> {sourceLabel(x.label)}</span>),
              value: x.bounce_rate,
              extra: <span className="text-[11.5px] text-fg-subtle">{num(x.sessions)} sessions</span>,
            }))}
          />
        </div>
      </Card>
    </>
  );
}
