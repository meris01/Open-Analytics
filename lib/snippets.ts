export type Framework = {
  id: string;
  label: string;
  file: string;
  lang: string;
  note: string;
  code: (script: string, siteId: string, api: string) => string;
};

const tag = (api: string, siteId: string) =>
  `<script defer src="${api}/oa.js" data-site="${siteId}"></script>`;

export const FRAMEWORKS: Framework[] = [
  {
    id: 'html', label: 'HTML', file: 'index.html', lang: 'html',
    note: 'Paste this just before the closing </head> tag on every page.',
    code: (_s, id, api) => `<!doctype html>
<html>
  <head>
    <!-- … your existing head … -->
    ${tag(api, id)}
  </head>
  <body>…</body>
</html>`,
  },
  {
    id: 'nextjs', label: 'Next.js', file: 'app/layout.tsx', lang: 'tsx',
    note: 'Using next/script with strategy="afterInteractive" keeps it off the critical path. Works with the App Router; for the Pages Router put the same tag in _document.tsx.',
    code: (_s, id, api) => `import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="${api}/oa.js"
          data-site="${id}"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}`,
  },
  {
    id: 'react', label: 'React / Vite', file: 'index.html', lang: 'html',
    note: 'Add it to the Vite index.html. Client-side route changes are tracked automatically — no router integration needed.',
    code: (_s, id, api) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>My app</title>
    ${tag(api, id)}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
  },
  {
    id: 'vue', label: 'Vue / Nuxt', file: 'nuxt.config.ts', lang: 'ts',
    note: 'For plain Vue, add the same tag to index.html instead.',
    code: (_s, id, api) => `export default defineNuxtConfig({
  app: {
    head: {
      script: [
        { src: '${api}/oa.js', defer: true, 'data-site': '${id}' },
      ],
    },
  },
});`,
  },
  {
    id: 'wordpress', label: 'WordPress', file: 'functions.php', lang: 'php',
    note: 'Add to your child theme’s functions.php, or paste the plain script tag into a “header scripts” plugin.',
    code: (_s, id, api) => `add_action('wp_head', function () { ?>
  <script defer src="${api}/oa.js" data-site="${id}"></script>
<?php });`,
  },
  {
    id: 'shopify', label: 'Shopify', file: 'theme.liquid', lang: 'liquid',
    note: 'Online Store → Themes → Edit code → layout/theme.liquid. Paste before </head>.',
    code: (_s, id, api) => `<!-- layout/theme.liquid -->
${tag(api, id)}

<!-- Optional: report order revenue on the thank-you page -->
{% if checkout %}
  <script>
    oa('revenue', {{ checkout.total_price | divided_by: 100.0 }}, {
      currency: '{{ checkout.currency }}', name: 'purchase'
    });
    oa('identify', '{{ checkout.customer_id }}', { email: '{{ checkout.email }}' });
  </script>
{% endif %}`,
  },
  {
    id: 'gtm', label: 'Tag Manager', file: 'Custom HTML tag', lang: 'html',
    note: 'New Tag → Custom HTML → trigger on All Pages. Leave “Support document.write” unchecked.',
    code: (_s, id, api) => tag(api, id),
  },
  {
    id: 'svelte', label: 'SvelteKit', file: 'src/app.html', lang: 'html',
    note: 'Add to app.html so it loads on every route.',
    code: (_s, id, api) => `<!doctype html>
<html lang="en">
  <head>
    %sveltekit.head%
    ${tag(api, id)}
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>`,
  },
];

export const eventSnippet = () => `// Track a custom event
oa('track', 'signup_started', { plan: 'pro' });

// Mark a named conversion — shows up under Goals
oa('goal', 'signup_completed');

// Report revenue — attributed to the source that earned it
oa('revenue', 49.00, { currency: 'USD', name: 'purchase' });

// Link this anonymous visitor to a real customer.
// Everything they did BEFORE this call is kept.
oa('identify', user.id, { email: user.email, name: user.name });`;

export const declarativeSnippet = () =>
  `<button data-oa-event="cta_clicked" data-oa-label="hero">Get started</button>`;
