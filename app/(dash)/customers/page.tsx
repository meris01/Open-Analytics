import Link from 'next/link';
import { Card, PageHead, Empty, Badge } from '@/components/ui';
import { IUsers, IRoute, IClose, IChevronL, IChevronR, IDownload, IMoney, ILink } from '@/components/icons';
import { getCustomers, getJourney } from '@/lib/queries';
import { requireSite } from '@/lib/site';
import { countryName, money, num, sourceLabel, timeAgo } from '@/lib/format';
import { CountryFlag, SourceMark, CountryCell } from '@/components/brand';
import { ExportButton } from '@/components/export-button';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

function initials(c: { name: string | null; email: string | null }) {
  const s = c.name || c.email || '??';
  return s.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');
}

export default async function Customers({
  searchParams,
}: { searchParams: Promise<{ range?: string; v?: string; p?: string; q?: string }> }) {
  const { range, v, p, q } = await searchParams;
  const { site } = await requireSite();
  const currency = site.currency;
  const page = Math.max(0, Number(p ?? 0));
  const { total, rows } = await getCustomers(site.public_id, PAGE_SIZE, page * PAGE_SIZE, q);
  const selected = v ?? rows[0]?.id;
  const journey = selected ? await getJourney(selected) : { visitor: null, events: [] };
  const qs = (extra: Record<string, string | number>) => {
    const sp = new URLSearchParams();
    if (range) sp.set('range', range);
    if (q) sp.set('q', q);
    Object.entries(extra).forEach(([k, val]) => sp.set(k, String(val)));
    return `/customers?${sp.toString()}`;
  };

  return (
    <>
      <PageHead
        title="Customers"
        sub={`${num(total)} identified customers and the exact path each of them took.`}
        action={<ExportButton what="customers" />}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Card title="Customer index" pad={false}>
          {rows.length === 0 ? (
            <Empty
              label="No identified customers yet"
              hint="Call oa('identify', userId, { email }) after login, then oa('revenue', amount) on payment."
            />
          ) : (
            <>
              <div className="grid grid-cols-12 gap-3 border-b border-border px-5 py-2.5">
                <div className="label-caps col-span-5 text-fg-subtle">Customer</div>
                <div className="label-caps col-span-4 text-fg-subtle">First source</div>
                <div className="label-caps col-span-3 text-right text-fg-subtle">Lifetime revenue</div>
              </div>
              <div className="divide-y divide-border/60">
                {rows.map((c, i) => {
                  const active = c.id === selected;
                  return (
                    <Link
                      key={c.id}
                      href={qs({ v: c.id, p: page })}
                      scroll={false}
                      className={`rise grid grid-cols-12 items-center gap-3 border-l-2 px-5 py-3 transition-colors ${
                        active ? 'border-l-primary bg-primary-soft' : 'border-l-transparent hover:bg-container-high'
                      }`}
                      style={{ animationDelay: `${i * 25}ms` }}
                    >
                      <div className="col-span-5 flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-container-highest text-[11px] font-semibold">
                          {initials(c)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-medium">{c.name ?? c.email ?? 'Anonymous'}</span>
                          <span className="data-mono block truncate text-[11.5px] text-fg-subtle">
                            {c.email ?? c.external_id ?? '—'}
                          </span>
                        </span>
                      </div>
                      <div className="col-span-4 flex items-center gap-2 truncate text-[12.5px] text-fg-muted">
                        <CountryFlag code={c.country} size={13} /> <SourceMark source={c.first_source} size={14} /> {sourceLabel(c.first_source)}
                      </div>
                      <div className="data-mono col-span-3 text-right text-[13px]">{money(c.total_revenue, currency)}</div>
                    </Link>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t border-border px-5 py-3 text-[12px] text-fg-muted">
                <span className="tnum">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {num(total)}
                </span>
                <span className="flex gap-1.5">
                  <Link href={qs({ p: Math.max(0, page - 1) })} scroll={false} aria-label="Previous page"
                        aria-disabled={page === 0}
                        className={`btn !h-7 !px-2 ${page === 0 ? 'pointer-events-none opacity-40' : ''}`}>
                    <IChevronL width={13} height={13} />
                  </Link>
                  <Link href={qs({ p: page + 1 })} scroll={false} aria-label="Next page"
                        aria-disabled={(page + 1) * PAGE_SIZE >= total}
                        className={`btn !h-7 !px-2 ${(page + 1) * PAGE_SIZE >= total ? 'pointer-events-none opacity-40' : ''}`}>
                    <IChevronR width={13} height={13} />
                  </Link>
                </span>
              </div>
            </>
          )}
        </Card>

        {/* -------- Journey panel -------- */}
        <aside className="card fade h-fit overflow-hidden xl:sticky xl:top-24">
          {!journey.visitor ? (
            <div className="p-6"><Empty label="Select a customer" hint="Their full path to conversion appears here." /></div>
          ) : (
            <>
              <div className="relative border-b border-border p-5">
                <div className="absolute inset-x-0 top-0 h-px"
                     style={{ background: 'linear-gradient(90deg, transparent, var(--c-primary), transparent)' }} />
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-container-high text-[13px] font-semibold text-primary">
                    {initials(journey.visitor)}
                  </span>
                  <Link href={qs({ p: page })} scroll={false} aria-label="Close customer detail" className="btn btn-ghost !h-7 !w-7 !px-0 justify-center">
                    <IClose width={14} height={14} />
                  </Link>
                </div>
                <h2 className="headline-md mt-3">{journey.visitor.name ?? journey.visitor.email ?? 'Anonymous'}</h2>
                <p className="data-mono mt-0.5 text-[12px] text-fg-subtle">{journey.visitor.email ?? journey.visitor.external_id ?? '—'}</p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-border bg-surface-low p-3">
                    <div className="label-caps text-fg-subtle">LTV</div>
                    <div className="data-mono mt-1 text-[18px] text-primary">{money(journey.visitor.total_revenue, currency)}</div>
                  </div>
                  <div className="rounded-md border border-border bg-surface-low p-3">
                    <div className="label-caps text-fg-subtle">Acquisition</div>
                    <div className="mt-1 truncate text-[13px]">{sourceLabel(journey.visitor.first_source)}</div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11.5px] text-fg-subtle">
                  <Badge>{num(journey.visitor.sessions)} sessions</Badge>
                  <Badge>{num(journey.visitor.pageviews)} pageviews</Badge>
                  <Badge><CountryFlag code={journey.visitor.country} size={12} /> <span className="ml-1.5">{countryName(journey.visitor.country)}</span></Badge>
                </div>
              </div>

              <div className="max-h-[560px] overflow-y-auto p-5 scroll-thin">
                <h3 className="label-caps mb-5 flex items-center gap-2 text-fg-subtle">
                  <IRoute width={14} height={14} /> Path to conversion
                </h3>
                <ol className="relative space-y-5 border-l border-border pl-5">
                  {journey.events.map((e, i) => {
                    const isRev = Number(e.revenue) > 0;
                    return (
                      <li key={e.id} className="rise relative" style={{ animationDelay: `${i * 40}ms` }}>
                        <span
                          className={`absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 ${
                            isRev ? 'border-transparent bg-primary' : 'border-fg-subtle bg-container'
                          }`}
                          style={isRev ? { boxShadow: '0 0 0 4px var(--c-primary-soft)' } : undefined}
                        />
                        <div className="flex items-baseline justify-between gap-3">
                          <span className={`text-[12.5px] font-medium ${isRev ? 'text-primary' : ''}`}>
                            {e.type === 'pageview' ? 'Pageview' : e.name ?? e.type}
                          </span>
                          <span className="data-mono shrink-0 text-[11px] text-fg-subtle">
                            {new Date(e.created_at).toLocaleString('en-US', {
                              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className={`mt-1.5 rounded-md border p-2.5 text-[12.5px] ${
                          isRev ? 'border-primary/25 bg-primary-soft' : 'border-border bg-surface-low'
                        }`}>
                          <span className="flex items-center gap-1.5 text-fg-subtle">
                            {e.source && <><SourceMark source={e.source} size={12} />{sourceLabel(e.source)}</>}
                          </span>
                          <span className="data-mono mt-1 block break-all text-fg">{e.path}</span>
                          {isRev && (
                            <span className="mt-2 flex items-center gap-1.5 text-primary">
                              <IMoney width={13} height={13} /> +{money(e.revenue, currency)}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
                {journey.events.length === 0 && <Empty label="No events recorded" />}
              </div>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
