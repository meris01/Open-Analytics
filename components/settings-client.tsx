'use client';

import { useState } from 'react';
import { PageHead, Badge } from './ui';
import {
  SettingsTabs, ConnectionPanel, InstallPanel, DatabasePanel,
  EventsPanel, PrivacyPanel, DeployPanel, HelpPanel, type Tab,
} from './settings-hub';
import { GoalsPanel, FunnelsPanel, WebsitePanel } from './settings-panels';
import { SiteMark } from './brand';

type Goal = { id: string; name: string; match_type: string; match_value: string; value: number };
type Step = { name: string; type: string; value: string };
type Funnel = { id: string; name: string; steps: Step[] };

export function SettingsClient({
  site, siteCount, goals, funnels, install, appUrl,
}: {
  site: { public_id: string; domain: string; name: string; currency: string; timezone: string };
  siteCount: number;
  goals: Goal[];
  funnels: Funnel[];
  install: { connected: boolean; events: number; last_event_at: string | null };
  appUrl: string;
}) {
  const [tab, setTab] = useState<Tab>('connection');

  return (
    <>
      <PageHead
        title="Settings"
        sub="Install, configure and operate OpenAnalytics. Everything you need to self-host is on this page."
        eyebrow={
          <span className="flex items-center gap-2">
            <SiteMark domain={site.domain} size={18} />
            <span className="data-mono text-[12.5px] text-fg-muted">{site.domain}</span>
            <Badge tone={install.connected ? 'primary' : 'muted'}>
              {install.connected ? 'Tracking' : 'Not installed'}
            </Badge>
          </span>
        }
      />

      <div className="sticky top-16 z-30 -mx-4 border-b border-border bg-bg/90 px-4 py-2 backdrop-blur-xl md:-mx-10 md:px-10">
        <SettingsTabs active={tab} onChange={setTab} />
      </div>

      <div key={tab} className="fade flex flex-col gap-6">
        {tab === 'connection' && (
          <ConnectionPanel
            domain={site.domain} siteId={site.public_id} events={install.events}
            lastEvent={install.last_event_at} connected={install.connected} appUrl={appUrl}
          />
        )}
        {tab === 'install' && <InstallPanel siteId={site.public_id} appUrl={appUrl} />}
        {tab === 'database' && <DatabasePanel />}
        {tab === 'events' && <EventsPanel />}
        {tab === 'goals' && (
          <>
            <GoalsPanel site={site.public_id} goals={goals} />
            <FunnelsPanel site={site.public_id} funnels={funnels} />
          </>
        )}
        {tab === 'website' && <WebsitePanel site={site} siteCount={siteCount} />}
        {tab === 'privacy' && <PrivacyPanel />}
        {tab === 'deploy' && <DeployPanel />}
        {tab === 'help' && <HelpPanel />}
      </div>
    </>
  );
}
