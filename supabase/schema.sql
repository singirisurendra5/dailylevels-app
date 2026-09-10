-- Run this once in your Supabase project: SQL Editor -> New query -> paste -> Run.

create extension if not exists "pgcrypto";

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('monthly','yearly')),
  status text not null default 'pending' check (status in ('pending','active','expired')),
  cf_order_id text unique,
  valid_until timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_cf_order_id_idx on public.subscriptions (cf_order_id);

alter table public.subscriptions enable row level security;

-- A signed-in trader can only ever read their own subscription rows.
create policy "Users can view their own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- No insert/update/delete policy is defined for regular users on purpose:
-- only the server (using the service role key in the API routes/webhook)
-- can create or change a subscription row. This is what stops a trader
-- from unlocking the calculator by editing data from the browser.
