'use client';

import { useEffect, useState } from 'react';
import type { Realtime } from '@/lib/queries';
import { Card, PageHead, Empty, Badge } from './ui';
import { MiniBars } from './chart';
import { IDesktop, IMobile, IGlobe, IMoney } from './icons';
import { countryName, money, num, timeAgo } from '@/lib/format';
import { Flag, SourceMark } from './brand';

export function RealtimeView({ initial, currency = 'USD' }: { initial: Realtime; currency?: string }) {
  const [data, setData] = useState<Realtime>(initial);
  const [live, setLive] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/realtime', { cache: 'no-store' });
        if (res.ok) setData(await res.json());
      } catch {}
      setTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(id);
  }, [live]);

  const maxCountry = Math.max(...data.countries.map((c) => Number(c.visitors)), 1);
  const maxPage = Math.max(...data.top_pages.map((p) => Number(p.views)), 1);

  return (
    <>
      <PageHead
        title="Real-time"
        sub="Live traffic on your site right now, updating every 5 seconds."
        action={
          <button className="btn" onClick={() => setLive((l) => !l)}>
            {live ? 'Pause stream' : 'Resume stream'}
          </button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_400px]">
        <div className="flex flex-col gap-5">
          <div className="card dot-grid relative overflow-hidden p-6">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl"
                 style={{ background: 'var(--c-primary-soft)' }} />
            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div>
                <span className="label-caps flex items-center gap-2 text-fg-subtle">
                  <span className="relative flex h-2 w-2 text-primary">
                    {live && <span className="pulse-ring" />}
                    <span className="relative h-2 w-2 rounded-full bg-primary" />
                  </span>
                  Active visitors right now
                </span>
                <div key={data.active} className="kpi-xl fade mt-2 text-primary">{data.active}</div>
              </div>
              <div className="flex gap-8 border-l border-border pl-8">
                <div>
                  <span className="label-caps flex items-center gap-1.5 text-fg-subtle">
                    <IDesktop width={13} height={13} /> Desktop
                  </span>
                  <div className="headline-md mt-1 tnum">{data.desktop}</div>
                </div>
                <div>
                  <span className="label-caps flex items-center gap-1.5 text-fg-subtle">
                    <IMobile width={13} height={13} /> Mobile
                  </span>
                  <div className="headline-md mt-1 tnum">{data.mobile}</div>
                </div>
                <div>
                  <span className="label-caps text-fg-subtle">Views / 30m</span>
                  <div className="headline-md mt-1 tnum">{num(data.pageviews_30m)}</div>
                </div>
              </div>
            </div>
          </div>

          <Card title="Last 30 minutes" sub="Pageviews per minute">
            <MiniBars data={data.series.map((s) => Number(s.views))} height={140} />
            <div className="mt-2 flex justify-between">
              <span className="data-mono text-[10.5px] text-fg-subtle">30m ago</span>
              <span className="data-mono text-[10.5px] text-fg-subtle">now</span>
            </div>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card title="Active pages">
              <div className="space-y-1">
                {data.top_pages.map((p) => (
                  <div key={p.path} className="relative flex items-center justify-between overflow-hidden rounded px-2 py-1.5">
                    <span className="absolute inset-y-0 left-0 rounded"
                          style={{ width: `${(Number(p.views) / maxPage) * 100}%`, background: 'var(--c-primary-soft)' }} />
                    <span className="data-mono relative truncate pr-3 text-[12.5px] text-fg-muted">{p.path}</span>
                    <span className="data-mono relative text-[12.5px]">{p.views}</span>
                  </div>
                ))}
                {data.top_pages.length === 0 && <Empty label="Nobody on the site right now" />}
              </div>
            </Card>

            <Card title="Where they are">
              <div className="space-y-1">
                {data.countries.map((c) => (
                  <div key={c.country} className="relative flex items-center justify-between overflow-hidden rounded px-2 py-1.5">
                    <span className="absolute inset-y-0 left-0 rounded"
                          style={{ width: `${(Number(c.visitors) / maxCountry) * 100}%`, background: 'var(--c-primary-soft)' }} />
                    <span className="relative flex items-center gap-2 text-[12.5px]">
                      <Flag code={c.country} /> {countryName(c.country)}
                    </span>
                    <span className="data-mono relative text-[12.5px]">{c.visitors}</span>
                  </div>
                ))}
                {data.countries.length === 0 && (
                  <div className="flex items-center gap-2 py-8 text-[13px] text-fg-subtle">
                    <IGlobe width={15} height={15} /> No location data yet
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* -------- Event stream -------- */}
        <Card
          title="Live event stream"
          action={
            <span className="flex items-center gap-1.5 text-[11.5px] text-fg-subtle">
              <span className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-primary' : 'bg-fg-subtle'}`} />
              {live ? 'Connected' : 'Paused'}
            </span>
          }
          pad={false}
        >
          <div className="max-h-[720px] overflow-y-auto p-2 scroll-thin">
            {data.stream.length === 0 && <Empty label="Waiting for events…" />}
            {data.stream.map((e, i) => {
              const isRev = Number(e.revenue) > 0;
              return (
                <div
                  key={e.id}
                  className={`fade mb-1 rounded-md border-l-2 p-3 transition-colors hover:bg-container-high ${
                    i === 0 ? 'border-l-primary bg-container-high/50' : 'border-l-transparent'
                  }`}
                  style={{ opacity: Math.max(0.5, 1 - i * 0.03) }}
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <span className="data-mono text-[11px] text-fg-subtle">{timeAgo(e.created_at)}</span>
                    <Badge tone={isRev ? 'primary' : e.type === 'pageview' ? 'muted' : 'accent'}>
                      {isRev ? 'revenue' : e.type}
                    </Badge>
                  </div>
                  <p className="text-[12.5px]">
                    {e.type === 'pageview' ? 'Viewed ' : `${e.name ?? e.type} `}
                    <span className="data-mono rounded bg-container-high px-1 text-primary">{e.path}</span>
                  </p>
                  {isRev && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-primary">
                      <IMoney width={12} height={12} /> +{money(e.revenue, currency)}
                    </p>
                  )}
                  <div className="data-mono mt-2 flex flex-wrap items-center gap-3 text-[10.5px] text-fg-subtle">
                    <span className="flex items-center gap-1.5"><Flag code={e.country} size={12} /> {e.city ?? countryName(e.country)}</span>
                    <span className="flex items-center gap-1.5"><SourceMark source={e.source} size={12} /> {e.source ?? 'direct'}</span>
                    <span>{e.os ?? e.device}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
