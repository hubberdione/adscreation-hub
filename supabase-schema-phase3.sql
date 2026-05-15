-- Phase 3 migration: image generation fields + Storage bucket.
-- Run this AFTER the Phase 1 schema. Safe to re-run (uses IF NOT EXISTS).

-- 1) Add columns to products and generation_runs
alter table products
  add column if not exists reference_subfolder text;

alter table generation_runs
  add column if not exists product_id uuid references products(id) on delete set null;

alter table generation_runs
  add column if not exists prompt text;

alter table generation_runs
  add column if not exists image_url text;

alter table generation_runs
  add column if not exists aspect_ratio text;

alter table generation_runs
  add column if not exists creative_brief text;

alter table generation_runs
  add column if not exists reference_files jsonb;

alter table generation_runs
  add column if not exists error text;

-- 2) Create the Storage bucket for rendered images (public-read)
insert into storage.buckets (id, name, public)
values ('renders', 'renders', true)
on conflict (id) do nothing;

-- 3) Storage policies: anyone can read; only the service role can write.
-- (Service role bypasses RLS automatically; this policy explicitly disables
--  the public-write path that would otherwise be available via anon key.)
drop policy if exists "renders public read" on storage.objects;
create policy "renders public read"
  on storage.objects for select
  using (bucket_id = 'renders');

drop policy if exists "renders service write" on storage.objects;
create policy "renders service write"
  on storage.objects for insert
  with check (bucket_id = 'renders' and auth.role() = 'service_role');

drop policy if exists "renders service update" on storage.objects;
create policy "renders service update"
  on storage.objects for update
  using (bucket_id = 'renders' and auth.role() = 'service_role');
