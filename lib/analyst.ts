import { delta, money, num, pct, sourceLabel, duration } from './format';
import type { BreakdownRow, KpiResult, PageRow } from './queries';
import type { Point } from '@/components/chart';

export type Insight = {
  id: string;
  tone: 'good' | 'bad' | 'neutral';
  category: string;
  headline: string;
  body: string;
  action: string;
  chips: string[];
  bars?: { label: string; value: number; display: string }[];
};

/** A deterministic analyst: it reads the same numbers you do and explains
 *  what changed, why, and what to do — no external AI API required.
 *  Plug an LLM in later via /api/ask if you want free-form answers. */
export function buildInsights(
  k: KpiResult,
  series: Point[],
  sources: BreakdownRow[],
  pages: PageRow[],
  attribution: { source: string; revenue: number; customers: number }[],
): Insight[] {
  const c = k.current, p = k.previous;
  const out: Insight[] = [];

  /* ---- 1. Revenue movement, explained by channel ---- */
  const rev = delta(Number(c.revenue), Number(p.revenue));
  const topRev = [...attribution].sort((a, b) => Number(b.revenue) - Number(a.revenue))[0];
  const totalAttr = attribution.reduce((s, a) => s + Number(a.revenue), 0);
  out.push({
    id: 'revenue',
    tone: rev.dir === 'up' ? 'good' : rev.dir === 'down' ? 'bad' : 'neutral',
    category: 'Revenue',
    headline:
      rev.dir === 'flat'
        ? 'Revenue held flat this period'
        : `Why did revenue ${rev.dir === 'up' ? 'increase' : 'drop'}?`,
    body:
      Number(c.revenue) === 0
        ? 'No revenue has been recorded yet. Once you call oa("revenue", amount) on purchase, every dollar gets attributed back to the source, campaign and landing page that earned it.'
        : `Revenue ${rev.dir === 'up' ? 'grew' : rev.dir === 'down' ? 'fell' : 'stayed at'} ${rev.value.toFixed(1)}% versus the previous period, landing at ${money(c.revenue)} across ${num(c.orders)} orders.` +
          (topRev
            ? ` ${sourceLabel(topRev.source)} is doing the heavy lifting — ${money(topRev.revenue)}, or ${pct(totalAttr ? (Number(topRev.revenue) / totalAttr) * 100 : 0)} of everything.`
            : ''),
    action:
      rev.dir === 'down'
        ? `Check whether ${topRev ? sourceLabel(topRev.source) : 'your top channel'} lost volume or lost conversion rate — those need very different fixes.`
        : `Double down on ${topRev ? sourceLabel(topRev.source) : 'your best channel'} before the returns flatten.`,
    chips: [topRev ? sourceLabel(topRev.source) : 'No channel data', `${num(c.customers)} paying customers`],
    bars: series.slice(-7).map((s) => ({
      label: new Date(s.t).toLocaleDateString('en-US', { weekday: 'short' }),
      value: Number(s.revenue),
      display: money(s.revenue),
    })),
  });

  /* ---- 2. Channel quality by revenue per visitor ---- */
  const quality = sources
    .filter((s) => s.visitors > 0)
    .map((s) => ({ ...s, rpv: Number(s.revenue) / s.visitors }))
    .sort((a, b) => b.rpv - a.rpv);
  const best = quality[0];
  const worst = quality.filter((q) => q.visitors > 10).at(-1);

  out.push({
    id: 'quality',
    tone: 'neutral',
    category: 'Customer quality',
    headline: 'Which channel brings the best customers?',
    body: best
      ? `Ranked by revenue per visitor rather than raw traffic, ${sourceLabel(best.label)} is your strongest channel at ${money(best.rpv)} per visitor.` +
        (worst && worst.label !== best.label
          ? ` ${sourceLabel(worst.label)} sends ${num(worst.visitors)} visitors but only ${money(worst.rpv)} each — high volume, low intent.`
          : '')
      : 'Not enough traffic yet to rank channels by quality.',
    action: best
      ? `Shift budget and content effort toward ${sourceLabel(best.label)}. Raw visitor counts will mislead you here.`
      : 'Install the tracker on your highest-traffic pages first.',
    chips: quality.slice(0, 3).map((q) => sourceLabel(q.label)),
    bars: quality.slice(0, 5).map((q) => ({
      label: sourceLabel(q.label),
      value: q.rpv,
      display: money(q.rpv),
    })),
  });

  /* ---- 3. Engagement / bounce leak ---- */
  const bounce = delta(Number(c.bounce_rate), Number(p.bounce_rate));
  const leaky = [...pages].filter((pg) => pg.views > 20).sort((a, b) => Number(b.bounce_rate) - Number(a.bounce_rate))[0];
  out.push({
    id: 'engagement',
    tone: Number(c.bounce_rate) > 65 ? 'bad' : 'good',
    category: 'Engagement',
    headline:
      Number(c.bounce_rate) > 65
        ? 'Your bounce rate is leaking traffic'
        : 'Visitors are sticking around',
    body: `Bounce rate is ${pct(c.bounce_rate)} (${bounce.dir === 'down' ? 'down' : bounce.dir === 'up' ? 'up' : 'flat'} ${bounce.value.toFixed(1)}%), with an average session of ${duration(c.avg_duration)} across ${Number(c.pages_per_session).toFixed(2)} pages.` +
      (leaky ? ` ${leaky.path} is the worst offender at ${pct(leaky.bounce_rate)} on ${num(leaky.views)} views.` : ''),
    action: leaky
      ? `Rewrite the first screen of ${leaky.path} — match it to the promise made by whatever brought people there.`
      : 'Keep an eye on entry pages as traffic grows.',
    chips: [`${pct(c.bounce_rate)} bounce`, duration(c.avg_duration), `${num(c.pageviews)} pageviews`],
  });

  /* ---- 4. Conversion funnel health ---- */
  const cvr = c.sessions ? (c.conversions / c.sessions) * 100 : 0;
  const prevCvr = p.sessions ? (p.conversions / p.sessions) * 100 : 0;
  const cd = delta(cvr, prevCvr);
  out.push({
    id: 'conversion',
    tone: cd.dir === 'up' ? 'good' : cd.dir === 'down' ? 'bad' : 'neutral',
    category: 'Conversion',
    headline: 'How efficiently is traffic converting?',
    body: `${pct(cvr, 2)} of sessions convert (${cd.dir === 'up' ? '+' : cd.dir === 'down' ? '−' : '±'}${cd.value.toFixed(1)}% vs previous). That is ${num(c.conversions)} conversions from ${num(c.sessions)} sessions, worth ${money(c.orders ? Number(c.revenue) / c.orders : 0)} on average.`,
    action:
      cvr < 1
        ? 'A sub-1% rate usually means a mismatch between traffic intent and the landing page — check your funnel drop-off step by step.'
        : 'Test one high-traffic landing page at a time; small lifts compound across every channel.',
    chips: [`${pct(cvr, 2)} CVR`, `${num(c.conversions)} conversions`],
  });

  /* ---- 5. Traffic trend + anomaly ---- */
  const vals = series.map((s) => Number(s.visitors));
  const recent = vals.slice(-3);
  const baseline = vals.slice(0, -3);
  const avgBase = baseline.length ? baseline.reduce((a, b) => a + b, 0) / baseline.length : 0;
  const avgRecent = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
  const spike = avgBase > 0 ? ((avgRecent - avgBase) / avgBase) * 100 : 0;
  out.push({
    id: 'trend',
    tone: spike > 15 ? 'good' : spike < -15 ? 'bad' : 'neutral',
    category: 'Traffic',
    headline:
      Math.abs(spike) > 15
        ? `Traffic ${spike > 0 ? 'spiked' : 'dipped'} in the last few periods`
        : 'Traffic is running steady',
    body:
      avgBase === 0
        ? 'Not enough history to detect a trend yet — check back after a few days of data.'
        : `Recent activity is averaging ${num(Math.round(avgRecent))} visitors versus a ${num(Math.round(avgBase))} baseline, a ${Math.abs(spike).toFixed(0)}% ${spike > 0 ? 'increase' : 'decrease'}.`,
    action:
      spike > 15
        ? 'Find the referrer behind the spike in Sources and see whether it converts — spikes that do not convert are vanity.'
        : spike < -15
          ? 'Compare the drop against your top sources; a single channel usually explains most of it.'
          : 'Nothing anomalous. Focus effort on conversion rather than volume.',
    chips: [`${num(c.visitors)} visitors`, `${num(c.sessions)} sessions`],
    bars: series.slice(-10).map((s) => ({
      label: new Date(s.t).toLocaleDateString('en-US', { day: 'numeric' }),
      value: Number(s.visitors),
      display: num(s.visitors),
    })),
  });

  return out;
}

/** Deterministic Q&A over the same numbers. */
export function answer(
  q: string,
  ctx: { k: KpiResult; sources: BreakdownRow[]; pages: PageRow[]; currency?: string },
): string {
  const s = q.toLowerCase();
  const c = ctx.k.current, p = ctx.k.previous;
  const topSource = [...ctx.sources].sort((a, b) => b.visitors - a.visitors)[0];
  const topRev = [...ctx.sources].sort((a, b) => Number(b.revenue) - Number(a.revenue))[0];
  const topPage = ctx.pages[0];

  if (/revenue|money|sales|earn/.test(s)) {
    const d = delta(Number(c.revenue), Number(p.revenue));
    return `You made ${money(c.revenue)} this period across ${num(c.orders)} orders — ${d.dir === 'flat' ? 'flat' : `${d.value.toFixed(1)}% ${d.dir}`} versus the previous period. ${topRev ? `${sourceLabel(topRev.label)} contributed the most at ${money(topRev.revenue)}.` : ''}`;
  }
  if (/source|channel|traffic from|referr|where.*(come|from)/.test(s)) {
    return topSource
      ? `${sourceLabel(topSource.label)} is your biggest source with ${num(topSource.visitors)} visitors and ${money(topSource.revenue)} in revenue (${pct(topSource.bounce_rate)} bounce). ${topRev && topRev.label !== topSource.label ? `But ${sourceLabel(topRev.label)} earns more per visitor — worth a look.` : ''}`
      : 'No source data in this range yet.';
  }
  if (/page|content|article|post|blog/.test(s)) {
    return topPage
      ? `${topPage.path} is your top page with ${num(topPage.views)} views, ${duration(topPage.avg_time)} average time and ${pct(topPage.bounce_rate)} bounce. It has produced ${money(topPage.revenue)}.`
      : 'No page data in this range yet.';
  }
  if (/bounce|engage|time on|stick/.test(s)) {
    return `Bounce rate is ${pct(c.bounce_rate)}, average session ${duration(c.avg_duration)}, ${Number(c.pages_per_session).toFixed(2)} pages per session. Anything above 65% bounce usually means an intent mismatch on your entry pages.`;
  }
  if (/convert|conversion|funnel|cvr|signup/.test(s)) {
    const cvr = c.sessions ? (c.conversions / c.sessions) * 100 : 0;
    return `${pct(cvr, 2)} of sessions convert — ${num(c.conversions)} conversions from ${num(c.sessions)} sessions, and ${num(c.customers)} of those visitors paid you.`;
  }
  if (/customer|user|who/.test(s)) {
    return `${num(c.customers)} paying customers this period out of ${num(c.visitors)} visitors, average order ${money(c.orders ? Number(c.revenue) / c.orders : 0)}. Open Customers to see each one's full path to conversion.`;
  }
  if (/visitor|how many|traffic|people/.test(s)) {
    const d = delta(c.visitors, p.visitors);
    return `${num(c.visitors)} visitors and ${num(c.sessions)} sessions this period — ${d.dir === 'flat' ? 'flat' : `${d.value.toFixed(1)}% ${d.dir}`} versus the previous period, generating ${num(c.pageviews)} pageviews.`;
  }
  return `This period: ${num(c.visitors)} visitors, ${num(c.sessions)} sessions, ${num(c.pageviews)} pageviews, ${money(c.revenue)} revenue from ${num(c.customers)} customers, ${pct(c.bounce_rate)} bounce. Ask me about revenue, sources, pages, bounce, conversion or customers.`;
}
