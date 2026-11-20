-- ============================================================================
-- pHavelength — Profile & Settings Redesign Migrations
-- Run in Supabase SQL Editor
-- ============================================================================

-- PART A: House Rules acceptance timestamp
alter table public.profiles
  add column if not exists house_rules_accepted_at timestamptz;

-- PART B: birth_date, details jsonb, and gender / looking_for values migration
alter table public.profiles
  add column if not exists birth_date date;

alter table public.profiles
  add column if not exists details jsonb not null default '{}'::jsonb;

alter table public.profiles
  drop constraint if exists profiles_details_is_object_check;

alter table public.profiles
  add constraint profiles_details_is_object_check
  check (jsonb_typeof(details) = 'object');

-- Backfill birth_date for existing rows that only had age
update public.profiles
set birth_date = make_date(extract(year from current_date)::int - age, 6, 15)
where birth_date is null and age is not null;

-- Drop any previous gender / looking_for check constraints before mapping values
alter table public.profiles
  drop constraint if exists profiles_gender_check;

alter table public.profiles
  drop constraint if exists profiles_looking_for_check;

-- Map existing gender values:
-- 'M' -> 'man', 'F' -> 'woman', 'Other' / 'NB' / anything else -> 'beyond_binary'
update public.profiles
set gender = case
  when lower(trim(gender)) in ('m', 'male', 'man') then 'man'
  when lower(trim(gender)) in ('f', 'female', 'woman') then 'woman'
  else 'beyond_binary'
end;

-- Map existing looking_for (interested-in) values:
-- 'M' -> 'men', 'F' -> 'women', 'Other' / 'NB' / 'beyond_binary' -> 'beyond_binary', 'All' / anything else -> 'everyone'
update public.profiles
set looking_for = case
  when lower(trim(looking_for)) in ('m', 'male', 'man', 'men') then 'men'
  when lower(trim(looking_for)) in ('f', 'female', 'woman', 'women') then 'women'
  when lower(trim(looking_for)) in ('other', 'nb', 'beyond_binary') then 'beyond_binary'
  else 'everyone'
end;

alter table public.profiles
  add constraint profiles_gender_check
  check (gender in ('man', 'woman', 'beyond_binary'));

alter table public.profiles
  add constraint profiles_looking_for_check
  check (looking_for in ('men', 'women', 'beyond_binary', 'everyone'));
