import { Card, PageHead } from '@/components/ui';
import { CopyBlock } from '@/components/copy-block';
import { SettingsPanels } from '@/components/settings-panels';
import { ICheck, IBolt } from '@/components/icons';
import { requireSite } from '@/lib/site';
import { listFunnels, getGoals, getInstallStatus } from '@/lib/queries';
import { resolveRange } from '@/lib/range';
import { eventSnippet, declarativeSnippet } from '@/lib/snippets';
import { num, timeAgo } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Settings() {
  const { site, sites } = await requireSite();
  const r = resolveRange('30d');
  const [{ goals }, funnels, install] = await Promise.all([
    getGoals(site.public_id, r.d1, r.d2),
    listFunnels(site.public_id),
    getInstallStatus(site.public_id),
  ]);

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const snippet = `<script defer src="${base}/oa.js" data-site="${site.public_id}"></script>`;

  return (
    <>
      <PageHead
        title="Settings"
        sub={`Configure ${site.domain}, manage goals and funnels, and get your install snippet.`}
      />

      <Card
        title="Connection"
        action={
          <span className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-[12px] font-medium ${
            install.connected ? 'bg-primary-soft text-primary' : 'bg-container-high text-fg-subtle'
          }`}>
            {install.connected ? <ICheck width={12} height={12} /> : <IBolt width={12} height={12} />}
            {install.connected ? 'Receiving data' : 'Awaiting first event'}
          </span>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { l: 'Domain', v: site.domain },
            { l: 'Site ID', v: site.public_id },
            { l: 'Events recorded', v: num(install.events) },
            { l: 'Last event', v: install.last_event_at ? timeAgo(install.last_event_at) : '—' },
          ].map((x) => (
            <div key={x.l} className="rounded-md border border-border bg-surface-low p-3">
              <div className="label-caps text-fg-subtle">{x.l}</div>
              <div className="data-mono mt-1 truncate text-[12.5px]">{x.v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card id="install" title="Install the tracker" sub="One script tag. No cookie banner needed.">
        <CopyBlock code={snippet} lang="html" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            ['data-site', 'Which site the events belong to.'],
            ['data-api', 'Override the ingest endpoint if you host the collector separately.'],
            ['data-hash', 'Set "true" for hash-based routers (#/pricing).'],
            ['data-exclude', 'Comma-separated paths to ignore, e.g. /admin*,/preview'],
            ['data-local', 'Set "true" to also track localhost while developing.'],
            ['data-auto', 'Set "false" to disable automatic pageview tracking.'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-3 rounded-md border border-border bg-surface-low p-3">
              <code className="data-mono shrink-0 text-primary">{k}</code>
              <span className="text-[12.5px] text-fg-muted">{v}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Events, goals and revenue" sub="Everything the tracker exposes">
        <CopyBlock code={eventSnippet()} lang="javascript" />
        <p className="mb-2 mt-4 text-[12.5px] text-fg-muted">Or without writing JavaScript:</p>
        <CopyBlock code={declarativeSnippet()} lang="html" />
      </Card>

      <SettingsPanels
        site={{ public_id: site.public_id, domain: site.domain, name: site.name,
                currency: site.currency, timezone: site.timezone }}
        siteCount={sites.length}
        goals={goals.map((g) => ({ id: g.id, name: g.name, match_type: g.match_type,
                                   match_value: g.match_value, value: g.value }))}
        funnels={funnels as { id: string; name: string; steps: { name: string; type: string; value: string }[] }[]}
      />

      <Card title="Privacy model" sub="Why this needs no consent banner in most jurisdictions">
        <ul className="space-y-3 text-[13px] text-fg-muted">
          {[
            ['No cookies, no localStorage', "The script stores nothing on the visitor's device."],
            ['No raw IP is ever stored', 'The IP is hashed server-side with a salt that rotates every 24 hours, then discarded.'],
            ['Un-linkable across days', "Because the salt rotates daily, yesterday's visitor hash cannot be matched to today's."],
            ['No cross-site tracking', 'Data is first-party and site-scoped. There is no shared identity graph.'],
            ['Row-level security', 'Your data is isolated in Postgres by your user id — not by application code.'],
          ].map(([t, d]) => (
            <li key={t} className="flex gap-3">
              <ICheck width={15} height={15} className="mt-0.5 shrink-0 text-primary" />
              <span><strong className="text-fg">{t}.</strong> {d}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
