'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  IGrid, IChart, IMoney, IUsers, IShare, IDoc, IFilter, IFlag, ISearch,
  IBolt, IBot, IGear, IBook, ICode, ICal, IChevron, ISun, IMoon, ILogo,
  IClose, ICheck, IMenu, IPlus, ILogout,
} from './icons';
import { RANGES } from '@/lib/range';
import type { Site } from '@/lib/site';
import { SiteMark } from './brand';
import { CommandPalette } from './command-palette';
import { ToastProvider } from './toast';

const NAV_GROUPS: { title: string; items: { href: string; label: string; Icon: typeof IGrid; accent?: boolean }[] }[] = [
  {
    title: 'Measure',
    items: [
      { href: '/overview', label: 'Overview', Icon: IGrid },
      { href: '/analytics', label: 'Analytics', Icon: IChart },
      { href: '/real-time', label: 'Real-time', Icon: IBolt },
    ],
  },
  {
    title: 'Money',
    items: [
      { href: '/revenue', label: 'Revenue', Icon: IMoney },
      { href: '/customers', label: 'Customers', Icon: IUsers },
      { href: '/funnels', label: 'Funnels', Icon: IFilter },
      { href: '/goals', label: 'Goals', Icon: IFlag },
    ],
  },
  {
    title: 'Acquisition',
    items: [
      { href: '/sources', label: 'Sources', Icon: IShare },
      { href: '/pages', label: 'Pages', Icon: IDoc },
      { href: '/seo', label: 'SEO', Icon: ISearch },
    ],
  },
  {
    title: 'Intelligence',
    items: [{ href: '/ai-analyst', label: 'AI Analyst', Icon: IBot, accent: true }],
  },
];

function useDismiss(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', click);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', click);
      document.removeEventListener('keydown', key);
    };
  }, [onClose]);
  return ref;
}

/* ------------------------------- SIDEBAR --------------------------------- */
export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const path = usePathname();
  const sp = useSearchParams();
  const q = sp.get('range') ? `?range=${sp.get('range')}` : '';

  const body = (drawer: boolean) => (
    <>
      <div className="flex h-16 items-center justify-between gap-2.5 px-5">
        <Link href="/overview" className="flex items-center gap-2.5 rounded focus-ring">
          <ILogo />
          <span className="text-[15px] font-semibold tracking-[-0.02em]">OpenAnalytics</span>
        </Link>
        {drawer && (
          <button onClick={onClose} className="btn btn-ghost !h-8 !w-8 !px-0 justify-center"
                  aria-label="Close navigation">
            <IClose width={15} height={15} />
          </button>
        )}
      </div>

      <nav className="scroll-thin flex-1 space-y-4 overflow-y-auto px-3 pb-3" aria-label="Main">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="label-caps px-2.5 pb-1.5 text-fg-subtle/80">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, Icon, accent }) => {
                const active = path === href;
                return (
                  <Link
                    key={href} href={href + q} onClick={drawer ? onClose : undefined}
                    aria-current={active ? 'page' : undefined}
                    className={`focus-ring group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors duration-150 ${
                      active ? 'bg-primary-soft font-medium text-primary'
                             : 'text-fg-muted hover:bg-container-high hover:text-fg'
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-y-1.5 -left-3 w-[3px] rounded-r-full bg-primary" aria-hidden />
                    )}
                    <Icon width={15} height={15} className={accent && !active ? 'text-primary/80' : ''} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t border-border px-3 py-3">
        {[
          { href: '/settings', label: 'Settings', Icon: IGear },
          { href: '/settings#install', label: 'Install & docs', Icon: IBook },
          { href: 'https://github.com', label: 'GitHub', Icon: ICode, external: true },
        ].map(({ href, label, Icon, external }) => (
          <Link
            key={label} href={href} onClick={drawer ? onClose : undefined}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
            className="focus-ring flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] text-fg-muted transition-colors duration-150 hover:bg-container-high hover:text-fg"
          >
            <Icon width={15} height={15} />
            {label}
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <>
      <aside className="fixed left-0 top-0 z-50 hidden h-full w-[236px] flex-col border-r border-border bg-surface lg:flex">
        {body(false)}
      </aside>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="fade absolute inset-0 bg-black/50" onClick={onClose} />
          <aside className="absolute left-0 top-0 flex h-full w-[260px] flex-col border-r border-border bg-surface"
                 style={{ animation: 'slideIn 220ms var(--ease-oil)' }}>
            {body(true)}
          </aside>
        </div>
      )}
    </>
  );
}

/* ----------------------------- THEME TOGGLE ------------------------------ */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  useEffect(() => {
    setTheme((document.documentElement.dataset.theme as 'dark' | 'light') || 'dark');
  }, []);
  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('oa-theme', next); } catch {}
    setTheme(next);
  }
  return (
    <button onClick={toggle} className="btn btn-ghost !h-8 !w-8 !px-0 justify-center"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
      {theme === 'dark' ? <ISun width={15} height={15} /> : <IMoon width={15} height={15} />}
    </button>
  );
}

/* ----------------------------- RANGE PICKER ------------------------------ */
export function RangePicker() {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const cur = sp.get('range') ?? '30d';
  const [open, setOpen] = useState(false);
  const ref = useDismiss(() => setOpen(false));
  const label = RANGES.find((r) => r.key === cur)?.label ?? 'Last 30 days';

  return (
    <div className="relative" ref={ref}>
      <button className="btn" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}>
        <ICal width={14} height={14} className="text-fg-subtle" />
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">{cur}</span>
        <IChevron width={13} height={13} className="text-fg-subtle" />
      </button>
      {open && (
        <div role="listbox"
             className="fade absolute right-0 top-9 z-50 w-48 overflow-hidden rounded-md border border-border bg-container p-1"
             style={{ boxShadow: 'var(--shadow-overlay)' }}>
          {RANGES.map((r) => (
            <button
              key={r.key} role="option" aria-selected={r.key === cur}
              onClick={() => { setOpen(false); router.push(`${path}?range=${r.key}`); }}
              className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-[13px] transition-colors hover:bg-container-high ${
                r.key === cur ? 'text-primary' : 'text-fg-muted'
              }`}
            >
              {r.label}
              {r.key === cur && <ICheck width={12} height={12} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- SITE SWITCHER ----------------------------- */
export function SiteSwitcher({ site, sites }: { site: Site; sites: Site[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useDismiss(() => setOpen(false));

  async function pick(publicId: string) {
    if (publicId === site.public_id) return setOpen(false);
    setBusy(true);
    await fetch('/api/sites', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'switch', site: publicId }),
    });
    setOpen(false); setBusy(false);
    router.refresh();
  }

  const live = site.last_event_at
    && Date.now() - new Date(site.last_event_at).getTime() < 5 * 60_000;

  return (
    <div className="relative" ref={ref}>
      <button
        className="btn max-w-[220px]" onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox" aria-expanded={open} disabled={busy}
      >
        <SiteMark domain={site.domain} size={16} />
        <span className="truncate">{site.domain}</span>
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${live ? 'bg-primary' : 'bg-fg-subtle/60'}`}
              title={live ? 'Receiving traffic right now' : 'No traffic in the last 5 minutes'} />
        <IChevron width={13} height={13} className="shrink-0 text-fg-subtle" />
      </button>
      {open && (
        <div role="listbox"
             className="fade absolute left-0 top-9 z-50 w-[264px] overflow-hidden rounded-md border border-border bg-container p-1"
             style={{ boxShadow: 'var(--shadow-overlay)' }}>
          <p className="label-caps px-2.5 py-1.5 text-fg-subtle">Your websites</p>
          <div className="scroll-thin max-h-64 overflow-y-auto">
            {sites.map((s) => (
              <button
                key={s.id} role="option" aria-selected={s.public_id === site.public_id}
                onClick={() => pick(s.public_id)}
                className="flex w-full items-center justify-between gap-2 rounded px-2.5 py-2 text-left transition-colors hover:bg-container-high"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <SiteMark domain={s.domain} size={20} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px]">{s.domain}</span>
                    <span className="block text-[11px] text-fg-subtle tnum">
                      {s.events.toLocaleString()} events
                    </span>
                  </span>
                </span>
                {s.public_id === site.public_id && <ICheck width={13} height={13} className="shrink-0 text-primary" />}
              </button>
            ))}
          </div>
          <Link href="/welcome?add=1"
                className="mt-1 flex items-center gap-2 rounded border-t border-border px-2.5 py-2 text-[13px] text-fg-muted transition-colors hover:bg-container-high hover:text-fg">
            <IPlus width={13} height={13} /> Add a website
          </Link>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- USER MENU ------------------------------- */
export function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(() => setOpen(false));
  const initial = email[0]?.toUpperCase() ?? '?';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
        aria-label="Account menu"
        className="focus-ring flex h-8 w-8 items-center justify-center rounded-full border border-border bg-container-high text-[12px] font-semibold"
      >
        {initial}
      </button>
      {open && (
        <div role="menu"
             className="fade absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-md border border-border bg-container p-1"
             style={{ boxShadow: 'var(--shadow-overlay)' }}>
          <p className="truncate px-2.5 py-2 text-[12px] text-fg-subtle">{email}</p>
          <Link href="/settings" role="menuitem"
                className="flex items-center gap-2 rounded px-2.5 py-2 text-[13px] text-fg-muted transition-colors hover:bg-container-high hover:text-fg">
            <IGear width={13} height={13} /> Settings
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" role="menuitem"
                    className="flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[13px] text-fg-muted transition-colors hover:bg-container-high hover:text-fg">
              <ILogout width={13} height={13} /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- TOPBAR --------------------------------- */
export function Topbar({
  site, sites, email, onMenu,
}: { site: Site; sites: Site[]; email: string; onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-bg/85 px-4 backdrop-blur-xl md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button onClick={onMenu} aria-label="Open navigation"
                className="btn btn-ghost !h-8 !w-8 !px-0 justify-center lg:hidden">
          <IMenu width={16} height={16} />
        </button>
        <SiteSwitcher site={site} sites={sites} />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          className="btn hidden !text-fg-subtle md:inline-flex"
          aria-label="Open command palette"
        >
          <ISearch width={13} height={13} />
          <span className="text-[12.5px]">Search</span>
          <kbd className="ml-1 rounded border border-border bg-container-high px-1 text-[10px]">⌘K</kbd>
        </button>
        <RangePicker />
        <ThemeToggle />
        <UserMenu email={email} />
      </div>
    </header>
  );
}

/* --------------------------- LAYOUT CONTAINER ---------------------------- */
export function DashChrome({
  site, sites, email, children,
}: { site: Site; sites: Site[]; email: string; children: React.ReactNode }) {
  const [menu, setMenu] = useState(false);
  return (
    <ToastProvider>
      <div className="min-h-screen">
        <Sidebar open={menu} onClose={() => setMenu(false)} />
        <div className="lg:pl-[236px]">
          <Topbar site={site} sites={sites} email={email} onMenu={() => setMenu(true)} />
          <main className="mx-auto max-w-[1280px] px-4 py-6 md:px-10 md:py-7">
            <div className="flex flex-col gap-6 md:gap-8">{children}</div>
          </main>
        </div>
      </div>
      <CommandPalette sites={sites} current={site.public_id} />
    </ToastProvider>
  );
}
