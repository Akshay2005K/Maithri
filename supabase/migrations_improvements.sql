-- ============================================================================
-- pHavelength — Stage 2 & 3 Improvements Migration
-- Run in Supabase SQL Editor
-- ============================================================================

-- Stage 2: Allow 'friendship' (Friendship-first) in profiles.relationship_goal
alter table public.profiles
  drop constraint if exists profiles_relationship_goal_check;

alter table public.profiles
  add constraint profiles_relationship_goal_check
  check (relationship_goal in ('friendship', 'casual', 'open', 'long_term', 'marriage'));

-- Stage 2 bugfix: Track unmatched state on matches so unmatched pairs are hidden
-- and never re-matched in future daily runs.
alter table public.matches
  add column if not exists unmatched_at timestamptz,
  add column if not exists unmatched_by uuid references public.profiles(id) on delete set null;

-- ============================================================================
-- Stage 3: Backend & RLS Hardening
-- ============================================================================

-- 1. Block reading or sending messages if either user blocked the other or unmatched
drop policy if exists "read match messages" on public.messages;
create policy "read match messages" on public.messages
  for select to authenticated
  using (
    exists (
      select 1
      from public.matches m
      where m.id = match_id
        and auth.uid() in (m.user_a, m.user_b)
        and m.unmatched_at is null
        and not exists (
          select 1
          from public.reports_blocks rb
          where (rb.reporter_id = m.user_a and rb.reported_id = m.user_b)
             or (rb.reporter_id = m.user_b and rb.reported_id = m.user_a)
        )
    )
  );

drop policy if exists "send own messages" on public.messages;
create policy "send own messages" on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.matches m
      where m.id = match_id
        and auth.uid() in (m.user_a, m.user_b)
        and m.unmatched_at is null
        and not exists (
          select 1
          from public.reports_blocks rb
          where (rb.reporter_id = m.user_a and rb.reported_id = m.user_b)
             or (rb.reporter_id = m.user_b and rb.reported_id = m.user_a)
        )
    )
    and trim(content) <> ''
    and array_length(regexp_split_to_array(trim(content), '\s+'), 1) >= 4
  );

-- 2. Enforce 18+ birth_date and protect is_plus_mock from direct browser edits
create or replace function public.enforce_profile_guards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.birth_date is not null then
    if new.birth_date > (current_date - interval '18 years')::date then
      raise exception 'You must be 18 or older to use pHavelength.';
    end if;
  end if;

  if auth.role() = 'authenticated' then
    if tg_op = 'INSERT' then
      new.is_plus_mock := false;
    elsif tg_op = 'UPDATE' and new.is_plus_mock is distinct from old.is_plus_mock then
      raise exception 'is_plus_mock can only be updated by the server.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_guards on public.profiles;
create trigger trg_enforce_profile_guards
  before insert or update on public.profiles
  for each row
  execute function public.enforce_profile_guards();

-- ============================================================================
-- Stage 4: Like/Pass/Save, Incognito mode, and Deal-breakers
-- ============================================================================
alter table public.matches
  add column if not exists action_state jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists is_incognito boolean not null default false,
  add column if not exists deal_breakers jsonb not null default '{}'::jsonb;

-- Batch A+: Read receipts on messages
alter table public.messages
  add column if not exists read_at timestamptz;

drop policy if exists "mark partner messages read" on public.messages;
create policy "mark partner messages read" on public.messages
  for update to authenticated
  using (
    sender_id <> auth.uid()
    and exists (
      select 1
      from public.matches m
      where m.id = match_id
        and auth.uid() in (m.user_a, m.user_b)
        and m.unmatched_at is null
    )
  )
  with check (
    sender_id <> auth.uid()
  );

-- ============================================================================
-- Batch C: Supabase Storage bucket & media paths for photos + voice intros
-- ============================================================================
alter table public.profiles
  add column if not exists photo_paths jsonb,
  add column if not exists voice_intro_path text;

insert into storage.buckets (id, name, public)
values ('profile-media', 'profile-media', false)
on conflict (id) do nothing;
