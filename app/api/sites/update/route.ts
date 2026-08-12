import { NextResponse, type NextRequest } from 'next/server';
import { rpc, currentUser } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!(await currentUser())) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  try {
    if (b.action === 'delete') {
      const out = await rpc('oa_delete_site', { p_site: b.site });
      const res = NextResponse.json(out);
      res.cookies.delete('oa-site');
      return res;
    }
    return NextResponse.json(await rpc('oa_update_site', {
      p_site: b.site, p_name: b.name ?? null, p_currency: b.currency ?? null,
      p_timezone: b.timezone ?? null, p_origins: b.origins ?? null,
    }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
