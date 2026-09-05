-- DO NOT APPLY UNTIL RLS INSPECTION IS COMPLETE.
--
-- This migration is intentionally separated from the schema foundation because
-- catalog-level RLS inspection is currently blocked. Before applying this file,
-- run docs/supabase-rls-inspection.sql against the target Supabase project and
-- review existing policies, grants, and RLS enabled status.

alter table public.cases enable row level security;
alter table public.children enable row level security;
alter table public.people enable row level security;
alter table public.entries enable row level security;
alter table public.attachments enable row level security;
alter table public.court_orders enable row level security;
alter table public.court_order_provisions enable row level security;
alter table public.entry_children enable row level security;
alter table public.entry_people enable row level security;
alter table public.entry_court_order_provisions enable row level security;
alter table public.filing_packages enable row level security;
alter table public.filing_package_entries enable row level security;
alter table public.filing_package_attachments enable row level security;
alter table public.key_dates enable row level security;
alter table public.pattern_tags enable row level security;
alter table public.advisor_threads enable row level security;
alter table public.ai_outputs enable row level security;
alter table public.ai_output_sources enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table
  public.cases,
  public.children,
  public.people,
  public.entries,
  public.attachments,
  public.court_orders,
  public.court_order_provisions,
  public.entry_children,
  public.entry_people,
  public.entry_court_order_provisions,
  public.filing_packages,
  public.filing_package_entries,
  public.filing_package_attachments,
  public.key_dates,
  public.pattern_tags,
  public.advisor_threads,
  public.ai_outputs,
  public.ai_output_sources
to authenticated;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
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
  ]
  loop
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = table_name || '_owner_select'
    ) then
      execute format(
        'create policy %I on public.%I for select to authenticated using (auth.uid() is not null and user_id = auth.uid())',
        table_name || '_owner_select',
        table_name
      );
    end if;

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = table_name || '_owner_insert'
    ) then
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (auth.uid() is not null and user_id = auth.uid())',
        table_name || '_owner_insert',
        table_name
      );
    end if;

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = table_name || '_owner_update'
    ) then
      execute format(
        'create policy %I on public.%I for update to authenticated using (auth.uid() is not null and user_id = auth.uid()) with check (auth.uid() is not null and user_id = auth.uid())',
        table_name || '_owner_update',
        table_name
      );
    end if;

    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = table_name || '_owner_delete'
    ) then
      execute format(
        'create policy %I on public.%I for delete to authenticated using (auth.uid() is not null and user_id = auth.uid())',
        table_name || '_owner_delete',
        table_name
      );
    end if;
  end loop;
end $$;
