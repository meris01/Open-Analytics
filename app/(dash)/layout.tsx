import { Suspense } from 'react';
import { DashChrome } from '@/components/shell';
import { requireSite } from '@/lib/site';
import { currentUser } from '@/lib/supabase';

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const { site, sites } = await requireSite();

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Suspense fallback={<div className="min-h-screen" />}>
        <DashChrome site={site} sites={sites} email={user?.email ?? ''}>
          <div id="main">{children}</div>
        </DashChrome>
      </Suspense>
    </>
  );
}
