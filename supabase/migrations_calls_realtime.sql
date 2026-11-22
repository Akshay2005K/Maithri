-- ============================================================================
-- pHavelength — Enable Supabase Realtime for public.calls
-- Safe to re-run. Run in Supabase SQL Editor AFTER migrations_calls.sql.
-- ============================================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'calls'
  ) then
    alter publication supabase_realtime add table public.calls;
  end if;
end
$$;
