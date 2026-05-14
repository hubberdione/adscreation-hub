-- Run this in Supabase SQL editor once after creating the project.
-- Safe to re-run: drops and recreates everything.

drop table if exists competitor_references cascade;
drop table if exists generation_runs cascade;
drop table if exists products cascade;
drop table if exists brands cascade;

create table brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  drive_folder_id text,
  dna_prompt text,
  created_at timestamptz default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  name text not null,
  status text not null check (status in ('pre_order','sale','sold_out','draft')),
  description text,
  hero_color text,
  price_usd numeric,
  one_liner text,
  hero_benefits jsonb,
  banned_terms jsonb,
  created_at timestamptz default now()
);

create table generation_runs (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  run_type text check (run_type in ('static','video','vsl','ugc','motion')),
  status text check (status in ('queued','running','complete','failed')),
  cost_usd numeric default 0,
  created_at timestamptz default now()
);

create table competitor_references (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references brands(id) on delete cascade,
  source_type text not null check (source_type in ('ad_library_url','drive_asset','text_copy','auto_scrape')),
  url text,
  drive_file_id text,
  copy_text text,
  competitor_name text,
  notes text,
  is_winner boolean default false,
  created_at timestamptz default now(),
  constraint one_source_only check (
    (url is not null)::int +
    (drive_file_id is not null)::int +
    (copy_text is not null)::int <= 1
  )
);

-- RLS disabled in Phase 1 (no auth). Enable + add policies in Phase 2.
alter table brands disable row level security;
alter table products disable row level security;
alter table generation_runs disable row level security;
alter table competitor_references disable row level security;
