-- PREMIUM QUALITÉ : chat d'équipe (à lancer une fois dans SQL Editor)
create table if not exists messages(id bigint generated always as identity primary key,shop_id uuid not null references shops on delete cascade,user_id uuid not null default auth.uid(),email text,role text,body text not null check (char_length(body) between 1 and 1000),at timestamptz not null default now());
create index if not exists messages_shop_at on messages(shop_id,at desc);
alter table messages enable row level security;
drop policy if exists msg_sel on messages;
create policy msg_sel on messages for select using(is_member(shop_id));
drop policy if exists msg_ins on messages;
create policy msg_ins on messages for insert with check(is_member(shop_id) and user_id=auth.uid() and is_premium(shop_id));
do $$begin alter publication supabase_realtime add table messages;exception when others then null;end$$;
