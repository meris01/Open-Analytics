'use client';

import { useState } from 'react';
import { CopyBlock } from './copy-block';
import { Card, Badge, Empty } from './ui';
import { SourceMark } from './brand';
import { BRANDS } from './marks/brands';
import {
  ICheck, IWarn, ICode, IBook, IGear, IFlag, IFilter, IBolt, ILink,
  IChevron, IDownload, ISpark, IUsers, IClock, IGlobe,
} from './icons';
import { FRAMEWORKS, eventSnippet, declarativeSnippet } from '@/lib/snippets';
import {
  SUPABASE_STEPS, ENV_TEMPLATE, VERIFY_SQL, HEALTH_SQL, RETENTION_SQL,
  BACKUP_SQL, TRACKER_API, SERVER_SIDE, DEPLOY_STEPS, TROUBLESHOOTING,
} from '@/lib/setup-guide';
import { num, timeAgo } from '@/lib/format';

export type Tab =
  | 'connection' | 'install' | 'database' | 'events'
  | 'goals' | 'website' | 'privacy' | 'deploy' | 'help';

const TABS: { id: Tab; label: string; Icon: typeof IGear }[] = [
  { id: 'connection', label: 'Connection', Icon: IBolt },
  { id: 'install', label: 'Install', Icon: ICode },
  { id: 'database', label: 'Database setup', Icon: IGlobe },
  { id: 'events', label: 'Events & API', Icon: ISpark },
  { id: 'goals', label: 'Goals & funnels', Icon: IFlag },
  { id: 'website', label: 'Website', Icon: IGear },
  { id: 'privacy', label: 'Privacy', Icon: IUsers },
  { id: 'deploy', label: 'Deploy', Icon: ILink },
  { id: 'help', label: 'Troubleshooting', Icon: IBook },
];

export function SettingsTabs({
  active, onChange,
}: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <div className="scroll-thin -mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Settings sections">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id} role="tab" aria-selected={active === id}
          onClick={() => onChange(id)}
          className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-[13px] transition-colors duration-150 ${
            active === id
              ? 'bg-container-high font-medium text-fg'
              : 'text-fg-muted hover:bg-container-high/60 hover:text-fg'
          }`}
        >
          <Icon width={14} height={14} className={active === id ? 'text-primary' : ''} />
          {label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ CONNECTION ------------------------------- */
export function ConnectionPanel({
  domain, siteId, events, lastEvent, connected, appUrl,
}: {
  domain: string; siteId: string; events: number;
  lastEvent: string | null; connected: boolean; appUrl: string;
}) {
  const snippet = `<script defer src="${appUrl}/oa.js" data-site="${siteId}"></script>`;
  const live = lastEvent && Date.now() - new Date(lastEvent).getTime() < 5 * 60_000;

  return (
    <>
      <div className="card relative overflow-hidden p-5">
        <div className="pointer-events-none absolute inset-0 opacity-70"
             style={{ background: connected
               ? 'radial-gradient(600px 120px at 10% 0%, var(--c-primary-soft), transparent 70%)'
               : 'none' }} />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            connected ? 'bg-primary text-[color:var(--c-on-primary)]' : 'bg-container-high text-fg-subtle'
          }`}>
            {connected ? <ICheck width={19} height={19} /> : <IWarn width={19} height={19} />}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="headline-md">
              {connected ? 'Tracking is live' : 'Waiting for your first event'}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-fg-muted">
              {connected
                ? <>Receiving data from <span className="data-mono text-fg">{domain}</span>
                    {live ? ' — traffic in the last 5 minutes.' : `. Last event ${lastEvent ? timeAgo(lastEvent) : 'unknown'}.`}</>
                : <>The script has not reported from <span className="data-mono text-fg">{domain}</span> yet.</>}
            </p>
          </div>
          <Badge tone={connected ? 'primary' : 'muted'}>
            {live ? 'Live' : connected ? 'Connected' : 'Not connected'}
          </Badge>
        </div>

        <div className="relative mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: 'Domain', v: domain, icon: <IGlobe width={13} height={13} /> },
            { l: 'Site ID', v: siteId, icon: <ICode width={13} height={13} /> },
            { l: 'Events recorded', v: num(events), icon: <ISpark width={13} height={13} /> },
            { l: 'Last event', v: lastEvent ? timeAgo(lastEvent) : '—', icon: <IClock width={13} height={13} /> },
          ].map((x) => (
            <div key={x.l} className="rounded-md border border-border bg-surface-low p-3">
              <div className="label-caps flex items-center gap-1.5 text-fg-subtle">{x.icon} {x.l}</div>
              <div className="data-mono mt-1.5 truncate text-[12.5px]">{x.v}</div>
            </div>
          ))}
        </div>
      </div>

      <Card title="Your tracking snippet" sub="Paste this once. Everything else is optional."
            icon={<ICode width={15} height={15} />}>
        <CopyBlock code={snippet} lang="html" />
        <p className="mt-3 text-[12.5px] text-fg-muted">
          Under 2&nbsp;KB gzipped, loaded with <code className="data-mono rounded bg-container-high px-1">defer</code>,
          and it sets no cookies — so it does not block rendering and needs no consent banner.
        </p>
      </Card>
    </>
  );
}

/* -------------------------------- INSTALL -------------------------------- */
const FRAMEWORK_BRAND: Record<string, string> = {
  nextjs: 'nextjs', react: 'react', vue: 'vue', svelte: 'svelte',
  html: 'html', wordpress: 'wordpress', shopify: 'shopify', gtm: 'gtm',
};

export function InstallPanel({ siteId, appUrl }: { siteId: string; appUrl: string }) {
  const [fw, setFw] = useState(FRAMEWORKS[1]);
  return (
    <>
      <Card title="Choose your stack" sub="Every snippet below is complete and ready to paste"
            icon={<ICode width={15} height={15} />} pad={false}>
        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
          {FRAMEWORKS.map((f) => {
            const key = FRAMEWORK_BRAND[f.id];
            const mark = key ? BRANDS[key] : null;
            const on = fw.id === f.id;
            return (
              <button
                key={f.id} onClick={() => setFw(f)} aria-pressed={on}
                className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all duration-150 ${
                  on ? 'border-primary/50 bg-primary-soft' : 'border-border bg-surface-low hover:border-border-strong'
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md"
                      style={{ background: mark && mark.bg !== 'transparent' ? mark.bg : undefined }}>
                  {mark
                    ? <svg width={mark.bg === 'transparent' ? 30 : 20} height={mark.bg === 'transparent' ? 30 : 20} viewBox="0 0 24 24">{mark.d}</svg>
                    : <ICode width={17} height={17} className="text-fg-subtle" />}
                </span>
                <span className={`text-[12px] ${on ? 'font-medium text-primary' : 'text-fg-muted'}`}>{f.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <Card title={fw.label} sub={fw.note}>
        <CopyBlock code={fw.code('', siteId, appUrl)} lang={fw.file} />
      </Card>

      <Card title="Script attributes" sub="All optional — sensible defaults are already applied" pad={false}>
        <div className="divide-y divide-border">
          {[
            ['data-site', 'Which website the events belong to. Required.', siteId],
            ['data-api', 'Point events at a different collector, e.g. a first-party proxy on your own domain.', `${appUrl}/api/event`],
            ['data-hash', 'Set "true" if your router uses hashes (#/pricing).', 'false'],
            ['data-exclude', 'Comma-separated paths to ignore. Trailing * matches a prefix.', '/admin*,/preview'],
            ['data-local', 'Set "true" to also record localhost traffic while developing.', 'false'],
            ['data-auto', 'Set "false" to stop automatic pageviews and call oa("pageview") yourself.', 'true'],
          ].map(([k, v, d]) => (
            <div key={k} className="grid gap-1 px-5 py-3 sm:grid-cols-[160px_1fr] sm:gap-4">
              <code className="data-mono text-[12.5px] text-primary">{k}</code>
              <div>
                <p className="text-[12.5px] text-fg-muted">{v}</p>
                <p className="data-mono mt-1 text-[11.5px] text-fg-subtle">default: {d}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* -------------------------------- DATABASE ------------------------------- */
export function DatabasePanel() {
  const [open, setOpen] = useState<string | null>('project');
  return (
    <>
      <Card title="Set up your database" sub="Six steps, roughly ten minutes, done once"
            icon={<IGlobe width={15} height={15} />} pad={false}>
        <ol className="divide-y divide-border">
          {SUPABASE_STEPS.map((s, i) => {
            const on = open === s.id;
            return (
              <li key={s.id}>
                <button
                  onClick={() => setOpen(on ? null : s.id)} aria-expanded={on}
                  className="flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-container-high"
                >
                  <span className="data-mono mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-container-high text-[11px] text-primary">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium">{s.title}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-5 text-fg-muted">{s.body}</span>
                  </span>
                  <IChevron width={14} height={14}
                    className={`mt-1 shrink-0 text-fg-subtle transition-transform duration-200 ${on ? 'rotate-180' : ''}`} />
                </button>
                {on && (
                  <div className="fade space-y-3 border-t border-border bg-surface-low px-5 py-4">
                    <ol className="space-y-2">
                      {s.detail.map((d, j) => (
                        <li key={j} className="flex gap-2.5 text-[12.5px] text-fg-muted">
                          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ol>
                    {'file' in s && s.file && (
                      <p className="flex items-center gap-2 rounded-md border border-border bg-container p-2.5 text-[12px]">
                        <IDownload width={13} height={13} className="shrink-0 text-primary" />
                        Find it in your repo at <code className="data-mono text-fg">{s.file}</code>
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </Card>

      <Card title="Environment variables" sub="Create .env.local in the project root">
        <CopyBlock code={ENV_TEMPLATE} lang=".env.local" />
        <div className="mt-4 flex items-start gap-2.5 rounded-md border border-primary/25 bg-primary-soft p-3">
          <ICheck width={15} height={15} className="mt-0.5 shrink-0 text-primary" />
          <p className="text-[12.5px] leading-5">
            <strong className="text-fg">There is no service-role key here, and that is deliberate.</strong>{' '}
            The dashboard reads through the signed-in user&apos;s own session and row-level security decides
            what they can see. A leaked publishable key lets someone send events — nothing more.
          </p>
        </div>
      </Card>

      <Card title="Verify the install" sub="Run this in the SQL editor to confirm everything landed correctly">
        <CopyBlock code={VERIFY_SQL} lang="sql" />
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            ['7 tables', 'sites, visitors, sessions, events, goals, funnels, seo_queries'],
            ['rowsecurity = true', 'on every one of them'],
            ['anon = true', 'for oa_ingest only'],
          ].map(([a, b]) => (
            <div key={a} className="rounded-md border border-border bg-surface-low p-3">
              <p className="data-mono text-[12px] text-primary">{a}</p>
              <p className="mt-1 text-[11.5px] text-fg-muted">{b}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Operating it" sub="Health checks, retention and backups">
        <div className="space-y-5">
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-[13px] font-medium">
              <IBolt width={13} height={13} className="text-primary" /> Health check
            </h3>
            <CopyBlock code={HEALTH_SQL} lang="sql" />
          </div>
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-[13px] font-medium">
              <IClock width={13} height={13} className="text-primary" /> Retention
            </h3>
            <p className="mb-2 text-[12.5px] text-fg-muted">
              Events are the only table that grows meaningfully. Trimming old rows keeps you inside a free tier
              for a long time.
            </p>
            <CopyBlock code={RETENTION_SQL} lang="sql" />
          </div>
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-[13px] font-medium">
              <IDownload width={13} height={13} className="text-primary" /> Backup and migrate
            </h3>
            <p className="mb-2 text-[12.5px] text-fg-muted">
              Your data is plain Postgres. You can move it anywhere, any time — that is the point of self-hosting.
            </p>
            <CopyBlock code={BACKUP_SQL} lang="bash" />
          </div>
        </div>
      </Card>
    </>
  );
}

/* --------------------------------- EVENTS -------------------------------- */
export function EventsPanel() {
  return (
    <>
      <Card title="Tracker API" sub="Five functions. That is the whole surface area."
            icon={<ISpark width={15} height={15} />} pad={false}>
        <div className="divide-y divide-border">
          {TRACKER_API.map((fn) => (
            <div key={fn.sig} className="px-5 py-4">
              <code className="data-mono text-[13px] text-primary">{fn.sig}</code>
              <p className="mt-1.5 text-[12.5px] text-fg">{fn.what}</p>
              <p className="mt-1 text-[12.5px] leading-5 text-fg-muted">{fn.why}</p>
              <div className="mt-3"><CopyBlock code={fn.example} lang="javascript" /></div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Without writing JavaScript" sub="Add an attribute to any clickable element">
        <CopyBlock code={declarativeSnippet()} lang="html" />
        <p className="mt-3 text-[12.5px] text-fg-muted">
          The label falls back to the element&apos;s text if you omit <code className="data-mono rounded bg-container-high px-1">data-oa-label</code>.
        </p>
      </Card>

      <Card title="All of it together" sub="A typical SaaS integration">
        <CopyBlock code={eventSnippet()} lang="javascript" />
      </Card>

      <Card title="Server-side revenue" sub="More reliable than the browser — recommended for real money">
        <CopyBlock code={SERVER_SIDE} lang="javascript" />
        <p className="mt-3 flex items-start gap-2 text-[12.5px] text-fg-muted">
          <ICheck width={14} height={14} className="mt-0.5 shrink-0 text-primary" />
          Passing the same <code className="data-mono rounded bg-container-high px-1">email</code> you used in{' '}
          <code className="data-mono rounded bg-container-high px-1">identify()</code> is what stitches a webhook
          payment back to the visitor who browsed your blog three weeks earlier.
        </p>
      </Card>
    </>
  );
}

/* -------------------------------- PRIVACY -------------------------------- */
export function PrivacyPanel() {
  return (
    <>
      <Card title="Why no consent banner" sub="What the tracker does and does not do"
            icon={<IUsers width={15} height={15} />}>
        <div className="space-y-3">
          {[
            ['No cookies, no localStorage', 'The script stores nothing on the visitor’s device. There is nothing to ask permission for.'],
            ['No raw IP is ever written', 'visitor_hash = sha256(daily_salt | site | ip | user-agent), truncated. The IP is discarded in the same request.'],
            ['Un-linkable across days', 'The salt rotates every 24 hours, so yesterday’s hash cannot be matched to today’s. Long-term identity only exists once you call identify() yourself.'],
            ['No cross-site graph', 'Data is first-party and scoped to one website. There is no shared identity network behind this.'],
            ['Bots filtered before storage', 'Crawlers, monitors and headless agents are dropped at the edge, so they never enter your numbers.'],
            ['Isolation enforced by Postgres', 'Row-level security, not application code, decides who can read what.'],
          ].map(([t, d]) => (
            <div key={t} className="flex gap-3">
              <ICheck width={15} height={15} className="mt-0.5 shrink-0 text-primary" />
              <p className="text-[13px] leading-6 text-fg-muted">
                <strong className="text-fg">{t}.</strong> {d}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="primary">GDPR-friendly</Badge>
          <Badge tone="primary">CCPA-friendly</Badge>
          <Badge tone="primary">Cookieless</Badge>
          <Badge tone="outline">No consent banner</Badge>
          <Badge tone="outline">Self-hosted</Badge>
        </div>
      </Card>

      <Card title="The trade-off, stated plainly" sub="Every cookieless tracker has this limitation">
        <p className="text-[13px] leading-6 text-fg-muted">
          Because visitor hashes rotate daily, a person who visits on Monday and buys on Friday looks like two
          different anonymous visitors — unless you call{' '}
          <code className="data-mono rounded bg-container-high px-1">identify()</code> when they sign up. Once you do,
          their earlier sessions are attached retroactively and first-touch attribution becomes exact.
        </p>
        <p className="mt-3 text-[13px] leading-6 text-fg-muted">
          This is the honest trade for not needing a cookie banner. If you want cross-day anonymous identity, you
          need a cookie, and with a cookie you need consent.
        </p>
      </Card>

      <Card title="What is stored about a visitor" sub="The complete list — there is nothing else">
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            'Daily rotating hash (not reversible)', 'Country, region, city (from edge headers)',
            'Device type, OS, browser', 'Screen width and language',
            'Referrer domain and UTM parameters', 'Pages viewed and time on page',
            'Custom events you send', 'Revenue you send',
            'Email and ID — only if you call identify()',
          ].map((x) => (
            <div key={x} className="flex items-center gap-2 rounded-md border border-border bg-surface-low px-3 py-2 text-[12.5px] text-fg-muted">
              <span className="h-1 w-1 shrink-0 rounded-full bg-primary" /> {x}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* -------------------------------- DEPLOY --------------------------------- */
export function DeployPanel() {
  return (
    <Card title="Going live" sub="Three ways to run this in production" icon={<ILink width={15} height={15} />} pad={false}>
      <div className="divide-y divide-border">
        {DEPLOY_STEPS.map((s) => (
          <div key={s.id} className="px-5 py-4">
            <h3 className="text-[13px] font-medium">{s.title}</h3>
            <ol className="mt-2 space-y-2">
              {s.detail.map((d, i) => (
                <li key={i} className="flex gap-2.5 text-[12.5px] leading-5 text-fg-muted">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />{d}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------ TROUBLESHOOT ----------------------------- */
export function HelpPanel() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Card title="Troubleshooting" sub="The things that actually go wrong, and what to do about them"
          icon={<IBook width={15} height={15} />} pad={false}>
      <div className="divide-y divide-border">
        {TROUBLESHOOTING.map((t, i) => (
          <div key={i}>
            <button
              onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}
              className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-[13px] transition-colors hover:bg-container-high"
            >
              {t.q}
              <IChevron width={14} height={14}
                className={`shrink-0 text-fg-subtle transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} />
            </button>
            {open === i && (
              <p className="fade px-5 pb-4 text-[12.5px] leading-6 text-fg-muted">{t.a}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
