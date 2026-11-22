-- ============================================================================
-- pHavelength — Daily Audio/Video Calls Migration
-- Safe to re-run. Run in Supabase SQL Editor BEFORE migrations_calls_realtime.sql.
-- ============================================================================

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  caller_id uuid not null references public.profiles(id) on delete cascade,
  callee_id uuid not null references public.profiles(id) on delete cascade,
  call_type text not null check (call_type in ('audio', 'video')),
  status text not null check (status in ('ringing', 'active', 'ended', 'declined', 'missed')),
  room_name text not null,
  room_url text not null,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_calls_match_created
  on public.calls (match_id, created_at desc);

alter table public.calls enable row level security;

-- Only participants of the match (not blocked) can read call rows.
-- No INSERT, UPDATE, or DELETE policies for authenticated/anon:
-- all call writes happen strictly on the server via service_role.
drop policy if exists "read match calls" on public.calls;
create policy "read match calls" on public.calls
  for select to authenticated
  using (
    auth.uid() in (caller_id, callee_id)
    and public.can_read_match(match_id)
  );
