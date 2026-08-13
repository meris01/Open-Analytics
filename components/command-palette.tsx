'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IGrid, IChart, IMoney, IUsers, IShare, IDoc, IFilter, IFlag, ISearch,
  IBolt, IBot, IGear, ISun, IMoon, IPlus, ILogout, ICal, IDownload,
} from './icons';
import { SiteMark } from './brand';
import type { Site } from '@/lib/site';
import { RANGES } from '@/lib/range';

type Item = {
  id: string; label: string; hint?: string; group: string;
  Icon?: React.ComponentType<{ width?: number; height?: number; className?: string }>;
  node?: React.ReactNode;
  run: () => void;
};

/** ⌘K palette. Jumping between 12 pages and N sites with the mouse gets old
 *  fast; this is the difference between a dashboard and a tool. */
export function CommandPalette({ sites, current }: { sites: Site[]; current: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    if (open) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 20); }
  }, [open]);

  const go = (href: string) => () => { setOpen(false); router.push(href); };

  const items = useMemo<Item[]>(() => {
    const nav: Item[] = [
      ['/overview', 'Overview', IGrid], ['/analytics', 'Analytics', IChart],
      ['/revenue', 'Revenue', IMoney], ['/customers', 'Customers', IUsers],
      ['/sources', 'Sources', IShare], ['/pages', 'Pages', IDoc],
      ['/funnels', 'Funnels', IFilter], ['/goals', 'Goals', IFlag],
      ['/seo', 'SEO', ISearch], ['/real-time', 'Real-time', IBolt],
      ['/ai-analyst', 'AI Analyst', IBot], ['/settings', 'Settings', IGear],
    ].map(([href, label, Icon]) => ({
      id: `nav${href}`, label: label as string, group: 'Go to',
      Icon: Icon as Item['Icon'], run: go(href as string),
    }));

    const siteItems: Item[] = sites.map((s) => ({
      id: `site-${s.id}`, label: s.domain, group: 'Switch website',
      hint: s.public_id === current ? 'current' : `${s.events.toLocaleString()} events`,
      node: <SiteMark domain={s.domain} size={16} />,
      run: async () => {
        setOpen(false);
        await fetch('/api/sites', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'switch', site: s.public_id }),
        });
        router.refresh();
      },
    }));

    const ranges: Item[] = RANGES.map((r) => ({
      id: `range-${r.key}`, label: r.label, group: 'Date range', Icon: ICal,
      run: () => { setOpen(false); router.push(`${location.pathname}?range=${r.key}`); },
    }));

    const actions: Item[] = [
      { id: 'add-site', label: 'Add a website', group: 'Actions', Icon: IPlus, run: go('/welcome?add=1') },
      { id: 'export', label: 'Export sources as CSV', group: 'Actions', Icon: IDownload,
        run: () => { setOpen(false); location.href = '/api/export?what=sources'; } },
      { id: 'theme', label: 'Toggle light / dark theme', group: 'Actions', Icon: ISun,
        run: () => {
          const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
          document.documentElement.dataset.theme = next;
          try { localStorage.setItem('oa-theme', next); } catch {}
          setOpen(false);
        } },
      { id: 'signout', label: 'Sign out', group: 'Actions', Icon: ILogout,
        run: () => {
          const f = document.createElement('form');
          f.method = 'post'; f.action = '/auth/signout';
          document.body.appendChild(f); f.submit();
        } },
    ];

    return [...nav, ...siteItems, ...ranges, ...actions];
  }, [sites, current, router]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((i) =>
      i.label.toLowerCase().includes(needle) || i.group.toLowerCase().includes(needle));
  }, [items, q]);

  useEffect(() => { setSel(0); }, [q]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
      if (e.key === 'Enter')     { e.preventDefault(); filtered[sel]?.run(); }
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, filtered, sel]);

  useEffect(() => {
    listRef.current?.querySelector('[data-sel="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  if (!open) return null;

  let lastGroup = '';
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[12vh]"
         role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="fade absolute inset-0 bg-black/55 backdrop-blur-[3px]" onClick={() => setOpen(false)} />
      <div className="rise relative w-full max-w-[540px] overflow-hidden rounded-xl border border-border bg-container"
           style={{ boxShadow: 'var(--shadow-overlay)' }}>
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <ISearch width={15} height={15} className="shrink-0 text-fg-subtle" />
          <input
            ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to a page, switch website, change range…"
            aria-label="Search commands"
            className="h-12 flex-1 bg-transparent text-[14px] outline-none placeholder:text-fg-subtle"
          />
          <kbd className="hidden shrink-0 rounded border border-border bg-container-high px-1.5 py-0.5 text-[10px] text-fg-subtle sm:block">ESC</kbd>
        </div>

        <div ref={listRef} className="scroll-thin max-h-[52vh] overflow-y-auto p-1.5">
          {filtered.length === 0 && (
            <p className="px-3 py-8 text-center text-[13px] text-fg-subtle">Nothing matches “{q}”.</p>
          )}
          {filtered.map((item, i) => {
            const header = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {header && <p className="label-caps px-2.5 pb-1 pt-2.5 text-fg-subtle">{header}</p>}
                <button
                  data-sel={i === sel}
                  onMouseEnter={() => setSel(i)}
                  onClick={item.run}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors ${
                    i === sel ? 'bg-primary-soft text-primary' : 'text-fg-muted hover:bg-container-high'
                  }`}
                >
                  {item.node ?? (item.Icon ? <item.Icon width={14} height={14} /> : null)}
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="shrink-0 text-[11px] text-fg-subtle">{item.hint}</span>}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-fg-subtle">
          <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
          <span className="flex items-center gap-1"><Kbd>↵</Kbd> open</span>
          <span className="ml-auto flex items-center gap-1"><Kbd>⌘</Kbd><Kbd>K</Kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-border bg-container-high px-1 text-[10px]">
      {children}
    </kbd>
  );
}
