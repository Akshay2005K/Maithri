

-- FEATURE 1: Relationship goal tag
alter table public.profiles
  add column if not exists relationship_goal text
  check (relationship_goal in ('casual', 'open', 'long_term', 'marriage'));

-- FEATURE 2: Profile prompts + first message replies to a prompt
alter table public.profiles
  add column if not exists prompts jsonb not null default '[]'::jsonb;

alter table public.messages
  add column if not exists reply_to_prompt_key text;

-- FEATURE 3: Share Date plan link
create table if not exists public.date_plans (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  place_name text not null,
  plan_time timestamptz not null,
  share_token text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.date_plans enable row level security;

drop policy if exists "read match date plans" on public.date_plans;
create policy "read match date plans" on public.date_plans
  for select to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and auth.uid() in (m.user_a, m.user_b)
    )
  );

drop policy if exists "create match date plans at level 3" on public.date_plans;
create policy "create match date plans at level 3" on public.date_plans
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id and auth.uid() in (m.user_a, m.user_b)
    )
    and (
      select count(*)
      from public.messages msg
      where msg.match_id = date_plans.match_id
        and trim(msg.content) <> ''
        and array_length(regexp_split_to_array(trim(msg.content), '\s+'), 1) >= 4
    ) >= 3
    and (
      select count(distinct msg.sender_id)
      from public.messages msg
      where msg.match_id = date_plans.match_id
        and trim(msg.content) <> ''
        and array_length(regexp_split_to_array(trim(msg.content), '\s+'), 1) >= 4
    ) >= 2
  );

drop policy if exists "delete match date plans" on public.date_plans;
create policy "delete match date plans" on public.date_plans
  for delete to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id and auth.uid() in (m.user_a, m.user_b)
    )
  );

-- ============================================================================
-- SECURITY HARDENING (Free SQL + Server-Side Matching Upgrades)
-- ============================================================================

-- 1. Lock down profiles SELECT to owner only (server /api/matches handles matching)
drop policy if exists "read profiles" on public.profiles;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

-- 2. Remove browser INSERT on matches (only server /api/matches can create matches)
drop policy if exists "create own matches" on public.matches;

-- 3. Enforce 4+ word minimum on messages INSERT inside PostgreSQL RLS
drop policy if exists "send own messages" on public.messages;
create policy "send own messages" on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id and auth.uid() in (m.user_a, m.user_b)
    )
    and trim(content) <> ''
    and array_length(regexp_split_to_array(trim(content), '\s+'), 1) >= 4
  );

-- 4. Enforce "first message in a match must reply to a partner prompt" via trigger
create or replace function public.enforce_first_message_prompt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  msg_count int;
  partner_id uuid;
  partner_prompts jsonb;
begin
  select count(*) into msg_count
  from public.messages
  where match_id = new.match_id;

  if msg_count = 0 then
    select case when m.user_a = new.sender_id then m.user_b else m.user_a end
    into partner_id
    from public.matches m
    where m.id = new.match_id;

    select p.prompts into partner_prompts
    from public.profiles p
    where p.id = partner_id;

    if jsonb_array_length(coalesce(partner_prompts, '[]'::jsonb)) > 0 then
      if new.reply_to_prompt_key is null or trim(new.reply_to_prompt_key) = '' then
        raise exception 'First message in a match must reply to one of your match prompts.';
      end if;

      if not exists (
        select 1
        from jsonb_array_elements(partner_prompts) as item
        where item->>'key' = new.reply_to_prompt_key
      ) then
        raise exception 'Selected prompt does not belong to this match.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_first_message_prompt on public.messages;
create trigger trg_enforce_first_message_prompt
  before insert on public.messages
  for each row
  execute function public.enforce_first_message_prompt();
