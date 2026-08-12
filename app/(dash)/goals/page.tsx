import { Card, PageHead, Table, Td, Tr, Meter, Empty, Kpi } from '@/components/ui';
import { IFlag, IMoney, ISpark } from '@/components/icons';
import { getGoals, getKpis } from '@/lib/queries';
import { resolveRange } from '@/lib/range';
import { requireSite } from '@/lib/site';
import { money, num, pct } from '@/lib/format';
import { ExportButton } from '@/components/export-button';

export const dynamic = 'force-dynamic';

export default async function Goals({
  searchParams,
}: { searchParams: Promise<{ range?: string }> }) {
  const { range } = await searchParams;
  const { site } = await requireSite();
  const r = resolveRange(range);
  const [{ total_sessions, goals }, k] = await Promise.all([
    getGoals(site.public_id, r.d1, r.d2),
    getKpis(site.public_id, r.d1, r.d2),
  ]);

  const totalCompletions = goals.reduce((s, g) => s + Number(g.completions), 0);
  const totalRevenue = goals.reduce((s, g) => s + Number(g.revenue), 0);
  const maxComp = Math.max(...goals.map((g) => Number(g.completions)), 1);

  return (
    <>
      <PageHead
        title="Goals"
        sub={`Named outcomes you care about, and how often they happen — ${r.label.toLowerCase()}.`}
        action={<ExportButton what="goals" range={r.key} />}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Goal completions" value={num(totalCompletions)} cur={totalCompletions}
             prev={k.previous.conversions} icon={<IFlag width={15} height={15} />} />
        <Kpi label="Goal revenue" value={money(totalRevenue, site.currency)} cur={totalRevenue}
             prev={k.previous.revenue} accent icon={<IMoney width={15} height={15} />} />
        <Kpi label="Session conv. rate" value={pct(total_sessions ? (totalCompletions / total_sessions) * 100 : 0)}
             cur={total_sessions ? (totalCompletions / total_sessions) * 100 : 0}
             prev={k.previous.sessions ? (k.previous.conversions / k.previous.sessions) * 100 : 0}
             icon={<ISpark width={15} height={15} />} />
      </section>

      <Card title="All goals" sub={`Measured against ${num(total_sessions)} sessions`} pad={false}>
        {goals.length === 0 ? (
          <Empty
            label="No goals defined"
            hint="Insert rows into analytics.goals — match_type can be event, path or path_prefix."
          />
        ) : (
          <Table head={['Goal', 'Match', 'Completions', 'Unique', 'Conv. rate', 'Volume', 'Revenue']}>
            {goals.map((g, i) => (
              <Tr key={g.id} i={i}>
                <Td>
                  <span className="flex items-center gap-2">
                    <IFlag width={13} height={13} className="text-primary" />
                    {g.name}
                  </span>
                </Td>
                <Td right className="!text-left">
                  <span className="data-mono text-[11.5px] text-fg-subtle">{g.match_type}: {g.match_value}</span>
                </Td>
                <Td mono right>{num(g.completions)}</Td>
                <Td mono right className="text-fg-muted">{num(g.unique_completions)}</Td>
                <Td mono right className="text-primary">
                  {pct(total_sessions ? (Number(g.unique_completions) / total_sessions) * 100 : 0, 2)}
                </Td>
                <Td right><Meter value={Number(g.completions)} max={maxComp} /></Td>
                <Td mono right>{Number(g.revenue) > 0 ? money(g.revenue, site.currency) : '—'}</Td>
              </Tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
