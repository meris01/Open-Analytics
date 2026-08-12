import { redirect } from 'next/navigation';
import { InstallWizard } from '@/components/install-wizard';
import { ILogo } from '@/components/icons';
import { currentUser } from '@/lib/supabase';
import { listSites } from '@/lib/site';
import { WizardSteps } from '@/components/wizard-steps';

export const dynamic = 'force-dynamic';

export default async function Install({
  searchParams,
}: { searchParams: Promise<{ site?: string }> }) {
  if (!(await currentUser())) redirect('/login');
  const { site: wanted } = await searchParams;

  const sites = await listSites();
  if (!sites.length) redirect('/welcome');
  const site = sites.find((s) => s.public_id === wanted) ?? sites[0];

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return (
    <main className="dot-grid min-h-screen px-5 py-12">
      <div className="mx-auto w-full max-w-[760px]">
        <div className="rise mb-8 flex flex-col items-center text-center">
          <ILogo />
          <h1 className="headline-lg mt-4">Install the tracking script</h1>
          <p className="mt-2 max-w-lg text-[13.5px] leading-6 text-fg-muted">
            One script tag on <span className="data-mono text-fg">{site.domain}</span>. It is
            under 2&nbsp;KB, loads deferred, and sets no cookies — so no consent banner is needed.
          </p>
        </div>
        <WizardSteps current={2} />
        <InstallWizard siteId={site.public_id} domain={site.domain} apiBase={base} />
      </div>
    </main>
  );
}
