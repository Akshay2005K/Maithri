-- ============================================================================
-- pHavelength — Unified Pass & Unmatch Migration
-- Safe to re-run. Run in Supabase SQL Editor.
-- ============================================================================

-- 1. Extend matches with closure columns (reusing action_state & unmatched_at/by)
alter table public.matches
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid references public.profiles(id) on delete set null,
  add column if not exists closure_reason text;

alter table public.matches
  drop constraint if exists matches_closure_reason_check;

alter table public.matches
  add constraint matches_closure_reason_check
  check (
    closure_reason is null
    or closure_reason in (
      'not_a_fit',
      'no_connection',
      'taking_a_break',
      'different_goals'
    )
  );

-- Backfill closed_at / closed_by from any legacy unmatched_at / unmatched_by rows
update public.matches
set
  closed_at = coalesce(closed_at, unmatched_at),
  closed_by = coalesce(closed_by, unmatched_by)
where unmatched_at is not null and closed_at is null;

-- 2. Atomic action_state mutator (service_role only)
create or replace function public.set_match_action(
  p_match_id uuid,
  p_user_id uuid,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_current text;
  v_next_state jsonb;
begin
  if p_action not in ('like', 'save', 'pass', 'clear', 'dismiss_unmatched') then
    raise exception 'INVALID_ACTION: Unsupported match action %.', p_action;
  end if;

  select * into v_match
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'MATCH_NOT_FOUND: Match does not exist.';
  end if;

  if v_match.user_a <> p_user_id and v_match.user_b <> p_user_id then
    raise exception 'NOT_PARTICIPANT: Caller is not a participant of this match.';
  end if;

  v_current := coalesce(v_match.action_state, '{}'::jsonb)->>p_user_id::text;

  if p_action = 'pass' then
    if v_match.closed_at is not null then
      raise exception 'MATCH_CLOSED: This match is already closed.';
    end if;

    if exists (select 1 from public.messages where match_id = p_match_id) then
      raise exception 'PASS_HAS_MESSAGES: Cannot pass once messages exist; use unmatch instead.';
    end if;

    update public.matches
    set action_state = jsonb_set(
      coalesce(action_state, '{}'::jsonb),
      array[p_user_id::text],
      '"pass"'::jsonb,
      true
    )
    where id = p_match_id
    returning action_state into v_next_state;

    return v_next_state;
  end if;

  if p_action = 'clear' then
    if v_current = 'unmatched' then
      raise exception 'CANNOT_CLEAR_UNMATCHED: Unmatch cannot be undone.';
    end if;

    if v_current in ('pass', 'like', 'save') then
      update public.matches
      set action_state = coalesce(action_state, '{}'::jsonb) - p_user_id::text
      where id = p_match_id
      returning action_state into v_next_state;
      return v_next_state;
    end if;

    return coalesce(v_match.action_state, '{}'::jsonb);
  end if;

  if p_action = 'dismiss_unmatched' then
    if v_match.closed_at is null then
      raise exception 'MATCH_NOT_CLOSED: Can only remove a closed match from your list.';
    end if;

    update public.matches
    set action_state = jsonb_set(
      coalesce(action_state, '{}'::jsonb),
      array[p_user_id::text],
      '"unmatched"'::jsonb,
      true
    )
    where id = p_match_id
    returning action_state into v_next_state;

    return v_next_state;
  end if;

  -- 'like' or 'save'
  if v_current = 'unmatched' then
    raise exception 'CANNOT_MODIFY_UNMATCHED: Match is already unmatched.';
  end if;

  update public.matches
  set action_state = jsonb_set(
    coalesce(action_state, '{}'::jsonb),
    array[p_user_id::text],
    to_jsonb(p_action),
    true
  )
  where id = p_match_id
  returning action_state into v_next_state;

  return v_next_state;
end;
$$;

-- 3. Atomic unmatch function (service_role only)
create or replace function public.unmatch_match(
  p_match_id uuid,
  p_user_id uuid,
  p_reason text
)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
begin
  if p_reason not in ('not_a_fit', 'no_connection', 'taking_a_break', 'different_goals') then
    raise exception 'INVALID_REASON: Invalid unmatch reason.';
  end if;

  select * into v_match
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'MATCH_NOT_FOUND: Match does not exist.';
  end if;

  if v_match.user_a <> p_user_id and v_match.user_b <> p_user_id then
    raise exception 'NOT_PARTICIPANT: Caller is not a participant of this match.';
  end if;

  if v_match.closed_at is not null then
    raise exception 'ALREADY_CLOSED: This match is already closed.';
  end if;

  if not exists (select 1 from public.messages where match_id = p_match_id) then
    raise exception 'UNMATCH_REQUIRES_MESSAGES: Use pass when no messages exist.';
  end if;

  update public.matches
  set
    closed_at = now(),
    closed_by = p_user_id,
    closure_reason = p_reason,
    unmatched_at = now(),
    unmatched_by = p_user_id,
    action_state = jsonb_set(
      coalesce(action_state, '{}'::jsonb),
      array[p_user_id::text],
      '"unmatched"'::jsonb,
      true
    )
  where id = p_match_id
  returning * into v_match;

  delete from public.date_plans where match_id = p_match_id;

  return v_match;
end;
$$;

-- 4. Lock down mutator functions to service_role only
revoke all on function public.set_match_action(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.set_match_action(uuid, uuid, text) to service_role;

revoke all on function public.unmatch_match(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.unmatch_match(uuid, uuid, text) to service_role;

-- 5. RLS helper functions for messages (authenticated)
create or replace function public.can_read_match(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.matches m
    where m.id = p_match_id
      and auth.uid() in (m.user_a, m.user_b)
      and not exists (
        select 1
        from public.reports_blocks rb
        where (rb.reporter_id = m.user_a and rb.reported_id = m.user_b)
           or (rb.reporter_id = m.user_b and rb.reported_id = m.user_a)
      )
  );
$$;

create or replace function public.can_send_in_match(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.can_read_match(p_match_id)
    and exists (
      select 1
      from public.matches m
      where m.id = p_match_id
        and m.closed_at is null
        and m.unmatched_at is null
        and coalesce(m.action_state->>m.user_a::text, '') not in ('pass', 'unmatched')
        and coalesce(m.action_state->>m.user_b::text, '') not in ('pass', 'unmatched')
    );
$$;

revoke all on function public.can_read_match(uuid) from public, anon;
grant execute on function public.can_read_match(uuid) to authenticated;

revoke all on function public.can_send_in_match(uuid) from public, anon;
grant execute on function public.can_send_in_match(uuid) to authenticated;

-- 6. Update messages RLS policies using can_read_match & can_send_in_match
drop policy if exists "read match messages" on public.messages;
create policy "read match messages" on public.messages
  for select to authenticated
  using (public.can_read_match(match_id));

drop policy if exists "send own messages" on public.messages;
create policy "send own messages" on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and public.can_send_in_match(match_id)
    and trim(content) <> ''
    and array_length(regexp_split_to_array(trim(content), '\s+'), 1) >= 4
  );

drop policy if exists "mark partner messages read" on public.messages;
create policy "mark partner messages read" on public.messages
  for update to authenticated
  using (
    sender_id <> auth.uid()
    and public.can_read_match(match_id)
  )
  with check (
    sender_id <> auth.uid()
  );
