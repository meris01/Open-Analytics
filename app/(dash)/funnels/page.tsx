import Link from 'next/link';
import { Card, PageHead, Empty, Badge } from '@/components/ui';
import { IFilter, IWarn, IClock } from '@/components/icons';
import { getBreakdown, getFunnel, listFunnels } from '@/lib/queries';
import { resolveRange } from '@/lib/range';
import { requireSite } from '@/lib/site';
import { num, pct, sourceLabel } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Funnels({
  searchParams,
}: { searchParams: Promise<{ range?: string; f?: string }> }) {
  const { range, f } = await searchParams;
  const { site } = await requireSite();
  const r = resolveRange(range);

  const funnels = await listFunnels(site.public_id);
  const active = f ?? funnels[0]?.id;
  const funnel = active ? await getFunnel(site.public_id, active, r.d1, r.d2) : { id: '', name: '', steps: [] };
  const sources = await getBreakdown(site.public_id, r.d1, r.d2, 'source', 6);

  const overall = funnel.steps.length
    ? funnel.steps[funnel.steps.length - 1].pct_of_start
    : 0;
  const worst = funnel.steps.reduce<{ i: number; drop: number }>(
    (acc, s, i) => (i > 0 && 100 - s.pct_of_prev > acc.drop ? { i, drop: 100 - s.pct_of_prev } : acc),
    { i: -1, drop: 0 },
  );

  return (
    <>
      <PageHead
        title="Conversion funnels"
        sub={`Step-by-step progression and exactly where people leave — ${r.label.toLowerCase()}.`}
        action={
          funnels.length > 1 ? (
            <div className="flex rounded-md border border-border bg-container p-0.5">
              {funnels.map((x) => (
                <Link key={x.id} href={`/funnels?range=${r.key}&f=${x.id}`}
                      className={`rounded px-3 py-1.5 text-[12.5px] transition-colors ${
                        x.id === active ? 'bg-container-highest font-medium text-fg' : 'text-fg-muted hover:text-fg'
                      }`}>
                  {x.name}
                </Link>
              ))}
            </div>
          ) : undefined
        }
      />

      {funnel.steps.length === 0 ? (
        <Card title="No funnel configured">
          <Empty
            label="Define a funnel to see drop-off"
            hint="Insert a row into analytics.funnels with steps like [{name,type,value}]. A default 'Main Purchase Flow' ships with the schema."
          />
        </Card>
      ) : (
        <>
          <Card
            title={funnel.name}
            action={
              <span className="flex items-baseline gap-2">
                <span className="label-caps text-fg-subtle">Overall</span>
                <span className="data-mono text-[20px] text-primary">{pct(overall)}</span>
              </span>
            }
          >
            <div className="space-y-7">
              {funnel.steps.map((s, i) => {
                const critical = i === worst.i;
                const drop = i > 0 ? 100 - s.pct_of_prev : 0;
                const prevUsers = i > 0 ? funnel.steps[i - 1].users : s.users;
                return (
                  <div key={`${s.name}-${i}`} className="rise" style={{ animationDelay: `${i * 70}ms` }}>
                    <div className="mb-2 flex items-baseline justify-between gap-4">
                      <span className="flex items-center gap-2 text-[13px]">
                        <span className="data-mono text-fg-subtle">{i + 1}</span>
                        <IFilter width={13} height={13} className="text-fg-subtle" />
                        {s.name}
                        <Badge>{s.type}</Badge>
                      </span>
                      <span className="data-mono text-[12.5px]">
                        {num(s.users)} users <span className="text-fg-subtle">({pct(s.pct_of_start)})</span>
                      </span>
                    </div>
                    <div className="h-11 overflow-hidden rounded-md bg-container-highest">
                      <div
                        className="grow flex h-full items-center rounded-md"
                        style={{
                          width: `${Math.max(0.8, s.pct_of_start)}%`,
                          background:
                            i === funnel.steps.length - 1
                              ? 'var(--c-primary-strong)'
                              : `color-mix(in srgb, var(--c-primary) ${90 - i * 18}%, var(--c-container-highest))`,
                          animationDelay: `${i * 70}ms`,
                        }}
                      />
                    </div>
                    {i > 0 && (
                      <div className="mt-2 flex items-center gap-2 pl-1">
                        <span className={`data-mono text-[11.5px] ${critical ? 'text-danger' : 'text-fg-subtle'}`}>
                          ↓ {pct(drop)} drop-off ({num(prevUsers - s.users)} users)
                        </span>
                        {critical && drop > 0 && (
                          <span className="inline-flex items-center gap-1 rounded bg-danger-soft px-1.5 py-0.5 text-[11px] font-medium text-danger">
                            <IWarn width={11} height={11} /> Biggest leak
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <section className="grid gap-5 lg:grid-cols-2">
            <Card title="Bounce by source" sub="Which channels arrive with the least intent">
              <div className="space-y-3">
                {sources.map((s, i) => (
                  <div key={s.label} className="rise" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="mb-1 flex justify-between text-[12.5px]">
                      <span>{sourceLabel(s.label)}</span>
                      <span className={`data-mono ${s.bounce_rate > 70 ? 'text-danger' : 'text-fg-muted'}`}>
                        {pct(s.bounce_rate)} bounce
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-container-highest">
                      <div className="grow h-full rounded-full"
                           style={{
                             width: `${s.bounce_rate}%`,
                             background: s.bounce_rate > 70 ? 'var(--c-danger)' : 'var(--c-primary)',
                             animationDelay: `${i * 40}ms`,
                           }} />
                    </div>
                  </div>
                ))}
                {sources.length === 0 && <Empty />}
              </div>
            </Card>

            <Card title="Step summary" pad={false}>
              <div className="divide-y divide-border/60">
                {funnel.steps.map((s, i) => (
                  <div key={`sum-${i}`} className="flex items-center justify-between px-5 py-3.5">
                    <span className="flex items-center gap-2.5 text-[13px]">
                      <IClock width={13} height={13} className="text-fg-subtle" />
                      {s.name}
                    </span>
                    <span className="flex items-center gap-4">
                      <span className="data-mono text-[12.5px] text-fg-muted">{num(s.users)}</span>
                      <span className="data-mono w-14 text-right text-[12.5px] text-primary">{pct(s.pct_of_prev)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </section>
        </>
      )}
    </>
  );
}
