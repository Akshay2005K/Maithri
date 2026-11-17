alter table profiles enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;
alter table reports_blocks enable row level security;

-- profiles: anyone logged in can read (needed for matching), only owner can write
create policy "read profiles" on profiles for select to authenticated using (true);
create policy "insert own profile" on profiles for insert to authenticated with check (auth.uid() = id);
create policy "update own profile" on profiles for update to authenticated using (auth.uid() = id);

-- matches: only the two participants
create policy "read own matches" on matches for select to authenticated
  using (auth.uid() in (user_a, user_b));
create policy "create own matches" on matches for insert to authenticated
  with check (auth.uid() in (user_a, user_b));

-- messages: only participants of the match can read; sender must be me
create policy "read match messages" on messages for select to authenticated
  using (exists (select 1 from matches m where m.id = match_id and auth.uid() in (m.user_a, m.user_b)));
create policy "send own messages" on messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (select 1 from matches m where m.id = match_id and auth.uid() in (m.user_a, m.user_b))
  );

-- reports/blocks: reporter only
create policy "read own reports" on reports_blocks for select to authenticated using (auth.uid() = reporter_id);
create policy "create own reports" on reports_blocks for insert to authenticated with check (auth.uid() = reporter_id);
