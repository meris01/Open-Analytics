-- ============================================================================
-- OPTIONAL: demo data generator. Safe to skip in production.
--   select public.oa_seed_demo('demo', 62);
--   select public.oa_seed_live('demo', 60);
-- Or just run `npm run seed`.
-- ============================================================================
create or replace function public.oa_seed_demo(p_site text default 'demo', p_days int default 62)
returns text language plpgsql security definer set search_path = analytics, public, pg_temp as $$
declare
  sid uuid := public.oa_site_id(p_site);
  d int; i int; n_sessions int;
  ts timestamptz; vh text; vid uuid; sess uuid;
  src text; med text; camp text; refh text; ctry text; dev text; osn text; brw text; lang text;
  entry text; pv int; j int; cur_path text; conv boolean; amt numeric;
  growth numeric; dow int;
  first_name text; last_name text; comp text; mail text;
  sources text[] := array['google','direct','x.com','reddit.com','newsletter','linkedin.com','producthunt.com','bing.com','news.ycombinator.com','github.com'];
  weights int[]  := array[42,18,12,8,5,4,3,3,3,2];
  campaigns text[] := array['q4-holiday-promo','retargeting-v2','launch-week','brand-terms','newsletter-sponsor'];
  countries text[] := array['US','GB','DE','IN','CA','AU','FR','NL','BR','JP','SE','SG'];
  cweights int[]   := array[34,13,9,9,7,5,5,4,4,4,3,3];
  paths text[] := array['/','/pricing','/blog/open-source-analytics','/blog/revenue-attribution-guide','/docs','/docs/tracking-script','/demo-request','/changelog','/about','/support/faq'];
  pweights int[] := array[30,17,12,9,8,6,6,4,4,4];
  devices text[] := array['desktop','mobile','tablet'];
  dweights int[] := array[62,33,5];
  fnames text[] := array['Jane','Marcus','Priya','Tom','Lena','Diego','Amara','Sven','Yuki','Noah','Elena','Karim','Sofia','Ben','Mei'];
  lnames text[] := array['Doe','Whitfield','Raman','Alvarez','Novak','Okafor','Lindqvist','Tanaka','Bergman','Haddad','Rossi','Kowalski','Chen','Meyer','Silva'];
  comps  text[] := array['Acme Enterprises','Vanguard X','Starlight Labs','Nova Dynamics','Quantum Box','Northwind','Helios Group','Beacon Co','Orbit Works','Lumen Studio','Foundry 9','Tidewater'];
begin
  if sid is null then return 'unknown site'; end if;
  delete from analytics.events where site_id = sid;
  delete from analytics.sessions where site_id = sid;
  delete from analytics.visitors where site_id = sid;
  delete from analytics.seo_queries where site_id = sid;

  for d in reverse (p_days - 1)..0 loop
    growth := 0.62 + (0.38 * (p_days - d)::numeric / p_days);
    dow := extract(dow from (now() - make_interval(days => d)))::int;
    if dow in (0,6) then growth := growth * 0.68; end if;
    n_sessions := greatest(20, round((240 + random()*140) * growth)::int);

    for i in 1..n_sessions loop
      ts := date_trunc('day', now() - make_interval(days => d))
            + make_interval(hours => (case when random() < 0.72 then 8 + floor(random()*12) else floor(random()*24) end)::int,
                            mins => floor(random()*60)::int, secs => floor(random()*60)::int);
      if ts > now() then continue; end if;

      src  := (select s from unnest(sources, weights) as t(s,w), lateral generate_series(1,w) order by random() limit 1);
      ctry := (select s from unnest(countries, cweights) as t(s,w), lateral generate_series(1,w) order by random() limit 1);
      dev  := (select s from unnest(devices, dweights) as t(s,w), lateral generate_series(1,w) order by random() limit 1);
      entry:= (select s from unnest(paths, pweights) as t(s,w), lateral generate_series(1,w) order by random() limit 1);

      med := case src when 'direct' then 'none' when 'google' then 'organic' when 'bing.com' then 'organic'
                      when 'newsletter' then 'email' else 'referral' end;
      camp := case when random() < 0.22 then campaigns[1 + floor(random()*array_length(campaigns,1))::int] else null end;
      refh := case when src = 'direct' then null else src end;
      osn := case dev when 'mobile' then (case when random()<0.55 then 'iOS' else 'Android' end)
                      when 'tablet' then 'iOS'
                      else (case when random()<0.45 then 'macOS' when random()<0.8 then 'Windows' else 'Linux' end) end;
      brw := case when random()<0.58 then 'Chrome' when random()<0.78 then 'Safari'
                  when random()<0.9 then 'Firefox' else 'Edge' end;
      lang := case ctry when 'DE' then 'de-DE' when 'FR' then 'fr-FR' when 'BR' then 'pt-BR'
                        when 'JP' then 'ja-JP' when 'SE' then 'sv-SE' else 'en-US' end;

      vid := null;
      if random() < 0.30 then
        select v.id into vid from analytics.visitors v where v.site_id = sid order by random() limit 1;
      end if;
      if vid is null then
        vh := md5(random()::text || clock_timestamp()::text);
        insert into analytics.visitors (site_id, visitor_hash, first_seen_at, last_seen_at, first_source,
          first_medium, first_campaign, first_referrer, first_landing, country, device, os, browser)
        values (sid, vh, ts, ts, src, med, camp, refh, entry, ctry, dev, osn, brw) returning id into vid;
      else
        update analytics.visitors set last_seen_at = greatest(last_seen_at, ts) where id = vid;
      end if;

      pv := 1 + floor(random() * (case when src in ('google','newsletter','direct') then 5 else 3 end))::int;
      conv := random() < (case when src='newsletter' then 0.085 when src='direct' then 0.062
                               when src='google' then 0.041 when src='producthunt.com' then 0.030
                               when src='linkedin.com' then 0.028 else 0.014 end) * growth;
      if conv and pv < 3 then pv := 3; end if;

      insert into analytics.sessions (site_id, visitor_id, started_at, ended_at, duration_s, pageviews,
        is_bounce, entry_path, exit_path, source, medium, campaign, referrer, referrer_host, country,
        device, os, browser, screen_w, language)
      values (sid, vid, ts, ts + make_interval(secs => (pv*45 + floor(random()*120))::int),
        (pv*45 + floor(random()*120))::int, pv, pv = 1 and not conv, entry, entry, src, med, camp,
        case when refh is null then null else 'https://'||refh||'/' end, refh, ctry, dev, osn, brw,
        case dev when 'mobile' then 390 when 'tablet' then 820 else 1512 end, lang)
      returning id into sess;

      cur_path := entry;
      for j in 1..pv loop
        insert into analytics.events (site_id, session_id, visitor_id, type, path, title, duration_s, created_at, referrer)
        values (sid, sess, vid, 'pageview', cur_path, initcap(replace(trim(both '/' from cur_path),'-',' ')),
          20 + floor(random()*160)::int, ts + make_interval(secs => ((j-1)*50)::int),
          case when refh is null then null else 'https://'||refh||'/' end);
        if conv and j = 2 then cur_path := '/pricing';
        elsif conv and j = 3 then cur_path := '/checkout';
        else cur_path := (select s from unnest(paths, pweights) as t(s,w), lateral generate_series(1,w) order by random() limit 1);
        end if;
      end loop;
      update analytics.sessions set exit_path = cur_path where id = sess;

      if random() < 0.16 or conv then
        insert into analytics.events (site_id, session_id, visitor_id, type, name, path, created_at)
        values (sid, sess, vid, 'event', 'signup_started', '/pricing', ts + interval '110 seconds');
      end if;
      if random() < 0.06 then
        insert into analytics.events (site_id, session_id, visitor_id, type, name, path, created_at)
        values (sid, sess, vid, 'conversion', 'demo_request', '/demo-request', ts + interval '150 seconds');
      end if;

      if conv then
        amt := (array[29,49,79,99,149,249,499])[1 + floor(random()*7)::int];
        first_name := fnames[1 + floor(random()*array_length(fnames,1))::int];
        last_name  := lnames[1 + floor(random()*array_length(lnames,1))::int];
        comp := comps[1 + floor(random()*array_length(comps,1))::int];
        mail := lower(first_name)||'.'||lower(last_name)||'@'||lower(regexp_replace(comp,'[^a-zA-Z]','','g'))||'.com';
        insert into analytics.events (site_id, session_id, visitor_id, type, name, path, created_at)
        values (sid, sess, vid, 'event', 'signup_completed', '/checkout', ts + interval '160 seconds');
        insert into analytics.events (site_id, session_id, visitor_id, type, name, path, revenue, currency, created_at, props)
        values (sid, sess, vid, 'conversion', 'purchase', '/checkout', amt, 'USD', ts + interval '185 seconds',
          jsonb_build_object('plan', case when amt>=249 then 'enterprise' when amt>=99 then 'pro' else 'starter' end));
        update analytics.sessions set revenue = revenue + amt, is_bounce = false where id = sess;
        update analytics.visitors set total_revenue = total_revenue + amt, is_customer = true,
          email = coalesce(email, mail), name = coalesce(name, comp),
          external_id = coalesce(external_id, 'cus_'||substr(md5(random()::text),1,12)) where id = vid;
      end if;
    end loop;

    insert into analytics.seo_queries (site_id, date, query, page, clicks, impressions, ctr, position)
    select sid, (now() - make_interval(days => d))::date, q.k, q.p,
           round(q.c * growth * (0.8 + random()*0.4))::int,
           round(q.im * growth * (0.8 + random()*0.4))::int,
           round((q.c::numeric / nullif(q.im,0)), 4),
           round((q.pos + (random()-0.5)*1.5)::numeric, 2)
    from (values
      ('open source web analytics','/',420,14200,1.4),
      ('google analytics alternative','/',380,22800,6.2),
      ('privacy friendly analytics','/pricing',190,7400,3.1),
      ('revenue attribution tool','/blog/revenue-attribution-guide',145,5100,2.8),
      ('self hosted analytics','/docs',210,8800,4.4),
      ('cookieless tracking script','/docs/tracking-script',130,4600,5.1),
      ('gdpr compliant tracker','/pricing',95,3900,7.3),
      ('datafast alternative','/',88,2100,2.2),
      ('website analytics for saas','/blog/open-source-analytics',160,6200,8.9),
      ('utm tracking dashboard','/docs',72,3300,11.4)
    ) as q(k,p,c,im,pos);
  end loop;

  return format('seeded %s sessions / %s events / %s visitors',
    (select count(*) from analytics.sessions where site_id=sid),
    (select count(*) from analytics.events where site_id=sid),
    (select count(*) from analytics.visitors where site_id=sid));
end; $$;

create or replace function public.oa_seed_live(p_site text default 'demo', p_n int default 60)
returns text language plpgsql security definer set search_path = analytics, public, pg_temp as $$
declare
  sid uuid := public.oa_site_id(p_site); i int; sess uuid; vid uuid; ts timestamptz; pth text;
  paths text[] := array['/','/pricing','/blog/open-source-analytics','/docs','/docs/tracking-script','/demo-request','/changelog'];
begin
  if sid is null then return 'unknown site'; end if;
  for i in 1..p_n loop
    select s.id, s.visitor_id into sess, vid from analytics.sessions s where s.site_id = sid order by random() limit 1;
    ts := now() - make_interval(secs => floor(random() * 1500)::int);
    pth := paths[1 + floor(random()*array_length(paths,1))::int];
    insert into analytics.events (site_id, session_id, visitor_id, type, path, title, created_at)
    values (sid, sess, vid, 'pageview', pth, initcap(replace(trim(both '/' from pth),'-',' ')), ts);
    update analytics.sessions set ended_at = greatest(ended_at, ts) where id = sess;
  end loop;
  return format('%s live events injected', p_n);
end; $$;

revoke all on function public.oa_seed_demo(text,int) from public, anon, authenticated;
revoke all on function public.oa_seed_live(text,int) from public, anon, authenticated;
