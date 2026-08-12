import { NextResponse, type NextRequest } from 'next/server';
import {
  getBreakdown, getPages, getCustomers, getAttribution, getGoals, getSeo,
} from '@/lib/queries';
import { resolveRange } from '@/lib/range';
import { resolveSite } from '@/lib/site';
import { currentUser } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function csv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

export async function GET(req: NextRequest) {
  if (!(await currentUser())) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const { site } = await resolveSite();
  if (!site) return NextResponse.json({ error: 'no_site' }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const what = sp.get('what') ?? 'sources';
  const r = resolveRange(sp.get('range') ?? undefined);
  const id = site.public_id;

  let rows: Record<string, unknown>[] = [];
  switch (what) {
    case 'sources':   rows = await getBreakdown(id, r.d1, r.d2, 'source', 500); break;
    case 'countries': rows = await getBreakdown(id, r.d1, r.d2, 'country', 500); break;
    case 'devices':   rows = await getBreakdown(id, r.d1, r.d2, 'device', 500); break;
    case 'campaigns': rows = await getBreakdown(id, r.d1, r.d2, 'campaign', 500); break;
    case 'pages':     rows = await getPages(id, r.d1, r.d2, 1000); break;
    case 'revenue':   rows = await getAttribution(id, r.d1, r.d2, (sp.get('model') as 'first' | 'last') ?? 'last'); break;
    case 'goals':     rows = (await getGoals(id, r.d1, r.d2)).goals as unknown as Record<string, unknown>[]; break;
    case 'seo':       rows = (await getSeo(id, r.d1, r.d2)).queries as unknown as Record<string, unknown>[]; break;
    case 'customers': {
      const { rows: cs } = await getCustomers(id, 5000, 0);
      rows = cs as unknown as Record<string, unknown>[];
      break;
    }
    default: return NextResponse.json({ error: 'unknown_export' }, { status: 400 });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${site.domain}-${what}-${stamp}.csv"`,
      'cache-control': 'no-store',
    },
  });
}
