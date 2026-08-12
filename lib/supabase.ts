import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

export const isConfigured = () => Boolean(SUPABASE_URL && SUPABASE_KEY);

/** Request-scoped client carrying the user's session cookie.
 *  Every read runs as the signed-in user, so RLS — not application code —
 *  is what keeps tenants apart. No service-role key is involved. */
export async function sb() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* called from a Server Component — middleware refreshes instead */
        }
      },
    },
  });
}

/** Anonymous client used only by the public ingest endpoint. */
let _anon: SupabaseClient | null = null;
export function anon(): SupabaseClient {
  if (!_anon) {
    if (!isConfigured()) throw new Error('Supabase env not configured');
    _anon = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-client-info': 'openanalytics-ingest' } },
    });
  }
  return _anon;
}

export async function currentUser() {
  if (!isConfigured()) return null;
  try {
    const { data } = await (await sb()).auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function rpc<T = unknown>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await (await sb()).rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}
