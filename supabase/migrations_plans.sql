-- Plans migration: Free / Plus / Pro
-- Safe to re-run. Do NOT run against live DB from agent; run in Supabase SQL Editor.

alter table public.profiles
  add column if not exists plan text not null default 'free';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_plan_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_plan_check
      check (plan in ('free', 'plus', 'pro'));
  end if;
end
$$;

-- Backfill from legacy is_plus_mock column if it exists
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'is_plus_mock'
  ) then
    update public.profiles
    set plan = 'plus'
    where is_plus_mock = true
      and plan = 'free';
  end if;
end
$$;

-- Keep is_plus_mock during transition; drop later when ready:
-- alter table public.profiles drop column if exists is_plus_mock;

-- Guard profiles.plan so only service_role (API routes) or postgres (SQL Editor) can set/change it
create or replace function public.enforce_profile_plan_guard()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  jwt_role text;
begin
  jwt_role := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    auth.role()
  );

  if jwt_role = 'service_role' or current_user = 'postgres' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.plan is distinct from 'free' then
      raise exception 'plan can only be set by the server.';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.plan is distinct from old.plan then
      raise exception 'plan can only be updated by the server.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_plan_guard on public.profiles;
create trigger trg_enforce_profile_plan_guard
  before insert or update on public.profiles
  for each row
  execute function public.enforce_profile_plan_guard();
