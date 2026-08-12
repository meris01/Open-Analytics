import { NextResponse, type NextRequest } from 'next/server';
import { getInstallStatus } from '@/lib/queries';
import { currentUser } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await currentUser())) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const site = req.nextUrl.searchParams.get('site');
  if (!site) return NextResponse.json({ error: 'no_site' }, { status: 400 });
  return NextResponse.json(await getInstallStatus(site), {
    headers: { 'cache-control': 'no-store' },
  });
}
