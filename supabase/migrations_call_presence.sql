-- Apply after migrations_calls.sql and migrations_calls_realtime.sql.
create table if not exists public.call_presence (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  connected_at timestamptz not null,
  expires_at timestamptz not null,
  closed boolean not null default false,
  primary key (user_id, session_id)
);

alter table public.call_presence enable row level security;
revoke all on public.call_presence from anon, authenticated;
grant select, insert, update, delete on public.call_presence to service_role;

create or replace function public.refresh_call_presence(
  p_user_id uuid, p_session_id uuid, p_leaving boolean
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  observed_at timestamptz := clock_timestamp();
  online_since timestamptz;
begin
  delete from public.call_presence
    where user_id = p_user_id and expires_at < observed_at - interval '2 minutes';

  select coalesce(min(connected_at), observed_at) into online_since
    from public.call_presence
    where user_id = p_user_id and expires_at > observed_at and not closed;

  insert into public.call_presence as presence (user_id, session_id, connected_at, expires_at, closed)
    values (p_user_id, p_session_id, online_since,
      observed_at + case when p_leaving then interval '0 seconds' else interval '35 seconds' end,
      p_leaving)
  on conflict (user_id, session_id) do update
    set connected_at = case when presence.expires_at <= observed_at
          then excluded.connected_at else presence.connected_at end,
        expires_at = case when p_leaving then observed_at
          else greatest(presence.expires_at, excluded.expires_at) end,
        closed = p_leaving
    where not presence.closed;
end;
$$;

revoke all on function public.refresh_call_presence(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.refresh_call_presence(uuid, uuid, boolean) to service_role;

create index if not exists idx_calls_callee_status on public.calls (callee_id, status, created_at desc);
create index if not exists idx_calls_caller_status on public.calls (caller_id, status, created_at desc);
