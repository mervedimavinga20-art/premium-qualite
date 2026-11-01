-- PREMIUM QUALITÉ : plusieurs boutiques par propriétaire (à lancer une fois dans SQL Editor)
-- Un seul abonnement Premium couvre toutes les boutiques d'un même propriétaire.
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
