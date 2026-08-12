import { NextResponse, type NextRequest } from 'next/server';
import { rpc, currentUser } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!(await currentUser())) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  try {
    if (b.action === 'delete') {
      return NextResponse.json(await rpc('oa_delete_funnel', { p_id: b.id }));
    }
    return NextResponse.json(await rpc('oa_upsert_funnel', {
      p_site: b.site, p_name: b.name, p_steps: b.steps, p_id: b.id ?? null,
    }));
  } catch (e) {
    const m = (e as Error).message;
    return NextResponse.json(
      { error: /need_two_steps/.test(m) ? 'A funnel needs at least two steps.' : m },
      { status: 400 },
    );
  }
}
