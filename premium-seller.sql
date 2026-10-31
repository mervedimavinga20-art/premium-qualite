-- PREMIUM QUALITÉ : rôle Vendeur (à lancer une fois dans Supabase > SQL Editor)
do $$declare c text;begin
 for c in select conname from pg_constraint where conrelid='public.members'::regclass and contype='c' loop
  execute format('alter table public.members drop constraint %I',c);
 end loop;
end$$;
alter table members add constraint members_role_chk check (role in ('owner','manager','seller'));
drop function if exists add_manager(uuid,text);
create or replace function add_manager(s uuid,mail text,r text default 'manager') returns text language plpgsql security definer set search_path=public as $$declare u uuid;begin
 if not exists(select 1 from members where shop_id=s and user_id=auth.uid() and role='owner') then return 'interdit';end if;
 if r not in ('manager','seller') then return 'interdit';end if;
 if not is_premium(s) then return 'premium';end if;
 select id into u from auth.users where lower(email)=lower(mail);if u is null then return 'inconnu';end if;
 if exists(select 1 from members where shop_id=s and user_id=u and role='owner') then return 'interdit';end if;
 update members set role=r where shop_id=s and user_id=u;
 if not found then insert into members values(s,u,lower(mail),r);end if;return 'ok';end$$;
