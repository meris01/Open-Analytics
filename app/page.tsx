import { redirect } from 'next/navigation';
import { isConfigured, currentUser } from '@/lib/supabase';
import { listSites } from '@/lib/site';
import { EnvSetup } from '@/components/env-setup';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if (!isConfigured()) return <EnvSetup />;
  if (!(await currentUser())) redirect('/login');
  const sites = await listSites();
  if (!sites.length) redirect('/welcome');
  redirect('/overview');
}
