/* ---------------------------------------------------------------------------
   Everything a self-hoster needs, in one place. These strings are rendered
   into copy-paste blocks in Settings → Database, so they must be complete and
   runnable, not illustrative.
--------------------------------------------------------------------------- */

export const SUPABASE_STEPS = [
  {
    id: 'project',
    title: 'Create a Supabase project',
    body: 'Any Postgres 14+ works, but Supabase gives you auth and a SQL editor with no setup. The free tier is enough to start.',
    detail: [
      'Go to supabase.com and create a new project.',
      'Pick a region close to your visitors — it is where every query will run.',
      'Save the database password somewhere safe; you will not be shown it again.',
      'Wait for the project to finish provisioning (about two minutes).',
    ],
  },
  {
    id: 'schema',
    title: 'Run the schema migration',
    body: 'Creates the analytics schema, the ingest function and the read API. Everything OpenAnalytics stores lives in its own schema, so it will not collide with anything else in the database.',
    file: 'supabase/migrations/0001_init.sql',
    detail: [
      'Open your project → SQL Editor → New query.',
      'Paste the entire contents of 0001_init.sql.',
      'Press Run. It should complete in a couple of seconds.',
    ],
  },
  {
    id: 'auth',
    title: 'Run the auth and multi-tenancy migration',
    body: 'Links websites to Supabase Auth users and turns on row-level security. This is what makes the dashboard safe to expose — reads run as the signed-in user, not as an admin key.',
    file: 'supabase/migrations/0003_auth_multitenant.sql',
    detail: [
      'SQL Editor → New query again.',
      'Paste the entire contents of 0003_auth_multitenant.sql and Run.',
      'This also revokes the default PUBLIC EXECUTE grant that Postgres puts on new functions.',
    ],
  },
  {
    id: 'demo',
    title: 'Optional: generate demo data',
    body: 'Only useful while you are evaluating. Generates two months of realistic traffic, revenue and customers so every chart has something in it.',
    file: 'supabase/migrations/0004_seed_demo.sql',
    detail: [
      'Run 0004_seed_demo.sql to install the generator functions.',
      "Then run: select public.oa_seed_demo('demo', 62);",
      'Skip this entirely for a production install.',
    ],
  },
  {
    id: 'auth-config',
    title: 'Configure Auth',
    body: 'Two settings decide how people get into your dashboard.',
    detail: [
      'Authentication → Providers → Email: enable it.',
      'Turn OFF "Confirm email" if you want instant signup, or leave it on and configure SMTP.',
      'Authentication → URL Configuration → Site URL: set it to your deployed URL.',
      'Add {your-url}/auth/callback to the redirect allow-list.',
      'To keep the instance private, disable signups once your own account exists.',
    ],
  },
  {
    id: 'keys',
    title: 'Copy your keys',
    body: 'You need exactly two values, and neither of them is the service-role key. The dashboard never uses it.',
    detail: [
      'Project Settings → API.',
      'Copy the Project URL into NEXT_PUBLIC_SUPABASE_URL.',
      'Copy the publishable (anon) key into NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
      'Generate a long random string for OA_SALT — this is what keeps visitor hashes un-reversible.',
    ],
  },
] as const;

export const ENV_TEMPLATE = `# Where your database lives
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx

# Secret. Rotating this invalidates every visitor hash immediately.
# Generate with:  openssl rand -base64 48
OA_SALT=replace-me-with-a-long-random-string

# Public URL of THIS dashboard — used to build your install snippet
NEXT_PUBLIC_APP_URL=https://analytics.yourdomain.com`;

export const VERIFY_SQL = `-- Did the migrations land? Expect 7 tables.
select table_name
from information_schema.tables
where table_schema = 'analytics'
order by table_name;

-- Is row-level security on everywhere? Every row should say true.
select tablename, rowsecurity
from pg_tables
where schemaname = 'analytics'
order by tablename;

-- Who can execute what? Only oa_ingest should be true for anon.
select p.proname,
       has_function_privilege('anon', p.oid, 'execute')          as anon,
       has_function_privilege('authenticated', p.oid, 'execute') as signed_in
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname like 'oa\\_%'
order by 1;`;

export const HEALTH_SQL = `-- Events received per day for the last fortnight
select date_trunc('day', created_at)::date as day,
       count(*)                            as events,
       count(*) filter (where type = 'pageview')   as pageviews,
       count(*) filter (where revenue > 0)         as purchases,
       round(sum(revenue), 2)                      as revenue
from analytics.events
where created_at > now() - interval '14 days'
group by 1
order by 1 desc;

-- Table sizes, so you can see growth before it surprises you
select relname as table,
       pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
       n_live_tup as approx_rows
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_stat_user_tables s on s.relid = c.oid
where n.nspname = 'analytics' and c.relkind = 'r'
order by pg_total_relation_size(c.oid) desc;`;

export const RETENTION_SQL = `-- Optional: keep the database small by trimming raw events.
-- Sessions and visitors are tiny; events are what grow.
delete from analytics.events
where created_at < now() - interval '24 months';

-- Run it automatically every night with pg_cron (Supabase: enable the
-- extension under Database → Extensions first).
select cron.schedule(
  'openanalytics-retention',
  '0 3 * * *',
  $$delete from analytics.events where created_at < now() - interval '24 months'$$
);`;

export const BACKUP_SQL = `# Full logical backup of just your analytics data
pg_dump "$SUPABASE_DB_URL" \\
  --schema=analytics \\
  --no-owner --no-privileges \\
  -f openanalytics-backup.sql

# Restore into any other Postgres
psql "$TARGET_DB_URL" -f openanalytics-backup.sql`;

export const TRACKER_API = [
  {
    sig: "oa('track', name, props?)",
    what: 'Records a custom event.',
    why: 'Anything you want to count that is not a pageview — a filter used, a video played, a plan selected.',
    example: `oa('track', 'plan_selected', { plan: 'pro', billing: 'annual' });`,
  },
  {
    sig: "oa('goal', name, props?)",
    what: 'Records a named conversion.',
    why: 'Identical to track(), but shows up under Goals and counts toward conversion rate.',
    example: `oa('goal', 'trial_started');`,
  },
  {
    sig: "oa('revenue', amount, opts?)",
    what: 'Attributes money to the visitor and their session.',
    why: 'Written to both the session (last-touch) and the visitor (first-touch), so both attribution models stay exact.',
    example: `oa('revenue', 49.00, {
  currency: 'USD',
  name: 'purchase',
  props: { plan: 'pro' },
});`,
  },
  {
    sig: "oa('identify', id, traits?)",
    what: 'Links the anonymous visitor to a real person.',
    why: 'Everything they did BEFORE this call stays attached. This is what makes the Customers page show a full path from first Google search to payment.',
    example: `oa('identify', user.id, {
  email: user.email,
  name: user.name,
});`,
  },
  {
    sig: "oa('pageview')",
    what: 'Records a pageview manually.',
    why: 'Only needed if you set data-auto="false" — otherwise pageviews and SPA route changes are tracked for you.',
    example: `oa('pageview');`,
  },
] as const;

export const SERVER_SIDE = `// Revenue is more reliable from your server than from the browser:
// it survives ad blockers, page closes and failed redirects.
// Send it straight to the ingest endpoint from a webhook handler.

await fetch('https://analytics.yourdomain.com/api/event', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    site: 'YOUR_SITE_ID',
    type: 'conversion',
    name: 'purchase',
    path: '/checkout',
    revenue: 49.0,
    currency: 'USD',
    email: customerEmail,        // links to the visitor identified earlier
    external_id: stripeCustomerId,
  }),
});`;

export const DEPLOY_STEPS = [
  {
    id: 'vercel',
    title: 'Deploy to Vercel',
    detail: [
      'Push this repository to GitHub and import it in Vercel.',
      'Add the four environment variables from the Environment tab.',
      'Set NEXT_PUBLIC_APP_URL to the production domain, not the preview URL — it is baked into the snippet you hand out.',
      'Deploy. Country and city data start working immediately from the x-vercel-ip-* headers.',
    ],
  },
  {
    id: 'self',
    title: 'Self-host with Docker or a VPS',
    detail: [
      'npm run build && npm run start behind any reverse proxy.',
      'Put Cloudflare in front if you want geo data — the tracker reads cf-ipcountry.',
      'The rate limiter is per-process. Behind several instances, move it to Redis or your WAF.',
    ],
  },
  {
    id: 'subdomain',
    title: 'Serve the tracker first-party',
    detail: [
      'Hosting the dashboard on a subdomain of the site you track means the script is first-party.',
      'Fewer blockers match it, and the ingest request carries no third-party cookie concerns.',
      'analytics.yourdomain.com tracking yourdomain.com is the ideal setup.',
    ],
  },
] as const;

export const TROUBLESHOOTING = [
  {
    q: 'No events are arriving',
    a: 'Load your site in a normal browser tab and check the Network panel for a POST to /api/event. A 204 means it worked. If the request is missing entirely, the script tag has not shipped to production yet — most frameworks need a rebuild and redeploy.',
  },
  {
    q: 'It works in production but not on localhost',
    a: 'That is deliberate. The tracker ignores localhost so development traffic never pollutes real numbers. Add data-local="true" to the script tag while testing.',
  },
  {
    q: 'The dashboard is empty but events are being received',
    a: 'Check the date range in the top right, and make sure the site switcher is pointed at the right website. Events land against the data-site value in your script tag.',
  },
  {
    q: 'Revenue shows zero',
    a: 'Revenue only appears once you call oa("revenue", amount). Pageviews alone cannot know what a customer paid. For accuracy, send it from your payment webhook server-side.',
  },
  {
    q: 'Customers page is empty',
    a: 'A visitor becomes a customer when you call oa("identify", ...) and they have recorded revenue. Without identify(), visitors stay anonymous by design.',
  },
  {
    q: 'Everything 401s after signing in',
    a: 'Your Supabase Site URL or redirect allow-list probably does not include your deployed domain. Authentication → URL Configuration.',
  },
  {
    q: 'permission denied for schema analytics',
    a: 'The 0003 migration did not finish. Re-run it — it is idempotent, so running it twice is safe.',
  },
  {
    q: 'An ad blocker is eating the script',
    a: 'Because the endpoint is first-party, most generic filter rules do not match. If you want certainty, add a rewrite so the script is served from a path on your own domain.',
  },
] as const;
