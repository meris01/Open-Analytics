'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ICheck, IWarn, IClose, ISpark } from './icons';

type Kind = 'success' | 'error' | 'info';
type Toast = { id: number; kind: Kind; title: string; body?: string };

const Ctx = createContext<{
  push: (t: Omit<Toast, 'id'>) => void;
  confirm: (opts: { title: string; body?: string; confirmLabel?: string; danger?: boolean }) => Promise<boolean>;
}>({ push: () => {}, confirm: async () => false });

export const useToast = () => useContext(Ctx);

let seq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [ask, setAsk] = useState<
    | { title: string; body?: string; confirmLabel?: string; danger?: boolean; resolve: (v: boolean) => void }
    | null
  >(null);

  const push = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++seq;
    setToasts((all) => [...all, { ...t, id }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), 4200);
  }, []);

  const confirm = useCallback(
    (opts: { title: string; body?: string; confirmLabel?: string; danger?: boolean }) =>
      new Promise<boolean>((resolve) => setAsk({ ...opts, resolve })),
    [],
  );

  useEffect(() => {
    if (!ask) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { ask.resolve(false); setAsk(null); }
      if (e.key === 'Enter')  { ask.resolve(true);  setAsk(null); }
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [ask]);

  const icon = (k: Kind) =>
    k === 'success' ? <ICheck width={14} height={14} />
    : k === 'error' ? <IWarn width={14} height={14} />
    : <ISpark width={14} height={14} />;

  return (
    <Ctx.Provider value={{ push, confirm }}>
      {children}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id} role="status"
            className="toast-in pointer-events-auto flex items-start gap-2.5 rounded-lg border border-border bg-container p-3"
            style={{ boxShadow: 'var(--shadow-overlay)' }}
          >
            <span className={`mt-0.5 shrink-0 ${
              t.kind === 'success' ? 'text-primary' : t.kind === 'error' ? 'text-danger' : 'text-fg-muted'
            }`}>{icon(t.kind)}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-medium">{t.title}</span>
              {t.body && <span className="mt-0.5 block text-[12px] text-fg-muted">{t.body}</span>}
            </span>
            <button
              onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
              className="shrink-0 rounded p-0.5 text-fg-subtle transition-colors hover:text-fg"
              aria-label="Dismiss"
            >
              <IClose width={13} height={13} />
            </button>
          </div>
        ))}
      </div>

      {ask && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-5"
             role="dialog" aria-modal="true" aria-label={ask.title}>
          <div className="fade absolute inset-0 bg-black/55 backdrop-blur-[2px]"
               onClick={() => { ask.resolve(false); setAsk(null); }} />
          <div className="rise relative w-full max-w-[400px] rounded-xl border border-border bg-container p-5"
               style={{ boxShadow: 'var(--shadow-overlay)' }}>
            <h2 className="headline-md">{ask.title}</h2>
            {ask.body && <p className="mt-2 text-[13px] leading-6 text-fg-muted">{ask.body}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn" onClick={() => { ask.resolve(false); setAsk(null); }} autoFocus>
                Cancel
              </button>
              <button
                className={`btn ${ask.danger ? '!border-transparent !bg-[color:var(--c-danger)] !text-white' : 'btn-primary'}`}
                onClick={() => { ask.resolve(true); setAsk(null); }}
              >
                {ask.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
