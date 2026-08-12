import { NextRequest, NextResponse } from 'next/server';
import { answer } from '@/lib/analyst';
import { getBreakdown, getKpis, getPages } from '@/lib/queries';
import { resolveRange } from '@/lib/range';
import { resolveSite } from '@/lib/site';
import { currentUser } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!(await currentUser())) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });

  const { q, range } = (await req.json()) as { q?: string; range?: string };
  if (!q?.trim()) return NextResponse.json({ error: 'empty' }, { status: 400 });

  const { site } = await resolveSite();
  if (!site) return NextResponse.json({ error: 'no_site' }, { status: 404 });

  const r = resolveRange(range);
  const [k, sources, pages] = await Promise.all([
    getKpis(site.public_id, r.d1, r.d2),
    getBreakdown(site.public_id, r.d1, r.d2, 'source', 12),
    getPages(site.public_id, r.d1, r.d2, 12),
  ]);

  return NextResponse.json({
    answer: answer(q, { k, sources, pages, currency: site.currency }),
    range: r.label,
  });
}
