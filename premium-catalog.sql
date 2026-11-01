-- PREMIUM QUALITÉ : mini-catalogue web public (à lancer une fois dans SQL Editor)
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
