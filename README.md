# OpenAnalytics

Free, open-source, privacy-first website analytics with **revenue attribution**.
Self-hostable. Cookieless. No paid APIs in the critical path.

It answers one question: **what is happening with my website, and where is my
revenue coming from?**

---

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in the two Supabase values
npm run dev                    # → http://localhost:3000
```

Sign up, add your domain, paste one script tag. The install screen watches for
your first event and moves you to the dashboard the moment it lands.

### 1. Database

Run these against any Postgres 14+ (Supabase, Neon, RDS, or local), in order:

```
supabase/migrations/0001_init.sql              schema, ingest, read API
supabase/migrations/0003_auth_multitenant.sql  auth, RLS, site/goal/funnel CRUD
supabase/migrations/0004_seed_demo.sql         optional: demo data generator
```

On Supabase, paste each into the SQL editor. **Settings → Database setup** walks
through this step by step in the running app, with copy-paste blocks, verification
queries and health checks — it is the canonical version of these instructions.

### 2. Environment

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
OA_SALT=a-long-random-string
NEXT_PUBLIC_APP_URL=https://analytics.yourdomain.com
```

> **There is no service-role key.** The dashboard reads through the signed-in
> user's own session, and Postgres row-level security decides what they can see.
> A leaked publishable key gets an attacker nothing but the ability to send
> events — the same as any analytics collector.

### 3. Install the tracker

```html
<script defer src="https://your-app.com/oa.js" data-site="YOUR_SITE_ID"></script>
```

Copy-paste snippets for **Next.js, React/Vite, Vue/Nuxt, SvelteKit, WordPress,
Shopify, Tag Manager and plain HTML** are generated for you during onboarding
and repeated under Settings.

| Attribute | Purpose |
|---|---|
| `data-site` | Which site the events belong to |
| `data-api` | Override the ingest endpoint if you host the collector separately |
| `data-hash` | `"true"` for hash routers (`#/pricing`) |
| `data-exclude` | Paths to ignore — `/admin*,/preview` |
| `data-local` | `"true"` to also track localhost while developing |
| `data-auto` | `"false"` to disable automatic pageview tracking |

### 4. Track revenue

```js
oa('track', 'signup_started', { plan: 'pro' });
oa('goal',  'signup_completed');
oa('revenue', 49.00, { currency: 'USD', name: 'purchase' });
oa('identify', user.id, { email: user.email, name: user.name });
```

`identify()` attaches an email to the anonymous visitor you already have — the
pages they read weeks before signing up stay attached to them. That history is
what makes the Customers page worth opening.

Declarative alternative, no JavaScript required:

```html
<button data-oa-event="cta_clicked" data-oa-label="hero">Get started</button>
```

---

## What's in the box

| | |
|---|---|
| **Tracker** | ~1.9 KB gzipped, cookieless, SPA-aware, `sendBeacon`-first |
| **Ingest** | `POST /api/event` → one transactional Postgres function. Rate limited, payload capped, bot filtered, de-duplicated, optional per-site origin allow-list |
| **Attribution** | First-touch *and* last-touch, both exact — recorded at the time, not modelled afterwards |
| **Dashboard** | Overview, Analytics, Revenue, Customers, Sources, Pages, Funnels, Goals, SEO, Real-time, AI Analyst, Settings |
| **Multi-site** | One account, many websites, isolated by RLS |
| **AI Analyst** | Deterministic insight engine over your own numbers. No LLM key required |
| **Exports** | Working CSV download on every table |
| **Theme** | Dark + light, both verified WCAG 2.1 AA (1,799 text nodes, zero failures) |
| **Icons** | ~47 inline brand marks, 55 hand-drawn SVG country flags, browser/OS/device glyphs — no network calls, no emoji fonts, nothing that can 404 |
| **Keyboard** | ⌘K command palette: jump pages, switch website, change range, export, toggle theme |
| **Docs** | Settings is a nine-tab hub with the complete Supabase SQL setup, verification queries, retention, backups, API reference and troubleshooting |

---

## Privacy model

- **No cookies, no localStorage.** Nothing is stored on the visitor's device, so
  there is nothing to ask consent for.
- **No raw IP is ever stored.** `visitor_hash = sha256(daily_salt | site | ip | ua)`,
  truncated; the IP is discarded immediately.
- **Un-linkable across days.** The salt rotates every 24 hours, so yesterday's
  hash cannot be matched to today's. Cross-day identity only exists once *you*
  call `identify()`.
- **No cross-site graph.** Data is first-party and site-scoped.
- **Tenant isolation in the database.** Not in application code — in RLS policies.

Result: GDPR/CCPA-friendly, no consent banner required in most jurisdictions.

---

## How attribution works

1. A visitor hash is derived per day from salt + site + IP + user agent.
2. Events within 30 minutes roll into one **session**, which records the source,
   medium, campaign and landing page as they were at its start.
3. The visitor's **first** session is stored permanently — that is first-touch.
4. `identify()` attaches an email / external ID to the existing anonymous row.
5. `revenue()` writes the amount to **both** the session (last-touch) and the
   visitor (first-touch), so both models are exact rather than reconstructed.

---

## Architecture

```
oa.js  ──POST──►  /api/event  ──rpc──►  oa_ingest()  ──►  Postgres
                  hash IP, filter bots,  upsert visitor,     analytics.*
                  rate limit, dedupe,    stitch session,
                  read geo headers       attribute revenue

Dashboard (RSC) ──user session──► oa_kpis / oa_timeseries / oa_breakdown /
                  + RLS            oa_pages / oa_attribution / oa_funnel /
                                   oa_goals / oa_customers / oa_journey /
                                   oa_realtime / oa_seo
```

All aggregation happens **in Postgres**, not in Node. Pages are React Server
Components, so no analytics data reaches the browser except what is rendered.

---

## Deploying

Any Node host works. On Vercel, set the four env vars and point
`NEXT_PUBLIC_APP_URL` at your deployed domain so generated snippets are correct.
Geo enrichment reads `x-vercel-ip-*` / `cf-ipcountry` headers, so country data
works automatically behind Vercel or Cloudflare.

The in-memory rate limiter is per-instance. If you run many instances behind a
load balancer, move it to Redis or your edge/WAF layer.

---

## Roadmap (all optional, never required)

- Google Search Console sync → `analytics.seo_queries`
- Stripe / Lemon Squeezy webhooks → server-side `revenue()`
- LLM-backed `/api/ask` (the deterministic analyst stays as the fallback)
- Team members per site
- ClickHouse adapter for very high volume

## Licence

MIT. Your data, your database, your rules.
