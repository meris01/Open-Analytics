import { NextResponse, type NextRequest } from 'next/server';
import { sb } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  await (await sb()).auth.signOut();
  return NextResponse.redirect(new URL('/login', req.url), { status: 303 });
}
