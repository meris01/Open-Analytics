'use client';

import { useState } from 'react';
import { IDownload, ICheck } from './icons';

export function ExportButton({
  what, range, label = 'Export CSV', model,
}: { what: string; range?: string; label?: string; model?: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');

  async function run() {
    if (state === 'busy') return;
    setState('busy');
    try {
      const qs = new URLSearchParams({ what, ...(range ? { range } : {}), ...(model ? { model } : {}) });
      const res = await fetch(`/api/export?${qs}`);
      if (!res.ok) throw new Error('export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('content-disposition')?.match(/filename="(.+?)"/)?.[1] ?? `${what}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setState('done');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('idle');
    }
  }

  return (
    <button className="btn" onClick={run} disabled={state === 'busy'}>
      {state === 'done' ? <ICheck width={14} height={14} className="text-primary" /> : <IDownload width={14} height={14} />}
      {state === 'busy' ? 'Preparing…' : state === 'done' ? 'Downloaded' : label}
    </button>
  );
}
