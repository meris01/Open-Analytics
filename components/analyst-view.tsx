'use client';

import { useState } from 'react';
import type { Insight } from '@/lib/analyst';
import { PageHead, Card, Badge } from './ui';
import { IBot, ISend, ISpark, IUp, IDown, IWarn, ICheck } from './icons';

const SUGGESTIONS = [
  'Why did revenue change?',
  'Which channel brings the best customers?',
  'What is my top page?',
  'How is my conversion rate?',
];

export function AnalystView({
  insights, range, rangeLabel,
}: { insights: Insight[]; range: string; rangeLabel: string }) {
  const [q, setQ] = useState('');
  const [log, setLog] = useState<{ q: string; a: string }[]>([]);
  const [busy, setBusy] = useState(false);

  async function ask(question: string) {
    if (!question.trim() || busy) return;
    setBusy(true);
    setQ('');
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ q: question, range }),
      });
      const { answer } = await res.json();
      setLog((l) => [...l, { q: question, a: answer ?? 'I could not read that data.' }]);
    } catch {
      setLog((l) => [...l, { q: question, a: 'Something went wrong reading your data.' }]);
    } finally {
      setBusy(false);
    }
  }

  const toneIcon = (t: Insight['tone']) =>
    t === 'good' ? <IUp width={15} height={15} /> : t === 'bad' ? <IWarn width={15} height={15} /> : <ISpark width={15} height={15} />;
  const toneCls = (t: Insight['tone']) =>
    t === 'good' ? 'text-primary bg-primary-soft' : t === 'bad' ? 'text-danger bg-danger-soft' : 'text-fg-muted bg-container-high';

  return (
    <>
      <div className="rise flex flex-col items-center pb-2 pt-4 text-center">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
          <IBot width={20} height={20} />
        </span>
        <h1 className="headline-lg">Your AI Analyst</h1>
        <p className="mt-2 max-w-xl text-[13px] text-fg-muted">
          Reads your own numbers and explains what changed, why it happened, and what to do next.
          Everything below is computed from your data — {rangeLabel.toLowerCase()}.
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-5">
        {insights.map((ins, i) => (
          <Card key={ins.id} className="rise" pad={false}>
            <div className="p-5" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start gap-3.5">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneCls(ins.tone)}`}>
                  {toneIcon(ins.tone)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="label-caps mb-1 text-fg-subtle">{ins.category}</p>
                  <h2 className="headline-md">{ins.headline}</h2>
                </div>
              </div>

              <div className="mt-4 pl-[50px]">
                <p className="text-[13.5px] leading-6 text-fg-muted">{ins.body}</p>

                {ins.bars && ins.bars.length > 0 && (
                  <div className="mt-4 rounded-md border border-border bg-surface-low p-3">
                    <div className="flex h-24 items-end gap-1.5">
                      {ins.bars.map((b, bi) => {
                        const max = Math.max(...ins.bars!.map((x) => x.value), 1);
                        const isMax = b.value === max && max > 0;
                        return (
                          <div key={bi} className="group/bar relative flex flex-1 flex-col justify-end" title={b.display}>
                            <span className="mb-1 text-center data-mono text-[10px] text-fg-subtle opacity-0 transition-opacity group-hover/bar:opacity-100">
                              {b.display}
                            </span>
                            <div
                              className="rounded-t-[3px] transition-all duration-300"
                              style={{
                                height: `${Math.max(3, (b.value / max) * 74)}px`,
                                background: isMax ? 'var(--c-primary)' : 'var(--c-primary-soft)',
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-1.5 flex gap-1.5">
                      {ins.bars.map((b, bi) => (
                        <span key={bi} className="data-mono flex-1 truncate text-center text-[9.5px] text-fg-subtle">
                          {b.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-start gap-2 rounded-md border border-border bg-surface-low p-3">
                  <ICheck width={14} height={14} className="mt-0.5 shrink-0 text-primary" />
                  <p className="text-[13px]">{ins.action}</p>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {ins.chips.map((ch) => <Badge key={ch}>{ch}</Badge>)}
                </div>
              </div>
            </div>
          </Card>
        ))}

        {log.map((entry, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="self-end rounded-lg rounded-br-sm bg-primary-strong px-3.5 py-2.5 text-[13px] text-[color:var(--c-on-primary)]">
              {entry.q}
            </div>
            <Card className="fade">
              <p className="text-[13.5px] leading-6">{entry.a}</p>
            </Card>
          </div>
        ))}

        {log.length === 0 && (
          <div className="flex flex-wrap justify-center gap-2 pb-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="btn !h-7 text-[12px]" onClick={() => ask(s)}>{s}</button>
            ))}
          </div>
        )}

        <div className="h-16" />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-bg/90 p-4 backdrop-blur-xl lg:left-[236px]">
        <form
          className="relative mx-auto flex max-w-[820px] items-center"
          onSubmit={(e) => { e.preventDefault(); ask(q); }}
        >
          <ISpark width={15} height={15} className="pointer-events-none absolute left-4 text-primary" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask anything about your data…"
            className="input h-11 w-full rounded-full !bg-container !pl-11 !pr-12 text-[13.5px]"
          />
          <button
            type="submit" disabled={busy}
            className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary-strong text-[color:var(--c-on-primary)] transition-transform hover:scale-105 disabled:opacity-50"
            aria-label="Ask"
          >
            <ISend width={14} height={14} />
          </button>
        </form>
      </div>
    </>
  );
}
