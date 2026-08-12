import { NextResponse } from 'next/server';
import { getRealtime } from '@/lib/queries';
import { resolveSite } from '@/lib/site';
import { currentUser } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  if (!(await currentUser())) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const { site } = await resolveSite();
  if (!site) return NextResponse.json({ error: 'no_site' }, { status: 404 });
  return NextResponse.json(await getRealtime(site.public_id), {
    headers: { 'cache-control': 'no-store' },
  });
}
