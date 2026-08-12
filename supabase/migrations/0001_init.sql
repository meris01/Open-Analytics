-- ============================================================================
-- OpenAnalytics — schema, ingest and read API
-- Works on any Postgres 14+ (Supabase, RDS, Neon, or plain self-hosted).
-- ============================================================================

create schema if not exists analytics;

-- ---------------------------------------------------------------- SITES ----
create table if not exists analytics.sites (
  id            uuid primary key default gen_random_uuid(),
  domain        text not null unique,
  name          text not null,
  public_id     text not null unique,
  timezone      text not null default 'UTC',
  currency      text not null default 'USD',
  owner_id      uuid,
  created_at    timestamptz not null default now()
);

-- ------------------------------------------------------------- VISITORS ----
-- Anonymous by construction. visitor_hash = sha256(daily_salt|site|ip|ua).
create table if not exists analytics.visitors (
  id             uuid primary key default gen_random_uuid(),
  site_id        uuid not null references analytics.sites(id) on delete cascade,
  visitor_hash   text not null,
  first_seen_at  timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  first_source   text,
  first_medium   text,
  first_campaign text,
  first_referrer text,
  first_landing  text,
  country        text,
  region         text,
  city           text,
  device         text,
  os             text,
  browser        text,
  external_id    text,
  email          text,
  name           text,
  is_customer    boolean not null default false,
  total_revenue  numeric(14,2) not null default 0,
  unique (site_id, visitor_hash)
);

-- ------------------------------------------------------------- SESSIONS ----
create table if not exists analytics.sessions (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references analytics.sites(id) on delete cascade,
  visitor_id    uuid not null references analytics.visitors(id) on delete cascade,
  started_at    timestamptz not null default now(),
  ended_at      timestamptz not null default now(),
  duration_s    integer not null default 0,
  pageviews     integer not null default 0,
  is_bounce     boolean not null default true,
  entry_path    text,
  exit_path     text,
  source        text,
  medium        text,
  campaign      text,
  term          text,
  content       text,
  referrer      text,
  referrer_host text,
  country       text,
  region        text,
  city          text,
  device        text,
  os            text,
  browser       text,
  screen_w      integer,
  language      text,
  revenue       numeric(14,2) not null default 0
);

-- --------------------------------------------------------------- EVENTS ----
create table if not exists analytics.events (
  id           bigserial primary key,
  site_id      uuid not null references analytics.sites(id) on delete cascade,
  session_id   uuid not null references analytics.sessions(id) on delete cascade,
  visitor_id   uuid not null references analytics.visitors(id) on delete cascade,
  type         text not null default 'pageview',
  name         text,
  path         text,
  title        text,
  referrer     text,
  duration_s   integer not null default 0,
  revenue      numeric(14,2) not null default 0,
  currency     text,
  props        jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create table if not exists analytics.goals (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references analytics.sites(id) on delete cascade,
  name        text not null,
  match_type  text not null default 'event',   -- event | path | path_prefix
  match_value text not null,
  value       numeric(14,2) not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists analytics.funnels (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references analytics.sites(id) on delete cascade,
  name       text not null,
  steps      jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists analytics.seo_queries (
  id          bigserial primary key,
  site_id     uuid not null references analytics.sites(id) on delete cascade,
  date        date not null,
  query       text not null,
  page        text,
  clicks      integer not null default 0,
  impressions integer not null default 0,
  ctr         numeric(6,4) not null default 0,
  position    numeric(6,2) not null default 0
);

-- -------------------------------------------------------------- INDEXES ----
create index if not exists idx_events_site_created  on analytics.events (site_id, created_at desc);
create index if not exists idx_events_site_type     on analytics.events (site_id, type, created_at desc);
create index if not exists idx_events_session       on analytics.events (session_id);
create index if not exists idx_events_visitor       on analytics.events (visitor_id, created_at);
create index if not exists idx_events_path          on analytics.events (site_id, path);
create index if not exists idx_sessions_site_start  on analytics.sessions (site_id, started_at desc);
create index if not exists idx_sessions_visitor     on analytics.sessions (visitor_id, started_at desc);
create index if not exists idx_sessions_source      on analytics.sessions (site_id, source);
create index if not exists idx_visitors_site_hash   on analytics.visitors (site_id, visitor_hash);
create index if not exists idx_visitors_customer    on analytics.visitors (site_id, is_customer);
create index if not exists idx_seo_site_date        on analytics.seo_queries (site_id, date desc);

alter table analytics.sites       enable row level security;
alter table analytics.visitors    enable row level security;
alter table analytics.sessions    enable row level security;
alter table analytics.events      enable row level security;
alter table analytics.goals       enable row level security;
alter table analytics.funnels     enable row level security;
alter table analytics.seo_queries enable row level security;

-- ============================================================================
-- INGEST — one transactional call per event. Handles visitor upsert,
-- 30-minute session stitching, first/last-touch attribution and revenue.
-- ============================================================================
create or replace function public.oa_ingest(p jsonb)
returns jsonb
language plpgsql security definer set search_path = analytics, public, pg_temp
as $$
declare
  v_site        analytics.sites%rowtype;
  v_visitor_id  uuid;
  v_session_id  uuid;
  v_is_new_sess boolean := false;
  v_type        text := coalesce(p->>'type','pageview');
  v_path        text := coalesce(p->>'path','/');
  v_ref_host    text := nullif(p->>'referrer_host','');
  v_source      text := nullif(p->>'source','');
  v_medium      text := nullif(p->>'medium','');
  v_revenue     numeric := coalesce((p->>'revenue')::numeric, 0);
  v_now         timestamptz := now();
  v_last_end    timestamptz;
  v_prev_pv     integer;
begin
  select * into v_site from analytics.sites where public_id = p->>'site';
  if not found then return jsonb_build_object('ok', false, 'error', 'unknown_site'); end if;

  if v_source is null then v_source := coalesce(v_ref_host, 'direct'); end if;
  if v_medium is null then
    v_medium := case when v_ref_host is null then 'none' else 'referral' end;
  end if;

  insert into analytics.visitors (
    site_id, visitor_hash, first_seen_at, last_seen_at,
    first_source, first_medium, first_campaign, first_referrer, first_landing,
    country, region, city, device, os, browser
  ) values (
    v_site.id, p->>'visitor_hash', v_now, v_now,
    v_source, v_medium, nullif(p->>'campaign',''), nullif(p->>'referrer',''), v_path,
    nullif(p->>'country',''), nullif(p->>'region',''), nullif(p->>'city',''),
    nullif(p->>'device',''), nullif(p->>'os',''), nullif(p->>'browser','')
  )
  on conflict (site_id, visitor_hash) do update
    set last_seen_at = v_now,
        country = coalesce(excluded.country, analytics.visitors.country),
        device  = coalesce(excluded.device,  analytics.visitors.device),
        os      = coalesce(excluded.os,      analytics.visitors.os),
        browser = coalesce(excluded.browser, analytics.visitors.browser)
  returning id into v_visitor_id;

  select id, ended_at, pageviews into v_session_id, v_last_end, v_prev_pv
  from analytics.sessions where visitor_id = v_visitor_id
  order by started_at desc limit 1;

  if v_session_id is null or v_last_end < v_now - interval '30 minutes' then
    v_is_new_sess := true;
    insert into analytics.sessions (
      site_id, visitor_id, started_at, ended_at, entry_path, exit_path,
      source, medium, campaign, term, content, referrer, referrer_host,
      country, region, city, device, os, browser, screen_w, language, pageviews, is_bounce
    ) values (
      v_site.id, v_visitor_id, v_now, v_now, v_path, v_path,
      v_source, v_medium, nullif(p->>'campaign',''), nullif(p->>'term',''), nullif(p->>'content',''),
      nullif(p->>'referrer',''), v_ref_host,
      nullif(p->>'country',''), nullif(p->>'region',''), nullif(p->>'city',''),
      nullif(p->>'device',''), nullif(p->>'os',''), nullif(p->>'browser',''),
      (p->>'screen_w')::int, nullif(p->>'language',''),
      case when v_type = 'pageview' then 1 else 0 end, true
    ) returning id into v_session_id;
  else
    update analytics.sessions set
      ended_at   = v_now,
      duration_s = greatest(0, extract(epoch from (v_now - started_at))::int),
      exit_path  = v_path,
      pageviews  = pageviews + case when v_type = 'pageview' then 1 else 0 end,
      is_bounce  = (pageviews + case when v_type = 'pageview' then 1 else 0 end) <= 1
                   and v_type <> 'conversion'
    where id = v_session_id;
  end if;

  insert into analytics.events (
    site_id, session_id, visitor_id, type, name, path, title,
    referrer, duration_s, revenue, currency, props, created_at
  ) values (
    v_site.id, v_session_id, v_visitor_id, v_type, nullif(p->>'name',''), v_path,
    nullif(p->>'title',''), nullif(p->>'referrer',''),
    coalesce((p->>'duration_s')::int, 0), v_revenue,
    coalesce(nullif(p->>'currency',''), v_site.currency),
    coalesce(p->'props', '{}'::jsonb), v_now
  );

  if p ? 'external_id' or p ? 'email' then
    update analytics.visitors set
      external_id = coalesce(nullif(p->>'external_id',''), external_id),
      email       = coalesce(nullif(p->>'email',''), email),
      name        = coalesce(nullif(p->>'name_hint',''), name)
    where id = v_visitor_id;
  end if;

  if v_revenue > 0 then
    update analytics.visitors
      set total_revenue = total_revenue + v_revenue, is_customer = true
      where id = v_visitor_id;
    update analytics.sessions
      set revenue = revenue + v_revenue, is_bounce = false
      where id = v_session_id;
  end if;

  return jsonb_build_object('ok', true, 'session', v_session_id, 'new_session', v_is_new_sess);
end;
$$;

-- ============================================================================
-- READ API — every dashboard query is one of these security-definer functions.
-- ============================================================================
create or replace function public.oa_site_id(p_site text)
returns uuid language sql stable security definer set search_path = analytics, public, pg_temp as $$
  select id from analytics.sites where public_id = p_site or domain = p_site limit 1;
$$;

create or replace function public.oa_kpis(p_site text, d1 timestamptz, d2 timestamptz)
returns jsonb language plpgsql stable security definer set search_path = analytics, public, pg_temp as $$
declare sid uuid := public.oa_site_id(p_site); p1 timestamptz := d1 - (d2 - d1); cur jsonb; prev jsonb;
begin
  if sid is null then return jsonb_build_object('error','unknown_site'); end if;
  with s as (select * from analytics.sessions where site_id=sid and started_at>=d1 and started_at<d2),
       e as (select * from analytics.events   where site_id=sid and created_at>=d1 and created_at<d2)
  select jsonb_build_object(
    'visitors',(select count(distinct visitor_id) from s),
    'sessions',(select count(*) from s),
    'pageviews',(select count(*) from e where type='pageview'),
    'revenue',coalesce((select sum(revenue) from e),0),
    'orders',(select count(*) from e where revenue>0),
    'conversions',(select count(*) from e where type in ('conversion','goal') or revenue>0),
    'customers',(select count(distinct visitor_id) from e where revenue>0),
    'bounce_rate',coalesce((select round(100.0*count(*) filter (where is_bounce)/nullif(count(*),0),1) from s),0),
    'avg_duration',coalesce((select round(avg(duration_s)) from s),0),
    'pages_per_session',coalesce((select round(avg(pageviews)::numeric,2) from s),0)) into cur;
  with s as (select * from analytics.sessions where site_id=sid and started_at>=p1 and started_at<d1),
       e as (select * from analytics.events   where site_id=sid and created_at>=p1 and created_at<d1)
  select jsonb_build_object(
    'visitors',(select count(distinct visitor_id) from s),
    'sessions',(select count(*) from s),
    'pageviews',(select count(*) from e where type='pageview'),
    'revenue',coalesce((select sum(revenue) from e),0),
    'orders',(select count(*) from e where revenue>0),
    'conversions',(select count(*) from e where type in ('conversion','goal') or revenue>0),
    'customers',(select count(distinct visitor_id) from e where revenue>0),
    'bounce_rate',coalesce((select round(100.0*count(*) filter (where is_bounce)/nullif(count(*),0),1) from s),0),
    'avg_duration',coalesce((select round(avg(duration_s)) from s),0),
    'pages_per_session',coalesce((select round(avg(pageviews)::numeric,2) from s),0)) into prev;
  return jsonb_build_object('current',cur,'previous',prev);
end; $$;

create or replace function public.oa_timeseries(p_site text, d1 timestamptz, d2 timestamptz, p_bucket text default 'day')
returns table(t timestamptz, visitors bigint, sessions bigint, pageviews bigint, revenue numeric)
language plpgsql stable security definer set search_path = analytics, public, pg_temp as $$
declare
  sid uuid := public.oa_site_id(p_site);
  iv interval := case p_bucket when 'hour' then interval '1 hour' when 'minute' then interval '1 minute'
                               when 'week' then interval '1 week' when 'month' then interval '1 month'
                               else interval '1 day' end;
begin
  return query
  with grid as (select generate_series(date_trunc(p_bucket,d1), date_trunc(p_bucket,d2-interval '1 microsecond'), iv) as gt),
  ss as (select date_trunc(p_bucket,s.started_at) tb, count(distinct s.visitor_id) v, count(*) n
         from analytics.sessions s where s.site_id=sid and s.started_at>=d1 and s.started_at<d2 group by 1),
  ee as (select date_trunc(p_bucket,e.created_at) tb, count(*) filter (where e.type='pageview') pv,
                coalesce(sum(e.revenue),0) rev
         from analytics.events e where e.site_id=sid and e.created_at>=d1 and e.created_at<d2 group by 1)
  select g.gt, coalesce(ss.v,0)::bigint, coalesce(ss.n,0)::bigint,
         coalesce(ee.pv,0)::bigint, coalesce(ee.rev,0)::numeric
  from grid g left join ss on ss.tb=g.gt left join ee on ee.tb=g.gt order by g.gt;
end; $$;

create or replace function public.oa_breakdown(p_site text, d1 timestamptz, d2 timestamptz, p_dim text, p_limit int default 20)
returns table(label text, visitors bigint, sessions bigint, customers bigint, revenue numeric, bounce_rate numeric)
language plpgsql stable security definer set search_path = analytics, public, pg_temp as $$
declare sid uuid := public.oa_site_id(p_site);
begin
  return query
  select coalesce(case p_dim
      when 'source' then s.source when 'medium' then s.medium when 'campaign' then s.campaign
      when 'referrer' then s.referrer_host when 'country' then s.country when 'region' then s.region
      when 'city' then s.city when 'device' then s.device when 'os' then s.os when 'browser' then s.browser
      when 'entry' then s.entry_path when 'exit' then s.exit_path when 'language' then s.language
      else s.source end, 'unknown')::text,
    count(distinct s.visitor_id)::bigint, count(*)::bigint,
    count(distinct s.visitor_id) filter (where s.revenue>0)::bigint,
    coalesce(sum(s.revenue),0)::numeric,
    coalesce(round(100.0*count(*) filter (where s.is_bounce)/nullif(count(*),0),1),0)::numeric
  from analytics.sessions s
  where s.site_id=sid and s.started_at>=d1 and s.started_at<d2
  group by 1 order by 3 desc limit p_limit;
end; $$;

create or replace function public.oa_pages(p_site text, d1 timestamptz, d2 timestamptz, p_limit int default 25)
returns table(path text, views bigint, uniques bigint, avg_time numeric, revenue numeric, bounce_rate numeric)
language plpgsql stable security definer set search_path = analytics, public, pg_temp as $$
declare sid uuid := public.oa_site_id(p_site);
begin
  return query
  with pv as (select e.path p, count(*) v, count(distinct e.visitor_id) u, coalesce(avg(nullif(e.duration_s,0)),0) at
              from analytics.events e where e.site_id=sid and e.created_at>=d1 and e.created_at<d2 and e.type='pageview'
              group by e.path),
  rev as (select e.path p, coalesce(sum(e.revenue),0) r from analytics.events e
          where e.site_id=sid and e.created_at>=d1 and e.created_at<d2 and e.revenue>0 group by e.path),
  br as (select s.entry_path p, round(100.0*count(*) filter (where s.is_bounce)/nullif(count(*),0),1) b
         from analytics.sessions s where s.site_id=sid and s.started_at>=d1 and s.started_at<d2 group by s.entry_path)
  select pv.p::text, pv.v::bigint, pv.u::bigint, round(pv.at::numeric,0),
         coalesce(rev.r,0)::numeric, coalesce(br.b,0)::numeric
  from pv left join rev on rev.p=pv.p left join br on br.p=pv.p
  order by pv.v desc limit p_limit;
end; $$;

create or replace function public.oa_realtime(p_site text, p_window int default 5)
returns jsonb language plpgsql stable security definer set search_path = analytics, public, pg_temp as $$
declare sid uuid := public.oa_site_id(p_site); since timestamptz := now() - make_interval(mins => p_window);
begin
  if sid is null then return jsonb_build_object('error','unknown_site'); end if;
  return jsonb_build_object(
    'active',(select count(distinct visitor_id) from analytics.events where site_id=sid and created_at>=since),
    'desktop',(select count(distinct e.visitor_id) from analytics.events e join analytics.sessions s on s.id=e.session_id
               where e.site_id=sid and e.created_at>=since and s.device='desktop'),
    'mobile',(select count(distinct e.visitor_id) from analytics.events e join analytics.sessions s on s.id=e.session_id
              where e.site_id=sid and e.created_at>=since and s.device in ('mobile','tablet')),
    'pageviews_30m',(select count(*) from analytics.events where site_id=sid and type='pageview' and created_at>=now()-interval '30 minutes'),
    'top_pages',coalesce((select jsonb_agg(x) from (select path, count(*) as views from analytics.events
        where site_id=sid and created_at>=since and type='pageview' group by path order by 2 desc limit 8) x),'[]'::jsonb),
    'countries',coalesce((select jsonb_agg(x) from (select s.country, count(distinct e.visitor_id) as visitors
        from analytics.events e join analytics.sessions s on s.id=e.session_id
        where e.site_id=sid and e.created_at>=since and s.country is not null group by s.country order by 2 desc limit 10) x),'[]'::jsonb),
    'stream',coalesce((select jsonb_agg(x) from (select e.id,e.type,e.name,e.path,e.revenue,e.created_at,
        s.country,s.city,s.source,s.device,s.os,s.browser
        from analytics.events e join analytics.sessions s on s.id=e.session_id
        where e.site_id=sid order by e.created_at desc limit 40) x),'[]'::jsonb),
    'series',coalesce((select jsonb_agg(x) from (select date_trunc('minute',gs) as t,
        (select count(*) from analytics.events e where e.site_id=sid and e.created_at>=gs and e.created_at<gs+interval '1 minute') as views
        from generate_series(date_trunc('minute',now())-interval '29 minutes', date_trunc('minute',now()), interval '1 minute') gs) x),'[]'::jsonb));
end; $$;

create or replace function public.oa_customers(p_site text, p_limit int default 25, p_offset int default 0, p_search text default null)
returns jsonb language plpgsql stable security definer set search_path = analytics, public, pg_temp as $$
declare sid uuid := public.oa_site_id(p_site); total bigint;
begin
  select count(*) into total from analytics.visitors v
   where v.site_id=sid and v.is_customer
     and (p_search is null or p_search='' or v.email ilike '%'||p_search||'%' or v.name ilike '%'||p_search||'%');
  return jsonb_build_object('total',total,'rows',coalesce((select jsonb_agg(x) from (
    select v.id,v.email,v.name,v.external_id,v.first_source,v.first_medium,v.first_campaign,
           v.first_landing,v.country,v.device,v.total_revenue,v.first_seen_at,v.last_seen_at,
           (select count(*) from analytics.events e where e.visitor_id=v.id and e.type='pageview') as pageviews,
           (select count(*) from analytics.sessions s where s.visitor_id=v.id) as sessions
    from analytics.visitors v where v.site_id=sid and v.is_customer
      and (p_search is null or p_search='' or v.email ilike '%'||p_search||'%' or v.name ilike '%'||p_search||'%')
    order by v.total_revenue desc, v.last_seen_at desc limit p_limit offset p_offset) x),'[]'::jsonb));
end; $$;

create or replace function public.oa_journey(p_visitor uuid, p_limit int default 60)
returns jsonb language plpgsql stable security definer set search_path = analytics, public, pg_temp as $$
begin
  return jsonb_build_object(
    'visitor',(select to_jsonb(v) from analytics.visitors v where v.id=p_visitor),
    'events',coalesce((select jsonb_agg(x order by (x->>'created_at')) from (
      select to_jsonb(y) as x from (
        select e.id,e.type,e.name,e.path,e.title,e.revenue,e.created_at,e.props,
               s.source,s.medium,s.campaign,s.referrer_host,s.device,s.country
        from analytics.events e join analytics.sessions s on s.id=e.session_id
        where e.visitor_id=p_visitor order by e.created_at asc limit p_limit) y) z),'[]'::jsonb));
end; $$;

create or replace function public.oa_goals(p_site text, d1 timestamptz, d2 timestamptz)
returns jsonb language plpgsql stable security definer set search_path = analytics, public, pg_temp as $$
declare sid uuid := public.oa_site_id(p_site); total_sessions bigint;
begin
  select count(*) into total_sessions from analytics.sessions where site_id=sid and started_at>=d1 and started_at<d2;
  return jsonb_build_object('total_sessions',total_sessions,'goals',coalesce((select jsonb_agg(x) from (
    select g.id,g.name,g.match_type,g.match_value,g.value,
      (select count(*) from analytics.events e where e.site_id=sid and e.created_at>=d1 and e.created_at<d2
        and ((g.match_type='event' and e.name=g.match_value)
          or (g.match_type='path' and e.path=g.match_value and e.type='pageview')
          or (g.match_type='path_prefix' and e.path like g.match_value||'%' and e.type='pageview'))) as completions,
      (select count(distinct e.visitor_id) from analytics.events e where e.site_id=sid and e.created_at>=d1 and e.created_at<d2
        and ((g.match_type='event' and e.name=g.match_value)
          or (g.match_type='path' and e.path=g.match_value and e.type='pageview')
          or (g.match_type='path_prefix' and e.path like g.match_value||'%' and e.type='pageview'))) as unique_completions,
      (select coalesce(sum(e.revenue),0) from analytics.events e where e.site_id=sid and e.created_at>=d1 and e.created_at<d2
        and ((g.match_type='event' and e.name=g.match_value)
          or (g.match_type='path' and e.path=g.match_value and e.type='pageview')
          or (g.match_type='path_prefix' and e.path like g.match_value||'%' and e.type='pageview'))) as revenue
    from analytics.goals g where g.site_id=sid order by g.created_at) x),'[]'::jsonb));
end; $$;

create or replace function public.oa_funnel(p_site text, p_funnel uuid, d1 timestamptz, d2 timestamptz)
returns jsonb language plpgsql stable security definer set search_path = analytics, public, pg_temp as $$
declare
  sid uuid := public.oa_site_id(p_site); f analytics.funnels%rowtype;
  step jsonb; i int := 0; prev_set uuid[]; cur_set uuid[]; base int; out_steps jsonb := '[]'::jsonb;
begin
  select * into f from analytics.funnels where id=p_funnel and site_id=sid;
  if not found then return jsonb_build_object('error','unknown_funnel'); end if;
  for step in select * from jsonb_array_elements(f.steps) loop
    select coalesce(array_agg(distinct e.visitor_id),'{}') into cur_set
      from analytics.events e
     where e.site_id=sid and e.created_at>=d1 and e.created_at<d2
       and ((step->>'type'='event' and e.name=step->>'value')
         or (step->>'type'='path' and e.path=step->>'value' and e.type='pageview')
         or (step->>'type'='path_prefix' and e.path like (step->>'value')||'%' and e.type='pageview')
         or (step->>'type'='revenue' and e.revenue>0))
       and (i=0 or e.visitor_id = any(prev_set));
    if i=0 then base := array_length(cur_set,1); end if;
    out_steps := out_steps || jsonb_build_object(
      'name',step->>'name','type',step->>'type','value',step->>'value',
      'users',coalesce(array_length(cur_set,1),0),
      'pct_of_start',case when coalesce(base,0)=0 then 0 else round(100.0*coalesce(array_length(cur_set,1),0)/base,1) end,
      'pct_of_prev',case when i=0 then 100 when coalesce(array_length(prev_set,1),0)=0 then 0
                    else round(100.0*coalesce(array_length(cur_set,1),0)/array_length(prev_set,1),1) end);
    prev_set := cur_set; i := i+1;
  end loop;
  return jsonb_build_object('id',f.id,'name',f.name,'steps',out_steps);
end; $$;

create or replace function public.oa_attribution(p_site text, d1 timestamptz, d2 timestamptz, p_model text default 'last')
returns table(source text, medium text, campaign text, customers bigint, orders bigint, revenue numeric)
language plpgsql stable security definer set search_path = analytics, public, pg_temp as $$
declare sid uuid := public.oa_site_id(p_site);
begin
  if p_model='first' then
    return query
    select coalesce(v.first_source,'direct')::text, coalesce(v.first_medium,'none')::text,
           coalesce(v.first_campaign,'-')::text, count(distinct e.visitor_id)::bigint,
           count(*)::bigint, coalesce(sum(e.revenue),0)::numeric
    from analytics.events e join analytics.visitors v on v.id=e.visitor_id
    where e.site_id=sid and e.created_at>=d1 and e.created_at<d2 and e.revenue>0
    group by 1,2,3 order by 6 desc;
  else
    return query
    select coalesce(s.source,'direct')::text, coalesce(s.medium,'none')::text,
           coalesce(s.campaign,'-')::text, count(distinct e.visitor_id)::bigint,
           count(*)::bigint, coalesce(sum(e.revenue),0)::numeric
    from analytics.events e join analytics.sessions s on s.id=e.session_id
    where e.site_id=sid and e.created_at>=d1 and e.created_at<d2 and e.revenue>0
    group by 1,2,3 order by 6 desc;
  end if;
end; $$;

create or replace function public.oa_seo(p_site text, d1 timestamptz, d2 timestamptz, p_limit int default 25)
returns jsonb language plpgsql stable security definer set search_path = analytics, public, pg_temp as $$
declare sid uuid := public.oa_site_id(p_site);
begin
  return jsonb_build_object(
    'totals',coalesce((select jsonb_build_object('clicks',coalesce(sum(clicks),0),'impressions',coalesce(sum(impressions),0),
        'ctr',coalesce(round(100.0*sum(clicks)/nullif(sum(impressions),0),2),0),'position',coalesce(round(avg(position),1),0))
      from analytics.seo_queries where site_id=sid and date>=d1::date and date<d2::date),'{}'::jsonb),
    'series',coalesce((select jsonb_agg(x order by x->>'date') from (select to_jsonb(y) x from (
        select date, sum(clicks) clicks, sum(impressions) impressions from analytics.seo_queries
        where site_id=sid and date>=d1::date and date<d2::date group by date order by date) y) z),'[]'::jsonb),
    'queries',coalesce((select jsonb_agg(x) from (
        select q.query, sum(q.clicks) clicks, sum(q.impressions) impressions,
               round(100.0*sum(q.clicks)/nullif(sum(q.impressions),0),2) ctr, round(avg(q.position),1) position
        from analytics.seo_queries q where q.site_id=sid and q.date>=d1::date and q.date<d2::date
        group by q.query order by 2 desc limit p_limit) x),'[]'::jsonb));
end; $$;

-- ============================================================================
-- PERMISSIONS
--   oa_ingest  : public write endpoint, safe with the anon/publishable key.
--   everything else : service_role only. The dashboard runs server-side.
-- ============================================================================
do $$ declare fn text; begin
  for fn in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname like 'oa\_%'
  loop execute format('revoke all on function %s from public, anon, authenticated', fn); end loop;
end $$;
grant execute on function public.oa_ingest(jsonb) to anon, authenticated;

-- ------------------------------------------------------------ FIRST SITE ----
insert into analytics.sites (domain, name, public_id, currency, timezone)
values ('openanalytics.io', 'OpenAnalytics Demo', 'demo', 'USD', 'UTC')
on conflict (domain) do nothing;

insert into analytics.goals (site_id, name, match_type, match_value, value)
select s.id, g.n, g.t, g.v, g.val from analytics.sites s,
  (values ('Signup started','event','signup_started',0),
          ('Account created','event','signup_completed',0),
          ('Pricing viewed','path','/pricing',0),
          ('Demo requested','event','demo_request',0),
          ('Purchase','event','purchase',0)) as g(n,t,v,val)
where s.public_id='demo'
  and not exists (select 1 from analytics.goals x where x.site_id=s.id and x.name=g.n);

insert into analytics.funnels (site_id, name, steps)
select s.id, 'Main Purchase Flow', '[
  {"name":"Landed","type":"path_prefix","value":"/"},
  {"name":"Viewed Pricing","type":"path","value":"/pricing"},
  {"name":"Started Signup","type":"event","value":"signup_started"},
  {"name":"Paid","type":"event","value":"purchase"}
]'::jsonb
from analytics.sites s where s.public_id='demo'
  and not exists (select 1 from analytics.funnels f where f.site_id=s.id and f.name='Main Purchase Flow');
