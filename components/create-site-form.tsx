'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IWarn, IChevronR, ISpark } from './icons';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'BRL', 'SEK', 'CHF'];

export function CreateSiteForm({ isFirst }: { isFirst: boolean }) {
  const router = useRouter();
  const [domain, setDomain] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleaned = domain.trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  const valid = /^[a-z0-9]([a-z0-9\-.]*[a-z0-9])?\.[a-z]{2,}$/.test(cleaned);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ domain: cleaned, currency, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not create the site');
      router.push(`/welcome/install?site=${json.public_id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  async function claimDemo() {
    setDemoBusy(true); setError(null);
    try {
      const res = await fetch('/api/sites', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'claim-demo' }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? 'Demo data is not available');
      router.push('/overview');
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setDemoBusy(false);
    }
  }

  return (
    <div className="card rise p-6" style={{ animationDelay: '120ms' }}>
      <form onSubmit={create} className="space-y-4">
        <label className="block">
          <span className="label-caps mb-1.5 block text-fg-subtle">Website domain</span>
          <div className="flex items-center gap-2">
            <span className="data-mono select-none text-[13px] text-fg-subtle">https://</span>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              autoFocus
              autoCapitalize="off" autoCorrect="off" spellCheck={false}
              className="input h-10 flex-1 data-mono"
              aria-describedby="domain-hint"
            />
          </div>
          <p id="domain-hint" className="mt-1.5 text-[12px] text-fg-subtle">
            Just the domain — no https://, no path. Subdomains are tracked automatically.
          </p>
        </label>

        <label className="block">
          <span className="label-caps mb-1.5 block text-fg-subtle">Reporting currency</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input h-10 w-full">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-md bg-danger-soft p-2.5 text-[12.5px] text-danger">
            <IWarn width={14} height={14} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}

        <button type="submit" disabled={!valid || busy} className="btn btn-primary !h-10 w-full justify-center">
          {busy ? 'Creating…' : <>Continue <IChevronR width={14} height={14} /></>}
        </button>
      </form>

      {isFirst && (
        <>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11.5px] text-fg-subtle">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <button onClick={claimDemo} disabled={demoBusy} className="btn w-full justify-center">
            <ISpark width={14} height={14} className="text-primary" />
            {demoBusy ? 'Loading…' : 'Explore with sample data first'}
          </button>
          <p className="mt-2 text-center text-[11.5px] text-fg-subtle">
            Two months of realistic traffic and revenue, so you can see what the product does before wiring it up.
          </p>
        </>
      )}
    </div>
  );
}
