begin;

create table if not exists public.daily_pick_history (
  viewer_id uuid not null references public.profiles(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  shown_on date not null,
  primary key (viewer_id, match_id)
);
alter table public.daily_pick_history enable row level security;
revoke all on public.daily_pick_history from public, anon, authenticated;
grant select, insert, update on public.daily_pick_history to service_role;
create index if not exists daily_pick_history_viewer_date
  on public.daily_pick_history (viewer_id, shown_on);

-- Before this migration the one shared date was shown to both participants.
insert into public.daily_pick_history (viewer_id, match_id, shown_on)
select participant.viewer_id, m.id, m.match_date
from public.matches m
cross join lateral (values (m.user_a), (m.user_b)) as participant(viewer_id)
where not exists (select 1 from public.daily_pick_history h where h.match_id = m.id)
on conflict do nothing;

create or replace function public.allocate_daily_picks(
  p_viewer uuid, p_day date, p_cap integer, p_candidates jsonb
)
returns setof public.matches
language plpgsql
set search_path = ''
as $$
declare
  candidate record;
  pair public.matches%rowtype;
  remaining integer;
  last_shown date;
begin
  -- Serialize allocations, including simultaneous requests from opposite sides
  -- of a pair. Match actions and conversations continue to use the shared row.
  perform pg_catalog.pg_advisory_xact_lock(547381, 1);
  select p_cap - count(*) into remaining from public.daily_pick_history
    where viewer_id = p_viewer and shown_on = p_day;

  for candidate in
    select c.partner_id, c.score
    from pg_catalog.jsonb_to_recordset(p_candidates) as c(partner_id uuid, score integer)
    left join lateral (
      select max(h.shown_on) as shown_on
      from public.daily_pick_history h
      join public.matches m on m.id = h.match_id
      where h.viewer_id = p_viewer
        and ((m.user_a = p_viewer and m.user_b = c.partner_id)
          or (m.user_b = p_viewer and m.user_a = c.partner_id))
    ) history on true
    where history.shown_on is null or history.shown_on <= p_day - 2
    order by history.shown_on asc nulls first, c.score desc, c.partner_id
  loop
    exit when remaining <= 0;
    if exists (
      select 1 from public.reports_blocks b
      where (b.reporter_id = p_viewer and b.reported_id = candidate.partner_id)
         or (b.reported_id = p_viewer and b.reporter_id = candidate.partner_id)
    ) then continue; end if;

    select m.* into pair from public.matches m
      where (m.user_a = p_viewer and m.user_b = candidate.partner_id)
         or (m.user_b = p_viewer and m.user_a = candidate.partner_id)
      order by m.created_at, m.id limit 1 for update;

    if not found then
      insert into public.matches (user_a, user_b, compatibility_score, match_date)
        values (p_viewer, candidate.partner_id, candidate.score, p_day)
        returning * into pair;
    elsif pair.closed_at is not null or pair.unmatched_at is not null
       or coalesce(pair.action_state, '{}'::jsonb) <> '{}'::jsonb
       or exists (select 1 from public.messages where match_id = pair.id) then
      continue;
    end if;

    select h.shown_on into last_shown from public.daily_pick_history h
      where h.viewer_id = p_viewer and h.match_id = pair.id;
    if last_shown is not null and last_shown > p_day - 2 then continue; end if;

    insert into public.daily_pick_history (viewer_id, match_id, shown_on)
      values (p_viewer, pair.id, p_day)
      on conflict (viewer_id, match_id) do update set shown_on = excluded.shown_on;
    remaining := remaining - 1;
  end loop;

  return query select m.*
    from public.matches m join public.daily_pick_history h on h.match_id = m.id
    where h.viewer_id = p_viewer and h.shown_on = p_day;
end;
$$;

revoke execute on function public.allocate_daily_picks(uuid, date, integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.allocate_daily_picks(uuid, date, integer, jsonb)
  to service_role;

commit;
