import { SettingsClient } from '@/components/settings-client';
import { requireSite } from '@/lib/site';
import { listFunnels, getGoals, getInstallStatus } from '@/lib/queries';
import { resolveRange } from '@/lib/range';

export const dynamic = 'force-dynamic';

export default async function Settings() {
  const { site, sites } = await requireSite();
  const r = resolveRange('30d');

  const [{ goals }, funnels, install] = await Promise.all([
    getGoals(site.public_id, r.d1, r.d2),
    listFunnels(site.public_id),
    getInstallStatus(site.public_id),
  ]);

  return (
    <SettingsClient
      site={{
        public_id: site.public_id, domain: site.domain, name: site.name,
        currency: site.currency, timezone: site.timezone,
      }}
      siteCount={sites.length}
      goals={goals.map((g) => ({
        id: g.id, name: g.name, match_type: g.match_type,
        match_value: g.match_value, value: g.value,
      }))}
      funnels={funnels as { id: string; name: string; steps: { name: string; type: string; value: string }[] }[]}
      install={{
        connected: install.connected, events: install.events,
        last_event_at: install.last_event_at,
      }}
      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}
    />
  );
}
