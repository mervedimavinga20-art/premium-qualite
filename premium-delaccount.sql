-- PREMIUM QUALITÉ : suppression de son propre compte (à lancer une fois)
create or replace function delete_account() returns text language plpgsql security definer set search_path=public,auth as $$
declare u uuid:=auth.uid();begin
 if u is null then return 'interdit';end if;
 if exists(select 1 from admins where user_id=u) then return 'admin';end if;
 delete from shops where id in (select shop_id from members where user_id=u and role='owner');
 delete from auth.users where id=u;
 return 'ok';end$$;
revoke all on function delete_account() from public,anon;grant execute on function delete_account() to authenticated;
