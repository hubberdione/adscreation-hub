-- Phase 3.5: Direct product photo upload (no Drive needed for first use).
-- Run AFTER phase 3. Safe to re-run.

alter table products
  add column if not exists reference_image_urls jsonb default '[]'::jsonb;

insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

drop policy if exists "product-photos public read" on storage.objects;
create policy "product-photos public read"
  on storage.objects for select
  using (bucket_id = 'product-photos');

drop policy if exists "product-photos service write" on storage.objects;
create policy "product-photos service write"
  on storage.objects for insert
  with check (bucket_id = 'product-photos' and auth.role() = 'service_role');

drop policy if exists "product-photos service delete" on storage.objects;
create policy "product-photos service delete"
  on storage.objects for delete
  using (bucket_id = 'product-photos' and auth.role() = 'service_role');

drop policy if exists "product-photos service update" on storage.objects;
create policy "product-photos service update"
  on storage.objects for update
  using (bucket_id = 'product-photos' and auth.role() = 'service_role');
