#!/usr/bin/env node
/* Seeds the demo site with realistic traffic + revenue.
   Requires SUPABASE_SERVICE_ROLE_KEY. Run: npm run seed [days] */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const site = process.env.NEXT_PUBLIC_SITE_ID ?? 'demo';
const days = Number(process.argv[2] ?? 62);
const db = createClient(url, key, { auth: { persistSession: false } });

console.log(`Seeding "${site}" with ${days} days of traffic…`);
const { data, error } = await db.rpc('oa_seed_demo', { p_site: site, p_days: days });
if (error) { console.error(error.message); process.exit(1); }
console.log(data);

const { data: live } = await db.rpc('oa_seed_live', { p_site: site, p_n: 60 });
console.log(live ?? 'live pulse added');
console.log('Done. Open http://localhost:3000/overview');
