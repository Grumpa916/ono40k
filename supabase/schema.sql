-- Run this once in the Supabase SQL editor.
-- Each signed-in user can read and write only their own row.

create table if not exists public.account_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at bigint not null
);

grant select, insert, update, delete on table public.account_saves to authenticated;

alter table public.account_saves enable row level security;

drop policy if exists "account_saves_own" on public.account_saves;
create policy "account_saves_own"
  on public.account_saves
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
