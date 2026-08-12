'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { browserClient } from '@/lib/supabase-browser';
import { ICheck, IWarn } from './icons';

type Mode = 'signin' | 'signup';

export function AuthForm({ next, initialError }: { next?: string; initialError?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const supabase = browserClient();

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next || '/')}` },
        });
        if (error) throw error;
        if (data.session) {
          router.push(next || '/');
          router.refresh();
        } else {
          setNotice('Check your inbox to confirm your address, then sign in.');
          setMode('signin');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next || '/');
        router.refresh();
      }
    } catch (err) {
      const m = (err as Error).message || 'Something went wrong';
      setError(
        /invalid login/i.test(m) ? 'That email and password combination is not recognised.'
        : /already registered/i.test(m) ? 'That email already has an account — sign in instead.'
        : /password should be/i.test(m) ? 'Password must be at least 6 characters.'
        : m,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card rise p-6" style={{ animationDelay: '80ms' }}>
      <div className="mb-5 flex rounded-md border border-border bg-bg p-0.5" role="tablist">
        {(['signin', 'signup'] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => { setMode(m); setError(null); setNotice(null); }}
            className={`flex-1 rounded px-3 py-1.5 text-[13px] transition-colors duration-150 ${
              mode === m ? 'bg-container-high font-medium text-fg' : 'text-fg-muted hover:text-fg'
            }`}
          >
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="label-caps mb-1.5 block text-fg-subtle">Email</span>
          <input
            type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="input h-10 w-full"
          />
        </label>
        <label className="block">
          <span className="label-caps mb-1.5 block text-fg-subtle">Password</span>
          <input
            type="password" required minLength={6}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
            className="input h-10 w-full"
          />
        </label>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-md bg-danger-soft p-2.5 text-[12.5px] text-danger">
            <IWarn width={14} height={14} className="mt-0.5 shrink-0" /> {error}
          </p>
        )}
        {notice && (
          <p className="flex items-start gap-2 rounded-md bg-primary-soft p-2.5 text-[12.5px] text-primary">
            <ICheck width={14} height={14} className="mt-0.5 shrink-0" /> {notice}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn btn-primary !h-10 w-full justify-center">
          {busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
