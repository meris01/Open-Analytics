'use client';

import { useState } from 'react';
import { ICheck } from './icons';

export function CopyBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative overflow-hidden rounded-md border border-border bg-surface-low">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="label-caps text-fg-subtle">{lang ?? 'code'}</span>
        <button
          className="btn btn-ghost !h-6 !px-2 text-[11.5px]"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            } catch {}
          }}
        >
          {copied ? <><ICheck width={11} height={11} /> Copied</> : 'Copy'}
        </button>
      </div>
      <pre className="scroll-thin overflow-x-auto p-3.5">
        <code className="data-mono text-[12.5px] leading-5">{code}</code>
      </pre>
    </div>
  );
}
