import { NextResponse, type NextRequest } from 'next/server';
import { rpc, currentUser } from '@/lib/supabase';
import { SITE_COOKIE, listSites } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await currentUser())) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  return NextResponse.json(await listSites());
}

export async function POST(req: NextRequest) {
  if (!(await currentUser())) return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  const body = await req.json().catch(() => ({}));

  if (body.action === 'switch') {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SITE_COOKIE, String(body.site ?? ''), {
      path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  }

  if (body.action === 'claim-demo') {
    try {
      const site = await rpc<{ public_id: string }>('oa_claim_demo');
      const res = NextResponse.json(site);
      if (site?.public_id) {
        res.cookies.set(SITE_COOKIE, site.public_id, { path: '/', sameSite: 'lax', maxAge: 31536000 });
      }
      return res;
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  try {
    const site = await rpc<{ public_id: string; domain: string; id: string }>('oa_create_site', {
      p_domain: String(body.domain ?? ''),
      p_name: body.name ? String(body.name) : null,
      p_timezone: body.timezone ?? 'UTC',
      p_currency: body.currency ?? 'USD',
    });
    const res = NextResponse.json(site);
    res.cookies.set(SITE_COOKIE, site.public_id, { path: '/', sameSite: 'lax', maxAge: 31536000 });
    return res;
  } catch (e) {
    const m = (e as Error).message;
    const friendly = /invalid_domain/.test(m)
      ? 'That does not look like a valid domain. Try example.com'
      : /domain_exists/.test(m)
        ? 'You have already added that domain.'
        : m;
    return NextResponse.json({ error: friendly }, { status: 400 });
  }
}
