-- Team nudges & reactions for Compound.
-- A nudge is a lightweight poke/cheer from one teammate to another. Inserting a
-- row lights up the recipient's realtime channel (and, with the push infra from
-- 0001, can trigger a web-push notification).
--
-- RLS: a user may only insert a nudge FROM themselves, and only to a teammate
-- they actually share a team with. Recipients (and senders) can read their own.

create table if not exists public.nudges (
  id         uuid primary key default gen_random_uuid(),
  from_user  uuid not null references auth.users (id) on delete cascade,
  to_user    uuid not null references auth.users (id) on delete cascade,
  team_id    uuid not null references public.teams (id) on delete cascade,
  emoji      text not null default '👋',
  created_at timestamptz not null default now()
);

create index if not exists nudges_to_user_idx on public.nudges (to_user, created_at desc);
create index if not exists nudges_team_id_idx on public.nudges (team_id);

alter table public.nudges enable row level security;

-- Helper: is the given user a member of the given team?
-- Used by the insert policy so a user can only nudge people on their own team.
create or replace function public.is_team_member(target_team uuid, target_user uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.team_members
    where team_id = target_team and user_id = target_user
  );
$$;

-- Sender can insert only nudges that come from themselves, to a teammate on a
-- team they both belong to.
create policy "send nudge to teammate"
  on public.nudges for insert
  with check (
    auth.uid() = from_user
    and public.is_team_member(team_id, from_user)
    and public.is_team_member(team_id, to_user)
  );

-- Either party to a nudge can read it.
create policy "read own nudges"
  on public.nudges for select
  using (auth.uid() = from_user or auth.uid() = to_user);

-- Make sure realtime broadcasts inserts on this table.
alter publication supabase_realtime add table public.nudges;
