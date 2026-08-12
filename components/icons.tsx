import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const, ...p,
});

export const IGrid = (p: P) => (<svg {...base(p)}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>);
export const IChart = (p: P) => (<svg {...base(p)}><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m7 15 4-4 3 3 5-6"/></svg>);
export const IMoney = (p: P) => (<svg {...base(p)}><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/></svg>);
export const IUsers = (p: P) => (<svg {...base(p)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
export const IShare = (p: P) => (<svg {...base(p)}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>);
export const IDoc = (p: P) => (<svg {...base(p)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></svg>);
export const IFilter = (p: P) => (<svg {...base(p)}><path d="M3 5h18l-7 8v6l-4 2v-8z"/></svg>);
export const IFlag = (p: P) => (<svg {...base(p)}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></svg>);
export const ISearch = (p: P) => (<svg {...base(p)}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>);
export const IBolt = (p: P) => (<svg {...base(p)}><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>);
export const IBot = (p: P) => (<svg {...base(p)}><rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 8V4M8 14h.01M16 14h.01M9 18h6"/><circle cx="12" cy="3" r="1.5"/></svg>);
export const IGear = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.3 15H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.4 8.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4.6V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>);
export const IBook = (p: P) => (<svg {...base(p)}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>);
export const ICode = (p: P) => (<svg {...base(p)}><path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/></svg>);
export const IUp = (p: P) => (<svg {...base(p)}><path d="m4 16 6-6 4 4 6-7"/><path d="M15 7h5v5"/></svg>);
export const IDown = (p: P) => (<svg {...base(p)}><path d="m4 8 6 6 4-4 6 7"/><path d="M15 17h5v-5"/></svg>);
export const ICal = (p: P) => (<svg {...base(p)}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>);
export const IChevron = (p: P) => (<svg {...base(p)}><path d="m6 9 6 6 6-6"/></svg>);
export const IChevronR = (p: P) => (<svg {...base(p)}><path d="m9 6 6 6-6 6"/></svg>);
export const IChevronL = (p: P) => (<svg {...base(p)}><path d="m15 6-6 6 6 6"/></svg>);
export const IClose = (p: P) => (<svg {...base(p)}><path d="M18 6 6 18M6 6l12 12"/></svg>);
export const ISun = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>);
export const IMoon = (p: P) => (<svg {...base(p)}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>);
export const IDownload = (p: P) => (<svg {...base(p)}><path d="M12 3v12M7 11l5 5 5-5M4 21h16"/></svg>);
export const IClock = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>);
export const IGlobe = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/></svg>);
export const IDesktop = (p: P) => (<svg {...base(p)}><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>);
export const IMobile = (p: P) => (<svg {...base(p)}><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>);
export const ILink = (p: P) => (<svg {...base(p)}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"/></svg>);
export const ICheck = (p: P) => (<svg {...base(p)}><path d="m4 12 5 5L20 6"/></svg>);
export const IWarn = (p: P) => (<svg {...base(p)}><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>);
export const ISend = (p: P) => (<svg {...base(p)}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>);
export const ISpark = (p: P) => (<svg {...base(p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>);
export const IRoute = (p: P) => (<svg {...base(p)}><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h5a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h5"/></svg>);
export const ILogo = (p: P) => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none" {...p}>
    <rect width="32" height="32" rx="8" fill="var(--c-primary-strong)" />
    <path d="M8 22V16M14 22V10M20 22V14M26 22V7" stroke="var(--c-on-primary)" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

export const IMenu = (p: P) => (<svg {...base(p)}><path d="M3 6h18M3 12h18M3 18h18"/></svg>);
export const IPlus = (p: P) => (<svg {...base(p)}><path d="M12 5v14M5 12h14"/></svg>);
export const ILogout = (p: P) => (<svg {...base(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/></svg>);
export const ITrash = (p: P) => (<svg {...base(p)}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>);
export const IEdit = (p: P) => (<svg {...base(p)}><path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6"/><path d="M18.4 2.6a2 2 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>);
export const ICopy = (p: P) => (<svg {...base(p)}><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>);
export const IEye = (p: P) => (<svg {...base(p)}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>);
