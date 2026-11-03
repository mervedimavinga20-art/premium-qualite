-- PREMIUM QUALITÉ : durcissement sécurité (à lancer une fois, sans danger si relancé)
-- 1) Identité imposée par le serveur : impossible d'écrire un message ou une ligne de journal au nom d'un autre
create or replace function stamp_member() returns trigger language plpgsql security definer set search_path=public as $$
declare m members;begin
 select * into m from members where shop_id=new.shop_id and user_id=auth.uid();
 if m.user_id is null then raise exception 'interdit';end if;
 new.email:=m.email;new.role:=m.role;return new;end$$;
drop trigger if exists stamp_msg on messages;create trigger stamp_msg before insert on messages for each row execute function stamp_member();
drop trigger if exists stamp_jr on journal;create trigger stamp_jr before insert on journal for each row execute function stamp_member();
create or replace function cut_journal() returns trigger language plpgsql as $$begin new.action:=left(new.action,60);new.detail:=left(new.detail,300);return new;end$$;
drop trigger if exists cut_jr on journal;create trigger cut_jr before insert on journal for each row execute function cut_journal();
-- 2) Le journal n'est lisible que par le propriétaire et les gérants (pas les vendeurs)
drop policy if exists jr_sel on journal;
create policy jr_sel on journal for select using(is_premium(shop_id) and exists(select 1 from members where shop_id=journal.shop_id and user_id=auth.uid() and role in ('owner','manager')));
-- 3) Demandes de paiement : longueurs limitées et 3 demandes en attente maximum par utilisateur
create or replace function request_payment(s uuid,m int,t text,p text) returns text language plpgsql security definer set search_path=public as $$begin
 if not exists(select 1 from members where shop_id=s and user_id=auth.uid() and role='owner') then return 'interdit';end if;
 if m<1 or m>24 or t is null or length(trim(t))<4 or length(trim(t))>40 or length(coalesce(p,''))>20 then return 'invalide';end if;
 if (select count(*) from payment_requests where user_id=auth.uid() and status='pending')>=3 then return 'trop_de_demandes';end if;
 if exists(select 1 from payment_requests where lower(tx)=lower(trim(t))) then return 'tx_utilise';end if;
 insert into payment_requests(shop_id,email,months,amount,tx,phone) values(s,(select email from auth.users where id=auth.uid()),m,m*coalesce((select value::numeric from app_config where key='price_month'),10),trim(t),left(p,20));
 return 'ok';end$$;
-- 4) Photos : les membres peuvent lister le dossier de leur boutique (nécessaire pour effacer les photos à la suppression)
drop policy if exists cat_img_sel on storage.objects;
create policy cat_img_sel on storage.objects for select to authenticated
 using(bucket_id='catalog' and (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' and is_member(((storage.foldername(name))[1])::uuid));
-- 5) Fonctions internes non appelables par le public anonyme
revoke execute on function approve_payment(bigint),reject_payment(bigint),request_payment(uuid,int,text,text),add_manager(uuid,text,text),create_shop(text,jsonb),publish_catalog(uuid,text,text,text,text,jsonb),unpublish_catalog(uuid),plan_info(uuid) from public,anon;
grant execute on function approve_payment(bigint),reject_payment(bigint),request_payment(uuid,int,text,text),add_manager(uuid,text,text),create_shop(text,jsonb),publish_catalog(uuid,text,text,text,text,jsonb),unpublish_catalog(uuid),plan_info(uuid) to authenticated;
