begin;

alter table public.matches alter column match_date
  set default ((now() at time zone 'Asia/Kolkata')::date);

update storage.buckets set public = false where id = 'profile-media';

create or replace function public.enforce_profile_media_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('service_role', 'postgres') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.photo_paths is not null or new.voice_intro_path is not null then
      raise exception 'Media references can only be set by the server.';
    end if;
  elsif new.photo_paths is distinct from old.photo_paths
     or new.voice_intro_path is distinct from old.voice_intro_path then
    raise exception 'Media references can only be updated by the server.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_profile_media_guard on public.profiles;
create trigger trg_enforce_profile_media_guard
  before insert or update on public.profiles
  for each row execute function public.enforce_profile_media_guard();

create table if not exists public.profile_media_cleanup (
  owner_id uuid not null,
  object_path text not null,
  primary key (owner_id, object_path),
  check (split_part(object_path, '/', 1) = owner_id::text)
);
alter table public.profile_media_cleanup enable row level security;
revoke all on public.profile_media_cleanup from public, anon, authenticated;
grant select, delete on public.profile_media_cleanup to service_role;

create or replace function public.queue_replaced_profile_media()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profile_media_cleanup (owner_id, object_path)
    select old.id, media.path
    from (values
      (old.photo_paths ->> 'full', new.photo_paths ->> 'full'),
      (old.photo_paths ->> 'blur2', new.photo_paths ->> 'blur2'),
      (old.photo_paths ->> 'blur1', new.photo_paths ->> 'blur1'),
      (old.voice_intro_path, new.voice_intro_path)
    ) as media(path, replacement)
    where media.path is distinct from media.replacement
      and split_part(media.path, '/', 1) = old.id::text
    on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_queue_replaced_profile_media on public.profiles;
create trigger trg_queue_replaced_profile_media
  after update of photo_paths, voice_intro_path on public.profiles
  for each row execute function public.queue_replaced_profile_media();

create or replace function public.apply_cashfree_payment(payment_id uuid)
returns table (payment_status text, expires_at timestamptz)
language plpgsql
set search_path = public
as $$
declare
  payment_row public.payments%rowtype;
  profile_row public.profiles%rowtype;
  confirmed_at timestamptz := now();
  next_expiry timestamptz;
begin
  select * into strict payment_row from public.payments
    where id = payment_id for update;

  if payment_row.status <> 'created' then
    return query select payment_row.status, null::timestamptz;
    return;
  end if;

  select * into strict profile_row from public.profiles
    where id = payment_row.user_id for update;

  next_expiry := case
    when profile_row.plan = payment_row.plan and profile_row.plan_expires_at > confirmed_at
      then profile_row.plan_expires_at
    else confirmed_at
  end + interval '720 hours';

  update public.profiles set plan = payment_row.plan, plan_expires_at = next_expiry
    where id = profile_row.id;
  update public.payments set status = 'paid', paid_at = confirmed_at
    where id = payment_row.id;

  return query select 'paid'::text, next_expiry;
end;
$$;

revoke execute on function public.apply_cashfree_payment(uuid) from public, anon, authenticated;
grant execute on function public.apply_cashfree_payment(uuid) to service_role;

commit;
