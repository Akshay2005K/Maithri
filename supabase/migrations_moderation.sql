begin;
alter table public.reports_blocks
  add column if not exists moderation_status text not null default 'open'
  check (moderation_status in ('open', 'in_review', 'resolved'));

create table if not exists public.account_moderation (
  user_id uuid primary key references auth.users(id) on delete cascade,
  suspended boolean not null,
  notice text not null
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid,
  user_id uuid not null,
  actor_id uuid not null,
  action text not null,
  reason text not null,
  notice text,
  created_at timestamptz not null default now()
);
create index if not exists moderation_actions_user_created
  on public.moderation_actions (user_id, created_at desc);
create index if not exists reports_blocks_moderation_queue
  on public.reports_blocks (moderation_status, created_at desc, id);

alter table public.account_moderation enable row level security;
alter table public.moderation_actions enable row level security;
revoke all on public.account_moderation, public.moderation_actions from anon, authenticated;
grant select, insert, update on public.account_moderation to service_role;
grant select, insert on public.moderation_actions to service_role;

create or replace function public.can_read_match(p_match_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.matches m
    where m.id = p_match_id
      and auth.uid() in (m.user_a, m.user_b)
      and not exists (
        select 1 from public.account_moderation a
        where a.suspended and a.user_id in (m.user_a, m.user_b)
      )
      and not exists (
        select 1 from public.reports_blocks rb
        where (rb.reporter_id = m.user_a and rb.reported_id = m.user_b)
           or (rb.reporter_id = m.user_b and rb.reported_id = m.user_a)
      )
  );
$$;

-- Existing clients may submit a report, but only the moderation API can set its status.
drop policy if exists "create own reports" on public.reports_blocks;
create policy "create own reports" on public.reports_blocks
  for insert to authenticated with check (
    auth.uid() = reporter_id and moderation_status = 'open'
  );

create or replace function public.prevent_suspended_call()
returns trigger language plpgsql set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(least(new.caller_id, new.callee_id)::text, 42));
  perform pg_advisory_xact_lock(hashtextextended(greatest(new.caller_id, new.callee_id)::text, 42));
  if exists (
    select 1 from public.account_moderation
    where suspended and user_id in (new.caller_id, new.callee_id)
  ) then
    raise exception 'Calling is unavailable for this match.' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists prevent_suspended_call on public.calls;
create trigger prevent_suspended_call before insert on public.calls
  for each row when (new.status in ('ringing', 'active'))
  execute function public.prevent_suspended_call();

create or replace function public.moderate_report(
  p_report uuid, p_actor uuid, p_action text, p_reason text, p_notice text
)
returns text[] language plpgsql set search_path = ''
as $$
declare
  report public.reports_blocks%rowtype;
  rooms text[] := '{}';
begin
  select * into strict report from public.reports_blocks where id = p_report for update;
  if p_action not in ('review', 'dismiss', 'warn', 'suspend', 'restore')
    or coalesce(length(trim(p_reason)), 0) not between 1 and 1000
    or (p_action in ('warn', 'suspend', 'restore')
      and coalesce(length(trim(p_notice)), 0) not between 1 and 1000)
    or report.reported_id = p_actor then
    raise exception 'Invalid moderation decision' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(report.reported_id::text, 42));

  if p_action = 'restore' then
    update public.account_moderation set suspended = false, notice = p_notice
      where user_id = report.reported_id and suspended;
    if not found then raise exception 'Account is not suspended' using errcode = '22023'; end if;
  elsif report.moderation_status = 'resolved' then
    raise exception 'Report already resolved' using errcode = '22023';
  elsif p_action in ('warn', 'suspend') then
    insert into public.account_moderation as existing (user_id, suspended, notice)
      values (report.reported_id, p_action = 'suspend', p_notice)
    on conflict (user_id) do update
      set suspended = existing.suspended or excluded.suspended,
          notice = case when existing.suspended and p_action = 'warn'
            then existing.notice else excluded.notice end;
  end if;

  if p_action <> 'restore' then
    update public.reports_blocks
      set moderation_status = case when p_action = 'review' then 'in_review' else 'resolved' end
      where id = p_report;
  end if;

  insert into public.moderation_actions (report_id, user_id, actor_id, action, reason, notice)
    values (p_report, report.reported_id, p_actor, p_action, p_reason, p_notice);
  if p_action = 'suspend' then
    with ended as (
      update public.calls set status = 'ended', ended_at = clock_timestamp()
      where status in ('ringing', 'active')
        and report.reported_id in (caller_id, callee_id)
      returning room_name
    )
    select coalesce(array_agg(room_name), '{}') into rooms from ended;
  end if;
  return rooms;
end;
$$;
revoke all on function public.moderate_report(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.moderate_report(uuid, uuid, text, text, text) to service_role;
commit;
