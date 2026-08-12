export type RangeKey = '24h' | '7d' | '30d' | '90d' | '12m' | 'today';

export const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '24h', label: 'Last 24 hours' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: '12m', label: 'Last 12 months' },
];

export function resolveRange(key: string | undefined) {
  const k = (RANGES.find((r) => r.key === key)?.key ?? '30d') as RangeKey;
  const to = new Date();
  const from = new Date(to);
  let bucket: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'day';

  switch (k) {
    case 'today':
      from.setHours(0, 0, 0, 0);
      bucket = 'hour';
      break;
    case '24h':
      from.setHours(from.getHours() - 24);
      bucket = 'hour';
      break;
    case '7d':
      from.setDate(from.getDate() - 7);
      bucket = 'day';
      break;
    case '90d':
      from.setDate(from.getDate() - 90);
      bucket = 'day';
      break;
    case '12m':
      from.setMonth(from.getMonth() - 12);
      bucket = 'month';
      break;
    default:
      from.setDate(from.getDate() - 30);
      bucket = 'day';
  }
  return {
    key: k,
    label: RANGES.find((r) => r.key === k)!.label,
    d1: from.toISOString(),
    d2: to.toISOString(),
    bucket,
  };
}
