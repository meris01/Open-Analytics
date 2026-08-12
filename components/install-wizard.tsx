'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CopyBlock } from './copy-block';
import { SourceMark, Flag } from './brand';
import {
  ICheck, IWarn, IChevronR, IClock, ICode, ISpark, IChevron, IBolt,
} from './icons';
import { FRAMEWORKS, eventSnippet, declarativeSnippet } from '@/lib/snippets';
import type { InstallStatus } from '@/lib/queries';
import { timeAgo } from '@/lib/format';

const TROUBLE = [
  {
    q: 'Nothing has arrived after a couple of minutes',
    a: 'Open your site in a normal browser tab (not localhost) and check the Network panel for a request to /api/event. If it is missing, the script tag has not shipped to production yet — a lot of frameworks need a rebuild and redeploy.',
  },
  {
    q: 'I am testing on localhost',
    a: 'The tracker deliberately ignores localhost so your development traffic never pollutes real numbers. Add data-local="true" to the script tag if you want to test locally.',
  },
  {
    q: 'My ad blocker might be eating it',
    a: 'Some blockers use generic filters. The endpoint is first-party so most rules do not match, but you can host the script under your own path via a rewrite if you want to be certain.',
  },
  {
    q: 'The site is behind a login',
    a: 'That is fine — the script runs wherever it is included. Just visit any page yourself while signed in and the first event will land.',
  },
];

export function InstallWizard({
  siteId, domain, apiBase,
}: { siteId: string; domain: string; apiBase: string }) {
  const router = useRouter();
  const [fw, setFw] = useState(FRAMEWORKS[1]); // Next.js first — most likely reader
  const [status, setStatus] = useState<InstallStatus | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [openHelp, setOpenHelp] = useState<number | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const done = useRef(false);

  /* Poll for the first event. Fast at first, then backs off so an abandoned
     tab does not hammer the database forever. */
  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      if (stop || done.current) return;
      try {
        const res = await fetch(`/api/install-status?site=${siteId}`, { cache: 'no-store' });
        if (res.ok) {
          const data: InstallStatus = await res.json();
          setStatus(data);
          if (data.connected) {
            done.current = true;
            setTimeout(() => { router.push('/overview'); router.refresh(); }, 2600);
            return;
          }
        }
      } catch { /* offline — just keep trying */ }
      const wait = elapsed < 60 ? 2000 : elapsed < 300 ? 5000 : 15000;
      timer = setTimeout(poll, wait);
    };

    poll();
    const tick = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { stop = true; clearTimeout(timer); clearInterval(tick); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  const connected = status?.connected ?? false;

  return (
    <div className="flex flex-col gap-5">
      {/* ---------------- live status ---------------- */}
      <div
        className={`card rise relative overflow-hidden p-5 transition-colors duration-500 ${
          connected ? 'border-primary/40' : ''
        }`}
        aria-live="polite"
      >
        {connected && (
          <div className="pointer-events-none absolute inset-0 opacity-60"
               style={{ background: 'radial-gradient(circle at 20% 0%, var(--c-primary-soft), transparent 60%)' }} />
        )}
        <div className="relative flex items-center gap-4">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              connected ? 'bg-primary text-[color:var(--c-on-primary)]' : 'bg-container-high text-fg-subtle'
            }`}
          >
            {connected ? <ICheck width={18} height={18} /> : (
              <span className="relative flex h-2.5 w-2.5 text-primary">
                <span className="pulse-ring" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="headline-md">
              {connected ? 'Connected — data is flowing' : `Listening for the first event from ${domain}`}
            </p>
            <p className="mt-0.5 text-[12.5px] text-fg-muted">
              {connected
                ? `${status?.events} event${status?.events === 1 ? '' : 's'} received. Taking you to your dashboard…`
                : elapsed < 8
                  ? 'This page updates by itself — leave it open while you deploy.'
                  : `Still waiting (${Math.floor(elapsed / 60)}m ${elapsed % 60}s). Deploy the change, then load any page on your site.`}
            </p>
          </div>
          {connected && (
            <button className="btn btn-primary shrink-0" onClick={() => router.push('/overview')}>
              Open dashboard <IChevronR width={13} height={13} />
            </button>
          )}
        </div>

        {connected && status!.recent.length > 0 && (
          <div className="relative mt-4 space-y-1.5 border-t border-border pt-4">
            <p className="label-caps mb-2 text-fg-subtle">First events received</p>
            {status!.recent.slice(0, 3).map((e, i) => (
              <div key={i} className="fade flex items-center gap-3 rounded bg-surface-low px-2.5 py-1.5">
                <SourceMark source={e.referrer_host ?? 'direct'} size={14} />
                <span className="data-mono flex-1 truncate text-[12px]">{e.path}</span>
                {e.country && <Flag code={e.country} size={13} />}
                <span className="text-[11px] text-fg-subtle">{timeAgo(e.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------------- snippet ---------------- */}
      <section className="card rise overflow-hidden" style={{ animationDelay: '80ms' }}>
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <h2 className="headline-md">Add the script</h2>
          <span className="hidden text-[11.5px] text-fg-subtle sm:block">
            Site ID <code className="data-mono rounded bg-container-high px-1.5 py-0.5 text-fg">{siteId}</code>
          </span>
        </div>

        <div className="scroll-thin flex gap-1 overflow-x-auto border-b border-border px-3 py-2" role="tablist">
          {FRAMEWORKS.map((f) => (
            <button
              key={f.id} role="tab" aria-selected={fw.id === f.id}
              onClick={() => setFw(f)}
              className={`shrink-0 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors duration-150 ${
                fw.id === f.id ? 'bg-container-high font-medium text-fg' : 'text-fg-muted hover:text-fg'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          <p className="mb-3 flex items-start gap-2 text-[12.5px] text-fg-muted">
            <ICode width={14} height={14} className="mt-0.5 shrink-0 text-primary" />
            {fw.note}
          </p>
          <CopyBlock code={fw.code('', siteId, apiBase)} lang={fw.file} />
        </div>
      </section>

      {/* ---------------- optional: events & revenue ---------------- */}
      <section className="card rise overflow-hidden" style={{ animationDelay: '140ms' }}>
        <button
          onClick={() => setAdvanced((a) => !a)}
          aria-expanded={advanced}
          className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors hover:bg-container-high"
        >
          <span>
            <span className="headline-md block">Track revenue and conversions</span>
            <span className="mt-0.5 block text-[12.5px] text-fg-muted">
              Optional now, but this is what turns pageviews into attributed revenue.
            </span>
          </span>
          <IChevron
            width={16} height={16}
            className={`shrink-0 text-fg-subtle transition-transform duration-200 ${advanced ? 'rotate-180' : ''}`}
          />
        </button>
        {advanced && (
          <div className="fade space-y-4 border-t border-border p-5">
            <CopyBlock code={eventSnippet()} lang="javascript" />
            <div>
              <p className="mb-2 text-[12.5px] text-fg-muted">
                Or without writing any JavaScript — add a data attribute to any element:
              </p>
              <CopyBlock code={declarativeSnippet()} lang="html" />
            </div>
            <p className="flex items-start gap-2 rounded-md border border-border bg-surface-low p-3 text-[12.5px] text-fg-muted">
              <ISpark width={14} height={14} className="mt-0.5 shrink-0 text-primary" />
              <span>
                <strong className="text-fg">Why identify() matters.</strong> It attaches an email to
                the anonymous visitor you already have — so the pages they read weeks before signing
                up stay attached to them. That history is what makes the Customers page useful.
              </span>
            </p>
          </div>
        )}
      </section>

      {/* ---------------- troubleshooting ---------------- */}
      {!connected && elapsed > 25 && (
        <section className="card fade overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
            <IWarn width={15} height={15} className="text-[color:var(--c-warn)]" />
            <h2 className="headline-md">Not seeing anything yet?</h2>
          </div>
          <div className="divide-y divide-border">
            {TROUBLE.map((t, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenHelp(openHelp === i ? null : i)}
                  aria-expanded={openHelp === i}
                  className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left text-[13px] transition-colors hover:bg-container-high"
                >
                  {t.q}
                  <IChevron width={14} height={14}
                    className={`shrink-0 text-fg-subtle transition-transform duration-200 ${openHelp === i ? 'rotate-180' : ''}`} />
                </button>
                {openHelp === i && (
                  <p className="fade px-5 pb-4 text-[12.5px] leading-6 text-fg-muted">{t.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between gap-3 pb-8">
        <span className="flex items-center gap-1.5 text-[12px] text-fg-subtle">
          <IClock width={13} height={13} />
          {connected ? 'Setup complete' : 'Checking every few seconds'}
        </span>
        <button className="btn btn-ghost" onClick={() => { router.push('/overview'); router.refresh(); }}>
          <IBolt width={13} height={13} /> Skip for now
        </button>
      </div>
    </div>
  );
}
