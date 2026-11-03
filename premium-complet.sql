-- PREMIUM QUALITÉ : base complète pour un NOUVEAU projet Supabase (à lancer une fois dans SQL Editor)
-- 1) Remplace TON_EMAIL tout en bas par l'email de ton compte admin (créé avant dans Authentication > Users)
create table if not exists shops(id uuid primary key default gen_random_uuid(),name text not null,data jsonb not null default '{}'::jsonb,rev int not null default 0,updated_at timestamptz not null default now(),plan text not null default 'free',plan_until timestamptz,created_at timestamptz default now());
create table if not exists members(shop_id uuid references shops on delete cascade,user_id uuid references auth.users on delete cascade,email text,role text not null check (role in ('owner','manager','seller')),primary key(shop_id,user_id));
create table if not exists journal(id bigint generated always as identity primary key,shop_id uuid references shops on delete cascade,email text,role text,action text,detail text,at timestamptz not null default now());
create index if not exists journal_shop_at on journal(shop_id,at desc);
create table if not exists admins(user_id uuid primary key references auth.users on delete cascade);
create table if not exists app_config(key text primary key,value text);
create table if not exists payment_requests(id bigint generated always as identity primary key,shop_id uuid references shops on delete cascade,user_id uuid default auth.uid(),email text,months int not null,amount numeric not null,tx text not null unique,phone text,status text not null default 'pending',created_at timestamptz default now(),decided_at timestamptz);
alter table shops enable row level security;alter table members enable row level security;alter table journal enable row level security;alter table admins enable row level security;alter table app_config enable row level security;alter table payment_requests enable row level security;
create or replace function is_member(s uuid) returns boolean language sql security definer stable set search_path=public as $$select exists(select 1 from members where shop_id=s and user_id=auth.uid())$$;
create or replace function is_admin() returns boolean language sql security definer stable set search_path=public as $$select exists(select 1 from admins where user_id=auth.uid())$$;
create or replace function is_premium(s uuid) returns boolean language sql security definer stable set search_path=public as $$
 select exists(select 1 from shops x join members mo on mo.shop_id=x.id and mo.role='owner'
  where x.plan='premium' and x.plan_until>now() and mo.user_id in (select user_id from members where shop_id=s and role='owner'))$$;
create or replace function plan_info(s uuid) returns jsonb language plpgsql security definer stable set search_path=public as $$declare u timestamptz;begin
 if not is_member(s) then return null;end if;
 select max(x.plan_until) into u from shops x join members mo on mo.shop_id=x.id and mo.role='owner'
  where x.plan='premium' and mo.user_id in (select user_id from members where shop_id=s and role='owner');
 return jsonb_build_object('plan',case when u>now() then 'premium' else 'free' end,'until',u);end$$;
create or replace function create_shop(n text,d jsonb) returns uuid language plpgsql security definer set search_path=public as $$declare i uuid;begin
 if auth.uid() is null then raise exception 'non connecte';end if;
 if exists(select 1 from members where user_id=auth.uid() and role='owner')
  and not exists(select 1 from shops s join members m on m.shop_id=s.id where m.user_id=auth.uid() and m.role='owner' and s.plan='premium' and s.plan_until>now())
 then raise exception 'premium_requis';end if;
 insert into shops(name,data) values(n,d) returning id into i;
 insert into members values(i,auth.uid(),(select email from auth.users where id=auth.uid()),'owner');return i;end$$;
create or replace function shop_guard() returns trigger language plpgsql security definer set search_path=public as $$
declare n int; prem boolean;
begin
 if tg_op='INSERT' and auth.uid() is not null then new.plan:='free'; new.plan_until:=null; end if;
 if tg_op='UPDATE' and auth.uid() is not null and not is_admin() then new.plan:=old.plan; new.plan_until:=old.plan_until; end if;
 prem:=(new.plan='premium' and new.plan_until>now()) or (tg_op='UPDATE' and is_premium(new.id));
 if not prem then
  select coalesce(sum(jsonb_array_length(b->'rows')),0) into n from jsonb_array_elements(coalesce(new.data->'books','[]'::jsonb)) b;
  if n>50 then raise exception 'limite_gratuite'; end if;
 end if;
 return new;
end$$;
drop policy if exists shops_sel on shops;create policy shops_sel on shops for select using(is_member(id));
drop policy if exists shops_upd on shops;create policy shops_upd on shops for update using(is_member(id)) with check(is_member(id));
drop policy if exists mem_sel on members;create policy mem_sel on members for select using(is_member(shop_id));
drop policy if exists jr_ins on journal;create policy jr_ins on journal for insert with check(is_member(shop_id));
drop policy if exists jr_sel on journal;create policy jr_sel on journal for select using(is_member(shop_id) and is_premium(shop_id));
drop policy if exists cfg_sel on app_config;create policy cfg_sel on app_config for select to authenticated using(true);
drop policy if exists pr_sel on payment_requests;create policy pr_sel on payment_requests for select using(is_member(shop_id) or is_admin());
insert into app_config values('mpesa_number','0839892839'),('price_month','10') on conflict(key) do update set value=excluded.value;
drop trigger if exists shop_guard_t on shops;
create trigger shop_guard_t before insert or update on shops for each row execute function shop_guard();
create or replace function add_manager(s uuid,mail text,r text default 'manager') returns text language plpgsql security definer set search_path=public as $$declare u uuid;begin
 if not exists(select 1 from members where shop_id=s and user_id=auth.uid() and role='owner') then return 'interdit';end if;
 if r not in ('manager','seller') then return 'interdit';end if;
 if not is_premium(s) then return 'premium';end if;
 select id into u from auth.users where lower(email)=lower(mail);if u is null then return 'inconnu';end if;
 if exists(select 1 from members where shop_id=s and user_id=u and role='owner') then return 'interdit';end if;
 update members set role=r where shop_id=s and user_id=u;
 if not found then insert into members values(s,u,lower(mail),r);end if;return 'ok';end$$;
create or replace function request_payment(s uuid,m int,t text,p text) returns text language plpgsql security definer set search_path=public as $$begin
 if not exists(select 1 from members where shop_id=s and user_id=auth.uid() and role='owner') then return 'interdit';end if;
 if m<1 or m>24 or length(trim(t))<4 then return 'invalide';end if;
 if exists(select 1 from payment_requests where lower(tx)=lower(trim(t))) then return 'tx_utilise';end if;
 insert into payment_requests(shop_id,email,months,amount,tx,phone) values(s,(select email from auth.users where id=auth.uid()),m,m*coalesce((select value::numeric from app_config where key='price_month'),10),trim(t),p);
 return 'ok';end$$;
create or replace function approve_payment(rid bigint) returns text language plpgsql security definer set search_path=public as $$declare sid uuid;mm int;begin
 if not is_admin() then return 'interdit';end if;
 update payment_requests set status='approved',decided_at=now() where id=rid and status='pending' returning shop_id,months into sid,mm;
 if sid is null then return 'introuvable';end if;
 update shops set plan='premium',plan_until=greatest(coalesce(plan_until,now()),now())+make_interval(days=>mm*30) where id=sid;
 return 'ok';end$$;
create or replace function reject_payment(rid bigint) returns text language plpgsql security definer set search_path=public as $$begin
 if not is_admin() then return 'interdit';end if;
 update payment_requests set status='rejected',decided_at=now() where id=rid and status='pending';return 'ok';end$$;
do $$begin alter publication supabase_realtime add table shops;exception when others then null;end$$;
-- ADMIN : remplace TON_EMAIL puis lance
insert into admins(user_id) select id from auth.users where lower(email)=lower('TON_EMAIL') on conflict do nothing;
create table if not exists catalogs(shop_id uuid primary key references shops on delete cascade,slug text unique not null,name text,phone text,cur text,items jsonb not null default '[]'::jsonb,updated_at timestamptz not null default now());
alter table catalogs enable row level security;
create or replace function publish_catalog(s uuid,sl text,nm text,ph text,cu text,it jsonb) returns text language plpgsql security definer set search_path=public as $$begin
 if not exists(select 1 from members where shop_id=s and user_id=auth.uid() and role in ('owner','manager')) then return 'interdit';end if;
 if not is_premium(s) then return 'premium';end if;
 sl:=lower(coalesce(sl,''));if sl !~ '^[a-z0-9-]{3,40}$' then return 'invalide';end if;
 if jsonb_typeof(it)<>'array' or jsonb_array_length(it)>500 then return 'invalide';end if;
 insert into catalogs(shop_id,slug,name,phone,cur,items,updated_at) values(s,sl,left(nm,80),left(ph,30),left(cu,5),it,now())
 on conflict(shop_id) do update set slug=excluded.slug,name=excluded.name,phone=excluded.phone,cur=excluded.cur,items=excluded.items,updated_at=now();
 return 'ok';
exception when unique_violation then return 'slug_pris';end$$;
create or replace function unpublish_catalog(s uuid) returns text language plpgsql security definer set search_path=public as $$begin
 if not exists(select 1 from members where shop_id=s and user_id=auth.uid() and role in ('owner','manager')) then return 'interdit';end if;
 delete from catalogs where shop_id=s;return 'ok';end$$;
create or replace function get_catalog(sl text) returns jsonb language sql security definer stable set search_path=public as $$
 select jsonb_build_object('n',c.name,'ph',c.phone,'cu',c.cur,'it',c.items,'at',c.updated_at) from catalogs c where c.slug=lower(sl) and is_premium(c.shop_id) limit 1$$;
grant execute on function get_catalog(text) to anon,authenticated;
-- PREMIUM QUALITÉ : photos du catalogue (à lancer une fois dans SQL Editor)
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('catalog','catalog',true,307200,array['image/jpeg','image/webp'])
on conflict(id) do update set public=true,file_size_limit=307200,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists cat_img_ins on storage.objects;
create policy cat_img_ins on storage.objects for insert to authenticated
 with check(bucket_id='catalog' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' and is_member(((storage.foldername(name))[1])::uuid) and is_premium(((storage.foldername(name))[1])::uuid));
drop policy if exists cat_img_upd on storage.objects;
create policy cat_img_upd on storage.objects for update to authenticated
 using(bucket_id='catalog' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' and is_member(((storage.foldername(name))[1])::uuid));
drop policy if exists cat_img_del on storage.objects;
create policy cat_img_del on storage.objects for delete to authenticated
 using(bucket_id='catalog' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' and is_member(((storage.foldername(name))[1])::uuid));
-- PREMIUM QUALITÉ : chat d'équipe (à lancer une fois dans SQL Editor)
create table if not exists messages(id bigint generated always as identity primary key,shop_id uuid not null references shops on delete cascade,user_id uuid not null default auth.uid(),email text,role text,body text not null check (char_length(body) between 1 and 1000),at timestamptz not null default now());
create index if not exists messages_shop_at on messages(shop_id,at desc);
alter table messages enable row level security;
drop policy if exists msg_sel on messages;
create policy msg_sel on messages for select using(is_member(shop_id));
drop policy if exists msg_ins on messages;
create policy msg_ins on messages for insert with check(is_member(shop_id) and user_id=auth.uid() and is_premium(shop_id));
do $$begin alter publication supabase_realtime add table messages;exception when others then null;end$$;
