

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
