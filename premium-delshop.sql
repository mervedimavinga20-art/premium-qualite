-- PREMIUM QUALITÉ : suppression d'une boutique par son propriétaire (à lancer une fois)
create or replace function delete_shop(s uuid) returns text language plpgsql security definer set search_path=public as $$
declare u uuid:=auth.uid();n int;sh shops;begin
 if u is null or not exists(select 1 from members where shop_id=s and user_id=u and role='owner') then return 'interdit';end if;
 select count(*) into n from members where user_id=u and role='owner';
 if n<2 then return 'derniere';end if;
 select * into sh from shops where id=s;
 if sh.plan='premium' and sh.plan_until>now() then return 'premium_active';end if;
 delete from shops where id=s;return 'ok';end$$;
revoke all on function delete_shop(uuid) from public,anon;grant execute on function delete_shop(uuid) to authenticated;
