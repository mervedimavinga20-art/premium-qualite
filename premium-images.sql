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
