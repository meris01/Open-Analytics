import { NextResponse, type NextRequest } from 'next/server';
import { rpc, currentUser } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!(await currentUser())) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  try {
    if (b.action === 'delete') {
      return NextResponse.json(await rpc('oa_delete_goal', { p_id: b.id }));
    }
    return NextResponse.json(await rpc('oa_upsert_goal', {
      p_site: b.site, p_name: b.name, p_match_type: b.match_type,
      p_match_value: b.match_value, p_value: Number(b.value ?? 0), p_id: b.id ?? null,
    }));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
