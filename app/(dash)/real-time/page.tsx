import { RealtimeView } from '@/components/realtime-view';
import { getRealtime } from '@/lib/queries';
import { requireSite } from '@/lib/site';

export const dynamic = 'force-dynamic';

export default async function RealTime() {
  const { site } = await requireSite();
  const initial = await getRealtime(site.public_id);
  return <RealtimeView initial={initial} currency={site.currency} />;
}
