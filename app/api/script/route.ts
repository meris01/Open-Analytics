import { TRACKER_SOURCE } from '@/lib/tracker';

export const dynamic = 'force-static';

export function GET() {
  return new Response(TRACKER_SOURCE, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'public, max-age=86400, stale-while-revalidate=604800',
      'access-control-allow-origin': '*',
      'x-content-type-options': 'nosniff',
    },
  });
}
