create table if not exists public.bots (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  name        text not null,
  client_id   text not null default '',
  status      text not null default 'stopped',
  created_at  timestamptz not null default now(),
  uptime      text
);

alter table public.bots enable row level security;

create policy "Users manage own bots"
  on public.bots
  for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

create index bots_user_id_idx on public.bots (user_id);
