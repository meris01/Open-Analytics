import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC = ['/login', '/auth', '/api/event', '/api/script', '/oa.js'];

export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = req.nextUrl;

  // Not configured yet → let the setup screen explain what to do
  if (!url || !key) return NextResponse.next();
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // API callers get a machine-readable 401 rather than an HTML login page
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
    }
    const to = req.nextUrl.clone();
    to.pathname = '/login';
    to.searchParams.set('next', pathname);
    return NextResponse.redirect(to);
  }
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon|icon|apple-icon|.*\\.(?:svg|png|jpg|ico|txt)$).*)'],
};
