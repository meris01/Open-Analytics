import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { rpc, currentUser } from './supabase';

export type Site = {
  id: string; domain: string; name: string; public_id: string;
  currency: string; timezone: string;
  installed_at: string | null; last_event_at: string | null;
  created_at: string; events: number;
};

export const SITE_COOKIE = 'oa-site';

export async function listSites(): Promise<Site[]> {
  try {
    return (await rpc<Site[]>('oa_list_sites')) ?? [];
  } catch {
    return [];
  }
}

/** Resolves the site the dashboard is currently pointed at.
 *  Sends brand-new accounts to onboarding rather than an empty dashboard. */
export async function requireSite(): Promise<{ site: Site; sites: Site[] }> {
  if (!(await currentUser())) redirect('/login');
  const sites = await listSites();
  if (sites.length === 0) redirect('/welcome');

  const wanted = (await cookies()).get(SITE_COOKIE)?.value;
  const site = sites.find((s) => s.public_id === wanted) ?? sites[0];

  // A site with zero events has never been installed — finish onboarding first.
  if (!site.installed_at && site.events === 0) redirect(`/welcome/install?site=${site.public_id}`);
  return { site, sites };
}

/** Same resolution, but never redirects — used by pages that handle empty state. */
export async function resolveSite(): Promise<{ site: Site | null; sites: Site[] }> {
  const sites = await listSites();
  if (!sites.length) return { site: null, sites };
  const wanted = (await cookies()).get(SITE_COOKIE)?.value;
  return { site: sites.find((s) => s.public_id === wanted) ?? sites[0], sites };
}
