-- Rôle Vendeur (seller) : à exécuter une fois dans Supabase > SQL Editor
do $$declare c record;begin
 for c in select con.conname,rel.relname from pg_constraint con join pg_class rel on rel.oid=con.conrelid where con.contype='c' and rel.relname in ('members','journal') and pg_get_constraintdef(con.oid) ilike '%role%' loop
  execute format('alter table %I drop constraint %I',c.relname,c.conname);
 end loop;
end$$;
alter table members add constraint members_role_chk check (role in ('owner','manager','seller'));
drop function if exists add_manager(uuid,text);
create or replace function add_manager(s uuid,mail text,r text default 'manager') returns text language plpgsql security definer set search_path=public as $$declare u uuid;begin
 if not exists(select 1 from members where shop_id=s and user_id=auth.uid() and role='owner') then return 'interdit';end if;
 if r not in ('manager','seller') then return 'interdit';end if;
 if not is_premium(s) then return 'premium';end if;
 select id into u from auth.users where lower(email)=lower(mail);if u is null then return 'inconnu';end if;
 update members set role=r where shop_id=s and user_id=u;
 if not found then insert into members values(s,u,lower(mail),r);end if;return 'ok';end$$;
