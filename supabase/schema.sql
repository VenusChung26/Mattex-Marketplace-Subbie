-- Mattex Marketplace — persist catalog, supplier metrics, accounts, cart, RFQs.
-- Run once in the Supabase SQL Editor.

create table if not exists app_kv (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists supplier_metrics (
  slug text primary key,
  rating numeric not null default 0,
  completion_rate int not null default 0,
  on_time_rate int not null default 0,
  search_count int not null default 0,
  found_count int not null default 0,
  rfq_count int not null default 0,
  empty boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table app_kv enable row level security;
alter table products enable row level security;
alter table supplier_metrics enable row level security;

drop policy if exists "kv_all" on app_kv;
create policy "kv_all" on app_kv for all using (true) with check (true);

drop policy if exists "products_all" on products;
create policy "products_all" on products for all using (true) with check (true);

drop policy if exists "metrics_all" on supplier_metrics;
create policy "metrics_all" on supplier_metrics for all using (true) with check (true);
