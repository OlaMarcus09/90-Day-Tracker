-- Push subscriptions for Compound daily reminders.
-- One row per browser/device a user has opted in on (a user can have several).
-- RLS ensures a user can only ever see or touch their own subscriptions.

create table if not exists public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  team_id      uuid references public.teams (id) on delete set null,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  reminder_hour smallint not null default 8 check (reminder_hour between 0 and 23),
  timezone     text not null default 'UTC',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);
create index if not exists push_subscriptions_reminder_hour_idx on public.push_subscriptions (reminder_hour);

alter table public.push_subscriptions enable row level security;

-- Users manage only their own rows.
create policy "own subscriptions - select"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

create policy "own subscriptions - insert"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "own subscriptions - update"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own subscriptions - delete"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);
