-- ============================================================================
-- Multi-tenant + auth. Run AFTER 0001_init.sql.
--
-- Security model:
--   * Dashboard reads run as the SIGNED-IN USER (security invoker + RLS).
--     There is no service-role key in the application at all.
--   * oa_ingest is the single public write path, granted to `anon`.
-- ============================================================================

alter table analytics.sites
  add column if not exists installed_at    timestamptz,
  add column if not exists last_event_at   timestamptz,
  add column if not exists allowed_origins text[],
  add column if not exists archived_at     timestamptz;

alter table analytics.sites drop constraint if exists sites_owner_fk;
alter table analytics.sites
  add constraint sites_owner_fk foreign key (owner_id) references auth.users(id) on delete cascade;
create index if not exists idx_sites_owner on analytics.sites (owner_id);

-- ------------------------------------------------------------- POLICIES ----
do $$
declare t text;
begin
  for t in select unnest(array['visitors','sessions','events','goals','funnels','seo_queries'])
  loop
    execute format('drop policy if exists %I_own on analytics.%I', t, t);
    execute format($f$
      create policy %I_own on analytics.%I for all to authenticated
      using      (site_id in (select id from analytics.sites where owner_id = (select auth.uid())))
      with check (site_id in (select id from analytics.sites where owner_id = (select auth.uid())))
    $f$, t, t);
  end loop;
end $$;

drop policy if exists sites_owner on analytics.sites;
create policy sites_owner on analytics.sites for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

grant usage on schema analytics to authenticated, anon;
grant select, insert, update, delete on analytics.sites, analytics.goals, analytics.funnels to authenticated;
grant select on analytics.visitors, analytics.sessions, analytics.events, analytics.seo_queries to authenticated;
grant usage, select on all sequences in schema analytics to authenticated;

-- Reads become security INVOKER so RLS — not application code — enforces tenancy
do $$ declare fn text; begin
  for fn in select p.oid::regprocedure::text from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.proname like 'oa\_%'
      and p.proname not in ('oa_ingest','oa_seed_demo','oa_seed_live')
  loop execute format('alter function %s security invoker', fn); end loop;
end $$;

create or replace function public.oa_site_id(p_site text)
returns uuid language sql stable security invoker set search_path = analytics, public, pg_temp as $$
  select id from analytics.sites
  where (public_id = p_site or domain = p_site or id::text = p_site)
    and archived_at is null
  limit 1;
$$;

-- pgcrypto lives in the `extensions` schema on Supabase and is not on the
-- locked-down search_path. gen_random_uuid() is in pg_catalog and always works.
create or replace function public.oa_new_public_id()
returns text language sql volatile as $$
  select lower(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
$$;

-- ---------------------------------------------------------- SITE CRUD -------
create or replace function public.oa_create_site(p_domain text, p_name text default null,
  p_timezone text default 'UTC', p_currency text default 'USD')
returns jsonb language plpgsql security invoker set search_path = analytics, public, pg_temp as $$
declare uid uuid := auth.uid(); clean text; pid text; sid uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  clean := lower(regexp_replace(coalesce(p_domain,''), '^https?://', ''));
  clean := regexp_replace(clean, '^www\.', '');
  clean := split_part(regexp_replace(clean, '/.*$', ''), ':', 1);
  if clean = '' or clean !~ '^[a-z0-9]([a-z0-9\-\.]*[a-z0-9])?$' then raise exception 'invalid_domain'; end if;
  if exists (select 1 from analytics.sites where domain = clean and owner_id = uid and archived_at is null)
    then raise exception 'domain_exists'; end if;

  loop pid := public.oa_new_public_id();
    exit when not exists (select 1 from analytics.sites where public_id = pid); end loop;

  insert into analytics.sites (domain, name, public_id, timezone, currency, owner_id)
  values (clean, coalesce(nullif(p_name,''), clean), pid, coalesce(p_timezone,'UTC'),
          coalesce(p_currency,'USD'), uid)
  returning id into sid;

  insert into analytics.goals (site_id, name, match_type, match_value)
  values (sid,'Signup started','event','signup_started'),
         (sid,'Account created','event','signup_completed'),
         (sid,'Purchase','event','purchase');

  insert into analytics.funnels (site_id, name, steps)
  values (sid, 'Signup flow', '[
    {"name":"Landed","type":"path_prefix","value":"/"},
    {"name":"Started signup","type":"event","value":"signup_started"},
    {"name":"Account created","type":"event","value":"signup_completed"},
    {"name":"Paid","type":"event","value":"purchase"}]'::jsonb);

  return (select to_jsonb(s) from analytics.sites s where s.id = sid);
end; $$;

create or replace function public.oa_list_sites()
returns jsonb language sql stable security invoker set search_path = analytics, public, pg_temp as $$
  select coalesce(jsonb_agg(x order by x->>'created_at'), '[]'::jsonb) from (
    select jsonb_build_object('id',s.id,'domain',s.domain,'name',s.name,'public_id',s.public_id,
      'currency',s.currency,'timezone',s.timezone,'installed_at',s.installed_at,
      'last_event_at',s.last_event_at,'created_at',s.created_at,
      'events',(select count(*) from analytics.events e where e.site_id = s.id)) as x
    from analytics.sites s
    where s.owner_id = auth.uid() and s.archived_at is null) t;
$$;

create or replace function public.oa_install_status(p_site text)
returns jsonb language plpgsql security invoker set search_path = analytics, public, pg_temp as $$
declare s analytics.sites%rowtype; n bigint; first_ev timestamptz; last_ev timestamptz; recent jsonb;
begin
  select * into s from analytics.sites
   where (public_id = p_site or id::text = p_site) and owner_id = auth.uid();
  if not found then return jsonb_build_object('error','unknown_site'); end if;

  select count(*), min(created_at), max(created_at) into n, first_ev, last_ev
    from analytics.events where site_id = s.id;

  if n > 0 and s.installed_at is null then
    update analytics.sites set installed_at = first_ev, last_event_at = last_ev where id = s.id;
  elsif n > 0 then
    update analytics.sites set last_event_at = last_ev where id = s.id;
  end if;

  select coalesce(jsonb_agg(x),'[]'::jsonb) into recent from (
    select jsonb_build_object('path',e.path,'type',e.type,'name',e.name,'created_at',e.created_at,
      'country',se.country,'device',se.device,'referrer_host',se.referrer_host) as x
    from analytics.events e join analytics.sessions se on se.id = e.session_id
    where e.site_id = s.id order by e.created_at desc limit 5) t;

  return jsonb_build_object('connected', n > 0, 'events', n, 'first_event_at', first_ev,
    'last_event_at', last_ev, 'domain', s.domain, 'public_id', s.public_id, 'recent', recent);
end; $$;

create or replace function public.oa_update_site(p_site text, p_name text default null,
  p_currency text default null, p_timezone text default null, p_origins text[] default null)
returns jsonb language plpgsql security invoker set search_path = analytics, public, pg_temp as $$
declare sid uuid;
begin
  select id into sid from analytics.sites
   where (public_id = p_site or id::text = p_site) and owner_id = auth.uid();
  if sid is null then raise exception 'not_authorised'; end if;
  update analytics.sites set
    name = coalesce(nullif(p_name,''), name),
    currency = coalesce(nullif(p_currency,''), currency),
    timezone = coalesce(nullif(p_timezone,''), timezone),
    allowed_origins = coalesce(p_origins, allowed_origins)
  where id = sid;
  return (select to_jsonb(s) from analytics.sites s where s.id = sid);
end; $$;

create or replace function public.oa_delete_site(p_site text)
returns jsonb language plpgsql security invoker set search_path = analytics, public, pg_temp as $$
declare sid uuid;
begin
  select id into sid from analytics.sites
   where (public_id = p_site or id::text = p_site) and owner_id = auth.uid();
  if sid is null then raise exception 'not_authorised'; end if;
  delete from analytics.sites where id = sid;
  return jsonb_build_object('deleted', true);
end; $$;

-- ------------------------------------------------------ GOAL / FUNNEL CRUD --
create or replace function public.oa_upsert_goal(p_site text, p_name text, p_match_type text,
  p_match_value text, p_value numeric default 0, p_id uuid default null)
returns jsonb language plpgsql security invoker set search_path = analytics, public, pg_temp as $$
declare sid uuid; gid uuid;
begin
  select id into sid from analytics.sites
   where (public_id = p_site or id::text = p_site) and owner_id = auth.uid();
  if sid is null then raise exception 'not_authorised'; end if;
  if p_match_type not in ('event','path','path_prefix') then raise exception 'bad_match_type'; end if;
  if p_id is null then
    insert into analytics.goals (site_id,name,match_type,match_value,value)
    values (sid,p_name,p_match_type,p_match_value,coalesce(p_value,0)) returning id into gid;
  else
    update analytics.goals set name=p_name, match_type=p_match_type,
      match_value=p_match_value, value=coalesce(p_value,0)
     where id=p_id and site_id=sid returning id into gid;
    if gid is null then raise exception 'not_found'; end if;
  end if;
  return (select to_jsonb(g) from analytics.goals g where g.id = gid);
end; $$;

create or replace function public.oa_delete_goal(p_id uuid)
returns jsonb language sql security invoker set search_path = analytics, public, pg_temp as $$
  with d as (delete from analytics.goals where id = p_id returning 1)
  select jsonb_build_object('deleted',(select count(*) from d));
$$;

create or replace function public.oa_upsert_funnel(p_site text, p_name text, p_steps jsonb, p_id uuid default null)
returns jsonb language plpgsql security invoker set search_path = analytics, public, pg_temp as $$
declare sid uuid; fid uuid;
begin
  select id into sid from analytics.sites
   where (public_id = p_site or id::text = p_site) and owner_id = auth.uid();
  if sid is null then raise exception 'not_authorised'; end if;
  if jsonb_array_length(p_steps) < 2 then raise exception 'need_two_steps'; end if;
  if p_id is null then
    insert into analytics.funnels (site_id,name,steps) values (sid,p_name,p_steps) returning id into fid;
  else
    update analytics.funnels set name=p_name, steps=p_steps
     where id=p_id and site_id=sid returning id into fid;
    if fid is null then raise exception 'not_found'; end if;
  end if;
  return (select to_jsonb(f) from analytics.funnels f where f.id = fid);
end; $$;

create or replace function public.oa_delete_funnel(p_id uuid)
returns jsonb language sql security invoker set search_path = analytics, public, pg_temp as $$
  with d as (delete from analytics.funnels where id = p_id returning 1)
  select jsonb_build_object('deleted',(select count(*) from d));
$$;

-- Optional: let the first account adopt the sample dataset
create or replace function public.oa_claim_demo()
returns jsonb language plpgsql security definer set search_path = analytics, public, pg_temp as $$
declare uid uuid := auth.uid(); sid uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from analytics.sites where owner_id = uid)
    then return jsonb_build_object('ok',false,'error','already_has_sites'); end if;
  select id into sid from analytics.sites where public_id='demo' and owner_id is null;
  if sid is null then return jsonb_build_object('ok',false,'error','demo_unavailable'); end if;
  update analytics.sites set owner_id = uid, public_id = public.oa_new_public_id(),
    name = 'Demo — sample data', installed_at = coalesce(installed_at, now()) where id = sid;
  return (select to_jsonb(s) from analytics.sites s where s.id = sid);
end; $$;

-- ============================================================================
-- PERMISSIONS — strip Postgres's default PUBLIC EXECUTE, then grant precisely.
-- ============================================================================
do $$ declare fn text; begin
  for fn in select p.oid::regprocedure::text from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname like 'oa\_%'
  loop execute format('revoke all on function %s from public, anon, authenticated', fn); end loop;
end $$;

do $$ declare fn text; begin
  for fn in select p.oid::regprocedure::text from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname like 'oa\_%'
      and p.proname not in ('oa_ingest','oa_seed_demo','oa_seed_live')
  loop execute format('grant execute on function %s to authenticated', fn); end loop;
end $$;

grant execute on function public.oa_ingest(jsonb) to anon, authenticated;
alter default privileges in schema public revoke execute on functions from public;

-- ============================================================================
-- Hardened ingest: archived-site rejection, per-site origin allow-list,
-- engagement pings that extend the last pageview, liveness stamp for onboarding.
-- ============================================================================
create or replace function public.oa_ingest(p jsonb)
returns jsonb language plpgsql security definer set search_path = analytics, public, pg_temp as $$
declare
  v_site analytics.sites%rowtype; v_visitor_id uuid; v_session_id uuid;
  v_is_new_sess boolean := false;
  v_type text := coalesce(p->>'type','pageview');
  v_path text := coalesce(p->>'path','/');
  v_ref_host text := nullif(p->>'referrer_host','');
  v_source text := nullif(p->>'source','');
  v_medium text := nullif(p->>'medium','');
  v_revenue numeric := coalesce((p->>'revenue')::numeric, 0);
  v_origin text := nullif(p->>'origin','');
  v_now timestamptz := now(); v_last_end timestamptz;
begin
  select * into v_site from analytics.sites where public_id = p->>'site';
  if not found then return jsonb_build_object('ok',false,'error','unknown_site'); end if;
  if v_site.archived_at is not null then return jsonb_build_object('ok',false,'error','site_archived'); end if;

  if v_site.allowed_origins is not null and array_length(v_site.allowed_origins,1) > 0 then
    if v_origin is null or not (
      v_origin = any(v_site.allowed_origins)
      or regexp_replace(v_origin, '^https?://(www\.)?', '') = any(v_site.allowed_origins))
    then return jsonb_build_object('ok',false,'error','origin_not_allowed'); end if;
  end if;

  if v_source is null then v_source := coalesce(v_ref_host,'direct'); end if;
  if v_medium is null then v_medium := case when v_ref_host is null then 'none' else 'referral' end; end if;

  insert into analytics.visitors (site_id, visitor_hash, first_seen_at, last_seen_at,
    first_source, first_medium, first_campaign, first_referrer, first_landing,
    country, region, city, device, os, browser)
  values (v_site.id, p->>'visitor_hash', v_now, v_now, v_source, v_medium,
    nullif(p->>'campaign',''), nullif(p->>'referrer',''), v_path,
    nullif(p->>'country',''), nullif(p->>'region',''), nullif(p->>'city',''),
    nullif(p->>'device',''), nullif(p->>'os',''), nullif(p->>'browser',''))
  on conflict (site_id, visitor_hash) do update
    set last_seen_at = v_now,
        country = coalesce(excluded.country, analytics.visitors.country),
        device  = coalesce(excluded.device,  analytics.visitors.device),
        os      = coalesce(excluded.os,      analytics.visitors.os),
        browser = coalesce(excluded.browser, analytics.visitors.browser)
  returning id into v_visitor_id;

  select id, ended_at into v_session_id, v_last_end
    from analytics.sessions where visitor_id = v_visitor_id order by started_at desc limit 1;

  if v_session_id is null or v_last_end < v_now - interval '30 minutes' then
    v_is_new_sess := true;
    insert into analytics.sessions (site_id, visitor_id, started_at, ended_at, entry_path, exit_path,
      source, medium, campaign, term, content, referrer, referrer_host,
      country, region, city, device, os, browser, screen_w, language, pageviews, is_bounce)
    values (v_site.id, v_visitor_id, v_now, v_now, v_path, v_path, v_source, v_medium,
      nullif(p->>'campaign',''), nullif(p->>'term',''), nullif(p->>'content',''),
      nullif(p->>'referrer',''), v_ref_host, nullif(p->>'country',''), nullif(p->>'region',''),
      nullif(p->>'city',''), nullif(p->>'device',''), nullif(p->>'os',''), nullif(p->>'browser',''),
      (p->>'screen_w')::int, nullif(p->>'language',''),
      case when v_type='pageview' then 1 else 0 end, true)
    returning id into v_session_id;
  else
    update analytics.sessions set ended_at = v_now,
      duration_s = greatest(0, extract(epoch from (v_now - started_at))::int),
      exit_path = v_path,
      pageviews = pageviews + case when v_type='pageview' then 1 else 0 end,
      is_bounce = (pageviews + case when v_type='pageview' then 1 else 0 end) <= 1
                  and v_type <> 'conversion' and revenue = 0
    where id = v_session_id;
  end if;

  if v_type = 'engagement' then
    update analytics.events set duration_s = greatest(duration_s, coalesce((p->>'duration_s')::int,0))
     where id = (select max(id) from analytics.events
                  where session_id = v_session_id and path = v_path and type = 'pageview');
    update analytics.sites set last_event_at = v_now where id = v_site.id;
    return jsonb_build_object('ok', true, 'engagement', true);
  end if;

  insert into analytics.events (site_id, session_id, visitor_id, type, name, path, title,
    referrer, duration_s, revenue, currency, props, created_at)
  values (v_site.id, v_session_id, v_visitor_id, v_type, nullif(p->>'name',''), v_path,
    nullif(p->>'title',''), nullif(p->>'referrer',''), coalesce((p->>'duration_s')::int,0),
    v_revenue, coalesce(nullif(p->>'currency',''), v_site.currency),
    coalesce(p->'props','{}'::jsonb), v_now);

  if p ? 'external_id' or p ? 'email' then
    update analytics.visitors set
      external_id = coalesce(nullif(p->>'external_id',''), external_id),
      email = coalesce(nullif(p->>'email',''), email),
      name  = coalesce(nullif(p->>'name_hint',''), name)
    where id = v_visitor_id;
  end if;

  if v_revenue > 0 then
    update analytics.visitors set total_revenue = total_revenue + v_revenue, is_customer = true
      where id = v_visitor_id;
    update analytics.sessions set revenue = revenue + v_revenue, is_bounce = false
      where id = v_session_id;
  end if;

  update analytics.sites set last_event_at = v_now, installed_at = coalesce(installed_at, v_now)
   where id = v_site.id;

  return jsonb_build_object('ok', true, 'session', v_session_id, 'new_session', v_is_new_sess);
end; $$;

grant execute on function public.oa_ingest(jsonb) to anon, authenticated;
