-- Cashfree Sandbox Payments & Plan Expiry Migration
-- Safe to re-run. Do NOT run against live DB from agent; run in Supabase SQL Editor.

alter table public.profiles
  add column if not exists plan_expires_at timestamptz;

-- Extend plan guard trigger so both plan and plan_expires_at can only be set/updated
-- by service_role (API routes) or postgres (SQL Editor).
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
    if new.plan_expires_at is not null then
      raise exception 'plan_expires_at can only be set by the server.';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.plan is distinct from old.plan then
      raise exception 'plan can only be updated by the server.';
    end if;
    if new.plan_expires_at is distinct from old.plan_expires_at then
      raise exception 'plan_expires_at can only be updated by the server.';
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

-- Payments table (Cashfree sandbox orders & payment records)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('plus', 'pro')),
  amount_inr numeric not null,
  currency text not null default 'INR',
  cashfree_order_id text not null unique,
  status text not null default 'created' check (status in ('created', 'paid', 'failed', 'expired')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists idx_payments_user_created
  on public.payments (user_id, created_at desc);

alter table public.payments enable row level security;

drop policy if exists "read own payments" on public.payments;
create policy "read own payments"
  on public.payments
  for select
  to authenticated
  using (auth.uid() = user_id);
