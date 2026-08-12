import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'OpenAnalytics — where is my revenue coming from?',
    template: '%s · OpenAnalytics',
  },
  description:
    'Free, open-source, privacy-first website analytics with revenue attribution. Self-hostable, cookieless, no consent banner required.',
  applicationName: 'OpenAnalytics',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'OpenAnalytics',
    description: 'Privacy-first analytics that shows you where your revenue comes from.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#12131a' },
    { media: '(prefers-color-scheme: light)', color: '#f7f7f8' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const THEME_BOOT = `(function(){try{var t=localStorage.getItem('oa-theme');
document.documentElement.dataset.theme=(t==='light'||t==='dark')?t:'dark';}catch(e){
document.documentElement.dataset.theme='dark'}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
