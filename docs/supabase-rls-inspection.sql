-- Read-only RLS inspection queries for Family Bench.
-- Run these before applying case-intelligence migrations to a remote project.

-- Current policies on Family Bench public tables.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'cases',
    'children',
    'people',
    'entries',
    'attachments',
    'court_orders',
    'court_order_provisions',
    'entry_children',
    'entry_people',
    'entry_court_order_provisions',
    'filing_packages',
    'filing_package_entries',
    'filing_package_attachments',
    'key_dates',
    'pattern_tags',
    'advisor_threads',
    'ai_outputs',
    'ai_output_sources'
  )
order by tablename, policyname;

-- Current RLS enabled/forced status.
select
  n.nspname as schemaname,
  c.relname as tablename,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'cases',
    'children',
    'people',
    'entries',
    'attachments',
    'court_orders',
    'court_order_provisions',
    'entry_children',
    'entry_people',
    'entry_court_order_provisions',
    'filing_packages',
    'filing_package_entries',
    'filing_package_attachments',
    'key_dates',
    'pattern_tags',
    'advisor_threads',
    'ai_outputs',
    'ai_output_sources'
  )
order by c.relname;
