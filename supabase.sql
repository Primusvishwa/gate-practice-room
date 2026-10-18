-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run
create table if not exists public.store (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
-- Lock the table: only the server (secret key) can read or write it.
alter table public.store enable row level security;
