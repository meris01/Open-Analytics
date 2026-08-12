'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Badge } from './ui';
import { IPlus, ITrash, IEdit, IWarn, ICheck, IFlag, IFilter } from './icons';

type Goal = { id: string; name: string; match_type: string; match_value: string; value: number };
type Step = { name: string; type: string; value: string };
type Funnel = { id: string; name: string; steps: Step[] };
type SiteInfo = { public_id: string; domain: string; name: string; currency: string; timezone: string };

const MATCH_TYPES = [
  { v: 'event', l: 'Event name', hint: 'Matches oa("track", "…") or oa("goal", "…")' },
  { v: 'path', l: 'Exact path', hint: 'e.g. /pricing' },
  { v: 'path_prefix', l: 'Path starts with', hint: 'e.g. /blog/' },
];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'BRL', 'SEK', 'CHF'];

function useApi() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(url: string, body: unknown) {
    setBusy(true); setError(null);
    try {
      const res = await fetch(url, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.error) throw new Error(json.error ?? 'Request failed');
      router.refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { call, error, busy, setError };
}

function ErrorLine({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <p role="alert" className="mt-3 flex items-start gap-2 rounded-md bg-danger-soft p-2.5 text-[12.5px] text-danger">
      <IWarn width={14} height={14} className="mt-0.5 shrink-0" /> {msg}
    </p>
  );
}

/* --------------------------------- GOALS --------------------------------- */
function Goals({ site, goals }: { site: string; goals: Goal[] }) {
  const { call, error, busy } = useApi();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState({ name: '', match_type: 'event', match_value: '', value: '0' });

  const open = (g?: Goal) => {
    if (g) { setEditing(g); setForm({ name: g.name, match_type: g.match_type, match_value: g.match_value, value: String(g.value) }); }
    else { setEditing(null); setForm({ name: '', match_type: 'event', match_value: '', value: '0' }); }
    setAdding(true);
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const ok = await call('/api/goals', {
      site, id: editing?.id, name: form.name, match_type: form.match_type,
      match_value: form.match_value, value: Number(form.value) || 0,
    });
    if (ok) setAdding(false);
  }

  return (
    <Card
      title="Goals" sub="Named outcomes you want to count"
      action={<button className="btn" onClick={() => open()}><IPlus width={13} height={13} /> New goal</button>}
      pad={false}
    >
      <div className="divide-y divide-border">
        {goals.length === 0 && (
          <p className="px-5 py-8 text-center text-[13px] text-fg-subtle">
            No goals yet. Add one to start measuring conversions.
          </p>
        )}
        {goals.map((g) => (
          <div key={g.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <IFlag width={14} height={14} className="shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate text-[13px]">{g.name}</span>
                <span className="data-mono block truncate text-[11.5px] text-fg-subtle">
                  {g.match_type}: {g.match_value}
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <button className="btn btn-ghost !h-7 !w-7 !px-0 justify-center" onClick={() => open(g)}
                      aria-label={`Edit ${g.name}`}><IEdit width={13} height={13} /></button>
              <button className="btn btn-ghost !h-7 !w-7 !px-0 justify-center hover:!text-[color:var(--c-danger)]"
                      disabled={busy}
                      onClick={() => confirm(`Delete the goal "${g.name}"? Historic events are kept.`)
                        && call('/api/goals', { action: 'delete', id: g.id })}
                      aria-label={`Delete ${g.name}`}><ITrash width={13} height={13} /></button>
            </span>
          </div>
        ))}
      </div>

      {adding && (
        <form onSubmit={save} className="fade space-y-3 border-t border-border bg-surface-low p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label-caps mb-1.5 block text-fg-subtle">Goal name</span>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                     placeholder="Trial started" className="input h-9 w-full" />
            </label>
            <label className="block">
              <span className="label-caps mb-1.5 block text-fg-subtle">Match on</span>
              <select value={form.match_type} onChange={(e) => setForm({ ...form, match_type: e.target.value })}
                      className="input h-9 w-full">
                {MATCH_TYPES.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="label-caps mb-1.5 block text-fg-subtle">Value to match</span>
            <input required value={form.match_value} onChange={(e) => setForm({ ...form, match_value: e.target.value })}
                   placeholder={form.match_type === 'event' ? 'trial_started' : '/pricing'}
                   className="input h-9 w-full data-mono" />
            <span className="mt-1.5 block text-[11.5px] text-fg-subtle">
              {MATCH_TYPES.find((m) => m.v === form.match_type)?.hint}
            </span>
          </label>
          <ErrorLine msg={error} />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create goal'}
            </button>
            <button type="button" className="btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      )}
    </Card>
  );
}

/* -------------------------------- FUNNELS -------------------------------- */
function Funnels({ site, funnels }: { site: string; funnels: Funnel[] }) {
  const { call, error, busy } = useApi();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Funnel | null>(null);
  const [name, setName] = useState('');
  const [steps, setSteps] = useState<Step[]>([
    { name: 'Landed', type: 'path_prefix', value: '/' },
    { name: 'Converted', type: 'event', value: 'purchase' },
  ]);

  const open = (f?: Funnel) => {
    if (f) {
      setEditing(f); setName(f.name);
      setSteps(f.steps?.length >= 2 ? f.steps : [
        { name: 'Landed', type: 'path_prefix', value: '/' },
        { name: 'Converted', type: 'event', value: 'purchase' }]);
    }
    else {
      setEditing(null); setName('');
      setSteps([{ name: 'Landed', type: 'path_prefix', value: '/' },
                { name: 'Converted', type: 'event', value: 'purchase' }]);
    }
    setAdding(true);
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const ok = await call('/api/funnels', { site, id: editing?.id, name, steps });
    if (ok) setAdding(false);
  }

  const setStep = (i: number, patch: Partial<Step>) =>
    setSteps(steps.map((s, j) => (i === j ? { ...s, ...patch } : s)));

  return (
    <Card
      title="Funnels" sub="Ordered steps you want people to complete"
      action={<button className="btn" onClick={() => open()}><IPlus width={13} height={13} /> New funnel</button>}
      pad={false}
    >
      <div className="divide-y divide-border">
        {funnels.length === 0 && (
          <p className="px-5 py-8 text-center text-[13px] text-fg-subtle">No funnels defined yet.</p>
        )}
        {funnels.map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-3 px-5 py-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <IFilter width={14} height={14} className="shrink-0 text-primary" />
              <span className="min-w-0">
                <span className="block truncate text-[13px]">{f.name}</span>
                <span className="mt-0.5 flex flex-wrap gap-1">
                  {(f.steps ?? []).map((s, i) => <Badge key={i}>{s.name}</Badge>)}
                </span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <button className="btn btn-ghost !h-7 !w-7 !px-0 justify-center" onClick={() => open(f)}
                      aria-label={`Edit ${f.name}`}><IEdit width={13} height={13} /></button>
              <button className="btn btn-ghost !h-7 !w-7 !px-0 justify-center hover:!text-[color:var(--c-danger)]"
                      disabled={busy}
                      onClick={() => confirm(`Delete the funnel "${f.name}"?`)
                        && call('/api/funnels', { action: 'delete', id: f.id })}
                      aria-label={`Delete ${f.name}`}><ITrash width={13} height={13} /></button>
            </span>
          </div>
        ))}
      </div>

      {adding && (
        <form onSubmit={save} className="fade space-y-3 border-t border-border bg-surface-low p-5">
          <label className="block">
            <span className="label-caps mb-1.5 block text-fg-subtle">Funnel name</span>
            <input required value={name} onChange={(e) => setName(e.target.value)}
                   placeholder="Checkout flow" className="input h-9 w-full" />
          </label>
          <div className="space-y-2">
            <span className="label-caps block text-fg-subtle">Steps (in order)</span>
            {steps.map((s, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_140px_1fr_32px]">
                <input required value={s.name} onChange={(e) => setStep(i, { name: e.target.value })}
                       placeholder="Step name" className="input h-9 w-full" aria-label={`Step ${i + 1} name`} />
                <select value={s.type} onChange={(e) => setStep(i, { type: e.target.value })}
                        className="input h-9 w-full" aria-label={`Step ${i + 1} match type`}>
                  {MATCH_TYPES.map((m) => <option key={m.v} value={m.v}>{m.l}</option>)}
                </select>
                <input required value={s.value} onChange={(e) => setStep(i, { value: e.target.value })}
                       placeholder="value" className="input h-9 w-full data-mono" aria-label={`Step ${i + 1} value`} />
                <button type="button" disabled={steps.length <= 2}
                        onClick={() => setSteps(steps.filter((_, j) => j !== i))}
                        className="btn btn-ghost !h-9 !w-8 !px-0 justify-center disabled:opacity-30"
                        aria-label={`Remove step ${i + 1}`}>
                  <ITrash width={13} height={13} />
                </button>
              </div>
            ))}
            <button type="button" className="btn !h-8"
                    onClick={() => setSteps([...steps, { name: '', type: 'event', value: '' }])}>
              <IPlus width={12} height={12} /> Add step
            </button>
          </div>
          <ErrorLine msg={error} />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create funnel'}
            </button>
            <button type="button" className="btn" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </form>
      )}
    </Card>
  );
}

/* ------------------------------ SITE DETAILS ----------------------------- */
function SiteDetails({ site, siteCount }: { site: SiteInfo; siteCount: number }) {
  const router = useRouter();
  const { call, error, busy } = useApi();
  const [name, setName] = useState(site.name);
  const [currency, setCurrency] = useState(site.currency);
  const [saved, setSaved] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [danger, setDanger] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/sites/update', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ site: site.public_id, name, currency }),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); router.refresh(); }
  }

  async function remove() {
    const res = await fetch('/api/sites/update', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'delete', site: site.public_id }),
    });
    if (res.ok) { router.push('/'); router.refresh(); }
  }

  return (
    <Card title="Website" sub="Display name and reporting currency">
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label-caps mb-1.5 block text-fg-subtle">Display name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input h-9 w-full" />
        </label>
        <label className="block">
          <span className="label-caps mb-1.5 block text-fg-subtle">Currency</span>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input h-9 w-full">
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <div className="sm:col-span-2">
          <button className="btn btn-primary" disabled={busy}>
            {saved ? <><ICheck width={13} height={13} /> Saved</> : 'Save changes'}
          </button>
        </div>
      </form>
      <ErrorLine msg={error} />

      <div className="mt-6 rounded-md border border-[color:var(--c-danger)]/25 p-4">
        <p className="text-[13px] font-medium">Delete this website</p>
        <p className="mt-1 text-[12.5px] text-fg-muted">
          Permanently removes {site.domain} and every visitor, session and event recorded for it.
          {siteCount === 1 && ' This is your only website — you will be sent back to onboarding.'}
        </p>
        {!danger ? (
          <button className="btn mt-3 !text-[color:var(--c-danger)]" onClick={() => setDanger(true)}>
            <ITrash width={13} height={13} /> Delete website
          </button>
        ) : (
          <div className="fade mt-3 space-y-2">
            <p className="text-[12.5px] text-fg-muted">
              Type <code className="data-mono rounded bg-container-high px-1">{site.domain}</code> to confirm.
            </p>
            <div className="flex flex-wrap gap-2">
              <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
                     className="input h-9 flex-1 data-mono" aria-label="Confirm domain" />
              <button className="btn !bg-[color:var(--c-danger)] !text-white !border-transparent"
                      disabled={confirmText !== site.domain} onClick={remove}>
                Delete permanently
              </button>
              <button className="btn" onClick={() => { setDanger(false); setConfirmText(''); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export function SettingsPanels({
  site, siteCount, goals, funnels,
}: { site: SiteInfo; siteCount: number; goals: Goal[]; funnels: Funnel[] }) {
  return (
    <>
      <Goals site={site.public_id} goals={goals} />
      <Funnels site={site.public_id} funnels={funnels} />
      <SiteDetails site={site} siteCount={siteCount} />
    </>
  );
}
