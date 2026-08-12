import { redirect } from 'next/navigation';
import { CreateSiteForm } from '@/components/create-site-form';
import { ILogo } from '@/components/icons';
import { currentUser, isConfigured } from '@/lib/supabase';
import { listSites } from '@/lib/site';
import { EnvSetup } from '@/components/env-setup';
import { WizardSteps } from '@/components/wizard-steps';

export const dynamic = 'force-dynamic';

export default async function Welcome({
  searchParams,
}: { searchParams: Promise<{ add?: string }> }) {
  if (!isConfigured()) return <EnvSetup />;
  const user = await currentUser();
  if (!user) redirect('/login');

  const { add } = await searchParams;
  const sites = await listSites();
  const isFirst = sites.length === 0;
  if (!isFirst && !add) {
    const pending = sites.find((s) => !s.installed_at && s.events === 0);
    if (pending) redirect(`/welcome/install?site=${pending.public_id}`);
  }

  return (
    <main className="dot-grid min-h-screen px-5 py-12">
      <div className="mx-auto w-full max-w-[620px]">
        <div className="rise mb-8 flex flex-col items-center text-center">
          <ILogo />
          <h1 className="headline-lg mt-4">
            {isFirst ? `Welcome, ${user.email?.split('@')[0]}.` : 'Add another website'}
          </h1>
          <p className="mt-2 max-w-md text-[13.5px] leading-6 text-fg-muted">
            {isFirst
              ? 'Two steps and about a minute: tell us your domain, then paste one script tag into your site. No cookie banner, no configuration.'
              : 'Each website gets its own dashboard, tracking script and revenue attribution.'}
          </p>
        </div>

        <WizardSteps current={1} />
        <CreateSiteForm isFirst={isFirst} />
      </div>
    </main>
  );
}
