-- Local/staging release candidate. Review target schema, grants and policies before
-- remote application. Earlier deferred migrations are intentionally unchanged.
-- Only public is an API schema; keep fb_private out of PostgREST exposed schemas.
begin;

create schema if not exists fb_private;
revoke all on schema fb_private from public, anon, authenticated;
grant usage on schema fb_private to anon, authenticated;

-- The restored project's April schema references profiles, while the May
-- foundation references auth.users on new tables. Preserve both FK designs.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null, email text not null,
  role text not null default 'parent',
  created_at timestamptz default now(), updated_at timestamptz default now()
);

-- Preserve old enum values and add the values already produced by this app.
-- No existing record is relabeled and no unknown date is fabricated.
alter table public.cases drop constraint if exists cases_status_check;
alter table public.cases add constraint cases_status_check check (status in ('active','closed','pending','inactive'));
alter table public.entries drop constraint if exists entries_entry_type_check;
alter table public.entries add constraint entries_entry_type_check check (entry_type in (
  'journal','pickup_dropoff','visit_denied','expense','medical','child_statement',
  'communication','incident','compliance','witness','message','schedule_change','school','court_order','other'
));
alter table public.entries drop constraint if exists entries_capture_method_check;
alter table public.entries add constraint entries_capture_method_check check (capture_method in (
  'manual_text','voice_dictation','voice_exchange','camera_photo','gallery_import','screenshot_ai',
  'file_upload','integration_sync','ofw_import','whatsapp_import','email_forward','siri_shortcut',
  'manual','manual_local','manual_supabase','voice_placeholder_local','voice_local'
));
alter table public.entries drop constraint if exists entries_child_mood_check;
alter table public.entries add constraint entries_child_mood_check check (child_mood in (
  'great','good','okay','upset','distressed','calm','happy','quiet','anxious','angry'
));
alter table public.entries drop constraint if exists entries_flag_severity_check;
alter table public.entries add constraint entries_flag_severity_check check (flag_severity in ('low','medium','high','emergency','review'));
alter table public.entries drop constraint if exists entries_flag_category_check;
alter table public.entries add constraint entries_flag_category_check check (flag_category in (
  'late','denied_visit','safety','verbal','medical','financial','communication','substance','other',
  'general','exchanges','missed_exchanges','child_statements','expenses','communications','schedule_changes','school','court_orders'
));
alter table public.court_orders alter column order_date drop not null;
alter table public.court_orders drop constraint if exists court_orders_order_type_check;
alter table public.court_orders add constraint court_orders_order_type_check check (order_type in ('custody','support','restraining','other','manual'));
alter table public.filing_packages drop constraint if exists filing_packages_filing_type_check;
alter table public.filing_packages add constraint filing_packages_filing_type_check check (filing_type in (
  'modification','enforcement','emergency','response','financial','disclosure','other',
  'request_for_order','custody_visitation','compliance_packet','expense_support','general_case_packet'
));
alter table public.filing_packages drop constraint if exists filing_packages_status_check;
alter table public.filing_packages add constraint filing_packages_status_check check (status in (
  'draft','review','ready_to_file','filed','rejected','in_progress','ready_for_review'
));
alter table public.key_dates drop constraint if exists key_dates_date_type_check;
alter table public.key_dates add constraint key_dates_date_type_check check (date_type in (
  'hearing','filing_deadline','response_deadline','mediation','evaluation','review','other','service_deadline','appointment'
));

create table public.case_workspace_state (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb check (jsonb_typeof(state) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (id = user_id)
);

create table public.case_sync_versions (
  user_id uuid not null references auth.users(id) on delete cascade,
  table_name text not null,
  record_id uuid not null,
  version bigint not null check (version > 0),
  mutation_id uuid not null,
  primary key (user_id, table_name, record_id)
);

create table fb_private.case_sync_receipts (
  user_id uuid not null references auth.users(id) on delete cascade,
  mutation_id uuid not null,
  request jsonb not null,
  result jsonb not null,
  received_at timestamptz not null default clock_timestamp(),
  primary key (user_id, mutation_id)
);
alter table fb_private.case_sync_receipts enable row level security;
revoke all on fb_private.case_sync_receipts from public, anon, authenticated;

-- An unexposed transaction marker authorizes exactly one record write. Unlike a
-- custom GUC it cannot be spoofed through set_config by another exposed RPC.
create table fb_private.case_sync_write_context (
  backend_pid integer not null,
  transaction_id bigint not null,
  user_id uuid not null,
  table_name text not null,
  record_id uuid not null,
  primary key (backend_pid, transaction_id)
);
alter table fb_private.case_sync_write_context enable row level security;
revoke all on fb_private.case_sync_write_context from public, anon, authenticated;

create table public.entry_revisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  entry_id uuid not null references public.entries(id) on delete cascade,
  version bigint not null,
  mutation_id uuid not null,
  previous_snapshot jsonb,
  snapshot jsonb not null,
  old_content_hash text,
  new_content_hash text,
  snapshot_hash text not null,
  previous_revision_hash text,
  revision_hash text not null,
  recorded_at timestamptz not null,
  unique (entry_id, version),
  unique (user_id, mutation_id)
);
create index entry_revisions_owner_entry_idx on public.entry_revisions(user_id, entry_id, version);

-- Verification is read from trusted Auth storage, never user-editable JWT metadata.
create function fb_private.is_verified_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    where u.id = (select auth.uid()) and u.email_confirmed_at is not null
  );
$$;
revoke all on function fb_private.is_verified_owner() from public, anon;
grant execute on function fb_private.is_verified_owner() to anon, authenticated;

alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
create policy fb_profile_read on public.profiles for select to authenticated using (true);
create policy fb_profile_owner_guard on public.profiles as restrictive for select to public
  using (id = (select auth.uid()) and (select fb_private.is_verified_owner()));
create policy fb_profile_private_insert on public.profiles as restrictive for insert to public with check (false);
create policy fb_profile_private_update on public.profiles as restrictive for update to public using (false) with check (false);
create policy fb_profile_private_delete on public.profiles as restrictive for delete to public using (false);

-- Used by restrictive RLS and by write triggers. Only fixed identifiers occur
-- here; callers cannot choose arbitrary relations or execute SQL through JSON.
create function fb_private.valid_case_links(relation_name text, record jsonb)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare
  owner uuid := auth.uid();
  case_key uuid;
  item text;
begin
  if owner is null or record->>'user_id' is distinct from owner::text then return false; end if;
  if relation_name = 'cases' then return true; end if;
  if relation_name = 'case_workspace_state' then
    return record->>'id' = owner::text and jsonb_typeof(record->'state') = 'object';
  end if;
  if relation_name = 'case_sync_versions' then return true; end if;
  case_key := (record->>'case_id')::uuid;
  if case_key is null or not exists (select 1 from public.cases c where c.id = case_key and c.user_id = owner) then
    return false;
  end if;

  if record->>'child_id' is not null and not exists (
    select 1 from public.children x where x.id = (record->>'child_id')::uuid and x.user_id = owner and x.case_id = case_key
  ) then return false; end if;
  if record->>'person_id' is not null and not exists (
    select 1 from public.people x where x.id = (record->>'person_id')::uuid and x.user_id = owner and x.case_id = case_key
  ) then return false; end if;
  if record->>'entry_id' is not null and not exists (
    select 1 from public.entries x where x.id = (record->>'entry_id')::uuid and x.user_id = owner and x.case_id = case_key
  ) then return false; end if;
  foreach item in array array['source_attachment_id', 'attachment_id'] loop
    if record->>item is not null and not exists (
      select 1 from public.attachments x where x.id = (record->>item)::uuid and x.user_id = owner and x.case_id = case_key
    ) then return false; end if;
  end loop;
  foreach item in array array['court_order_id', 'related_court_order_id'] loop
    if record->>item is not null and not exists (
      select 1 from public.court_orders x where x.id = (record->>item)::uuid and x.user_id = owner and x.case_id = case_key
    ) then return false; end if;
  end loop;
  foreach item in array array['provision_id', 'court_order_provision_id'] loop
    if record->>item is not null and not exists (
      select 1 from public.court_order_provisions x where x.id = (record->>item)::uuid and x.user_id = owner and x.case_id = case_key
    ) then return false; end if;
  end loop;
  foreach item in array array['filing_package_id', 'related_filing_package_id'] loop
    if record->>item is not null and not exists (
      select 1 from public.filing_packages x where x.id = (record->>item)::uuid and x.user_id = owner and x.case_id = case_key
    ) then return false; end if;
  end loop;
  if record->>'advisor_thread_id' is not null and not exists (
    select 1 from public.advisor_threads x where x.id = (record->>'advisor_thread_id')::uuid and x.user_id = owner and x.case_id = case_key
  ) then return false; end if;
  if record->>'ai_output_id' is not null and not exists (
    select 1 from public.ai_outputs x where x.id = (record->>'ai_output_id')::uuid and x.user_id = owner and x.case_id = case_key
  ) then return false; end if;
  if relation_name = 'pattern_tags' then
    if jsonb_typeof(record->'source_entry_ids') is distinct from 'array' then return false; end if;
    for item in select jsonb_array_elements_text(record->'source_entry_ids') loop
      if not exists (select 1 from public.entries x where x.id = item::uuid and x.user_id = owner and x.case_id = case_key) then
        return false;
      end if;
    end loop;
  end if;
  if relation_name = 'entries' and record->'linked_entry_ids' is not null and record->'linked_entry_ids' <> 'null'::jsonb then
    if jsonb_typeof(record->'linked_entry_ids') <> 'array' then return false; end if;
    for item in select jsonb_array_elements_text(record->'linked_entry_ids') loop
      if not exists (select 1 from public.entries x where x.id = item::uuid and x.user_id = owner and x.case_id = case_key) then
        return false;
      end if;
    end loop;
  end if;
  if relation_name = 'attachments' then
    return record->>'entry_id' is not null
      and record->>'storage_bucket' = 'evidence-originals'
      and record->>'storage_path' = owner::text || '/' || case_key::text || '/' || (record->>'entry_id') || '/' || (record->>'id') || '/original'
      and record->>'file_hash' ~ '^[0-9a-f]{64}$'
      and record->>'hash_algorithm' = 'sha256'
      and (record->>'file_size_bytes')::bigint between 1 and 26214400;
  end if;
  return true;
exception when invalid_text_representation or numeric_value_out_of_range then
  return false;
end;
$$;
revoke all on function fb_private.valid_case_links(text, jsonb) from public, anon;
grant execute on function fb_private.valid_case_links(text, jsonb) to anon, authenticated;

create function fb_private.guard_case_record()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from fb_private.case_sync_write_context c
    where c.backend_pid = pg_backend_pid() and c.transaction_id = txid_current()
      and c.user_id = auth.uid() and c.table_name = tg_table_name
      and c.record_id::text = to_jsonb(new)->>'id'
  ) then
    raise exception using errcode = '42501', message = 'SYNC_RPC_REQUIRED';
  end if;
  if not fb_private.is_verified_owner() or not coalesce(fb_private.valid_case_links(tg_table_name, to_jsonb(new)), false) then
    raise exception using errcode = '42501', message = 'CASE_ACCESS_DENIED';
  end if;
  if tg_table_name = 'entries' then
    if new.metadata is not null and jsonb_typeof(new.metadata) <> 'object' then
      raise exception using errcode = '22023', message = 'INVALID_CAPTURE_METADATA';
    end if;
    if tg_op = 'INSERT' then
      -- Preserve the first submitted capture even when a client omitted the
      -- optional metadata field. It is a receipt of a claim, not attestation.
      new.metadata := coalesce(new.metadata, '{}'::jsonb) || jsonb_build_object(
        'captured_body', case when jsonb_typeof(new.metadata->'captured_body') = 'string'
          then new.metadata->'captured_body' else to_jsonb(new.body) end
      );
    elsif new.metadata->'captured_body' is distinct from old.metadata->'captured_body'
      or new.metadata->'source_mode' is distinct from old.metadata->'source_mode'
      or new.metadata->'capture_version' is distinct from old.metadata->'capture_version'
      or new.voice_transcript is distinct from old.voice_transcript
      or new.capture_method is distinct from old.capture_method then
      raise exception using errcode = '42501', message = 'ORIGINAL_CAPTURE_IMMUTABLE';
    end if;
  end if;
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id
      or to_jsonb(new)->>'id' is distinct from to_jsonb(old)->>'id'
      or to_jsonb(new)->>'case_id' is distinct from to_jsonb(old)->>'case_id'
      or to_jsonb(new)->>'created_at' is distinct from to_jsonb(old)->>'created_at' then
      raise exception using errcode = '42501', message = 'CASE_IDENTITY_IMMUTABLE';
    end if;
    if tg_table_name = 'attachments' and to_jsonb(new) is distinct from to_jsonb(old) then
      raise exception using errcode = '42501', message = 'ORIGINAL_ATTACHMENT_IMMUTABLE';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function fb_private.guard_case_record() from public, anon, authenticated;

-- Read-only clients + restrictive guards protect against older permissive owner
-- policies, PUBLIC grants and any accidentally reintroduced client DML grants.
do $$
declare relation_name text;
begin
  foreach relation_name in array array[
    'cases','children','people','entries','attachments','court_orders','court_order_provisions',
    'entry_children','entry_people','entry_court_order_provisions','filing_packages',
    'filing_package_entries','filing_package_attachments','key_dates','pattern_tags',
    'advisor_threads','ai_outputs','ai_output_sources','case_workspace_state',
    'case_sync_versions','entry_revisions'
  ] loop
    execute format('alter table public.%I enable row level security', relation_name);
    execute format('revoke all on table public.%I from public, anon, authenticated', relation_name);
    execute format('grant select on table public.%I to authenticated', relation_name);
    execute format('create policy fb_read on public.%I for select to authenticated using (true)', relation_name);
    execute format('create policy fb_owner_read_guard on public.%1$I as restrictive for select to public using ((select fb_private.is_verified_owner()) and fb_private.valid_case_links(%2$L, to_jsonb(%1$I)))', relation_name, relation_name);
    execute format('create policy fb_rpc_only_insert on public.%I as restrictive for insert to public with check (false)', relation_name);
    execute format('create policy fb_rpc_only_update on public.%I as restrictive for update to public using (false) with check (false)', relation_name);
    execute format('create policy fb_no_client_delete on public.%I as restrictive for delete to public using (false)', relation_name);
    execute format('create index if not exists %I on public.%I (user_id)', relation_name || '_sync_owner_idx', relation_name);
    if relation_name not in ('case_sync_versions','entry_revisions') then
      execute format('create trigger fb_guard_case_record before insert or update on public.%I for each row execute function fb_private.guard_case_record()', relation_name);
    end if;
  end loop;
end;
$$;

create function fb_private.sync_case_records(changes jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  owner uuid := auth.uid();
  change jsonb;
  record jsonb;
  relation_name text;
  record_key uuid;
  mutation_key uuid;
  expected bigint;
  current_version bigint;
  previous jsonb;
  saved jsonb;
  receipt fb_private.case_sync_receipts%rowtype;
  allowed_columns text[];
  column_names text;
  update_names text;
  result jsonb;
  results jsonb := '[]'::jsonb;
  previous_hash text;
  snapshot_hash text;
  revision_hash text;
  received timestamptz;
begin
  if owner is null or not fb_private.is_verified_owner() then
    raise exception using errcode = '42501', message = 'VERIFIED_ACCOUNT_REQUIRED';
  end if;
  if jsonb_typeof(changes) is distinct from 'array' or jsonb_array_length(changes) > 1000 then
    raise exception using errcode = '22023', message = 'INVALID_SYNC_BATCH';
  end if;
  -- The bounded per-owner lock avoids insert races and deadlocks from batches
  -- containing the same records in different orders. Other owners are independent.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('family-bench-sync:' || owner::text, 0));
  -- Parent is a generic account label, not an inferred legal identity. Existing
  -- profile details are preserved; authorization never uses profile role/name.
  insert into public.profiles(id, full_name, email)
    select u.id, 'Parent', u.email from auth.users u
    where u.id = owner and u.email_confirmed_at is not null
    on conflict (id) do nothing;
  for change in select jsonb_array_elements(changes) loop
    if jsonb_typeof(change) is distinct from 'object'
      or exists (select 1 from jsonb_object_keys(change) k where k not in ('table_name','row','expected_version','mutation_id'))
      or jsonb_typeof(change->'row') is distinct from 'object'
      or jsonb_typeof(change->'expected_version') is distinct from 'number'
      or change->>'expected_version' !~ '^[0-9]+$' then
      raise exception using errcode = '22023', message = 'INVALID_SYNC_CHANGE';
    end if;
    relation_name := change->>'table_name';
    if relation_name is null or relation_name <> all(array[
      'cases','children','people','entries','attachments','court_orders','court_order_provisions',
      'filing_packages','key_dates','pattern_tags','advisor_threads','ai_outputs','case_workspace_state'
    ]) then
      raise exception using errcode = '22023', message = 'INVALID_SYNC_TABLE';
    end if;
    record := change->'row';
    record_key := (record->>'id')::uuid;
    mutation_key := (change->>'mutation_id')::uuid;
    expected := (change->>'expected_version')::bigint;
    if record_key is null or mutation_key is null or record->>'user_id' is distinct from owner::text then
      raise exception using errcode = '42501', message = 'CASE_ACCESS_DENIED';
    end if;
    select * into receipt from fb_private.case_sync_receipts r
      where r.user_id = owner and r.mutation_id = mutation_key;
    if found then
      if receipt.request is distinct from change then
        raise exception using errcode = '22023', message = 'MUTATION_ID_REUSED';
      end if;
      results := results || jsonb_build_array(receipt.result);
      continue;
    end if;
    -- Fail closed on unknown fields instead of silently discarding local state.
    select array_agg(a.attname::text order by a.attnum) into allowed_columns
      from pg_catalog.pg_attribute a
      where a.attrelid = pg_catalog.to_regclass('public.' || pg_catalog.quote_ident(relation_name))
        and a.attnum > 0 and not a.attisdropped and a.attgenerated = '';
    if exists (select 1 from jsonb_object_keys(record) k where k <> all(allowed_columns)) then
      raise exception using errcode = '22023', message = 'UNKNOWN_SYNC_FIELD';
    end if;
    if exists (select 1 from jsonb_object_keys(record) k where k = any(array[
      'capture_timestamp','file_hash_verified_at','original_file_hash','is_original',
      'metadata_hash','original_content_hash','edit_history','voice_entry_id','timestamp_consistency'
    ])) then
      raise exception using errcode = '22023', message = 'READONLY_SYNC_FIELD';
    end if;
    execute format('select to_jsonb(t) from public.%I t where t.id = $1 for update', relation_name)
      into previous using record_key;
    if previous is not null and previous->>'user_id' is distinct from owner::text then
      raise exception using errcode = '42501', message = 'CASE_ACCESS_DENIED';
    end if;
    select v.version into current_version from public.case_sync_versions v
      where v.user_id = owner and v.table_name = relation_name and v.record_id = record_key;
    current_version := coalesce(current_version, 0);
    if expected <> current_version or (previous is not null and current_version = 0) then
      raise exception using errcode = 'P0001', message = 'SYNC_CONFLICT',
        detail = jsonb_build_object('table_name', relation_name, 'record_id', record_key, 'server_version', current_version)::text;
    end if;
    if previous is null and current_version <> 0 then
      raise exception using errcode = 'P0001', message = 'SYNC_CONFLICT', detail = 'Missing versioned record';
    end if;
    if 'updated_at' = any(allowed_columns) then
      record := record || jsonb_build_object('updated_at', clock_timestamp());
    end if;
    insert into fb_private.case_sync_write_context(backend_pid, transaction_id, user_id, table_name, record_id)
      values (pg_backend_pid(), txid_current(), owner, relation_name, record_key);
    if previous is null then
      select string_agg(format('%I', k), ', ' order by k) into column_names from jsonb_object_keys(record) k;
      execute format('insert into public.%1$I (%2$s) select %2$s from jsonb_populate_record(null::public.%1$I, $1) returning to_jsonb(%1$I)', relation_name, column_names)
        into saved using record;
    else
      -- Omitted columns retain their values; explicit JSON null clears a column.
      select string_agg(format('%1$I = proposed.%1$I', k), ', ' order by k) into update_names
        from jsonb_object_keys(record) k where k <> 'id';
      execute format('update public.%1$I existing set %2$s from jsonb_populate_record(null::public.%1$I, $1) proposed where existing.id = $2 returning to_jsonb(existing)', relation_name, update_names)
        into saved using record, record_key;
    end if;
    delete from fb_private.case_sync_write_context
      where backend_pid = pg_backend_pid() and transaction_id = txid_current();
    current_version := current_version + 1;
    insert into public.case_sync_versions(user_id, table_name, record_id, version, mutation_id)
      values (owner, relation_name, record_key, current_version, mutation_key)
      on conflict (user_id, table_name, record_id) do update
      set version = excluded.version, mutation_id = excluded.mutation_id;
    if relation_name = 'entries' then
      select r.revision_hash into previous_hash from public.entry_revisions r
        where r.entry_id = record_key order by r.version desc limit 1;
      received := clock_timestamp();
      snapshot_hash := encode(sha256(convert_to(saved::text, 'UTF8')), 'hex');
      revision_hash := encode(sha256(convert_to(jsonb_build_object(
        'entry_id', record_key, 'version', current_version, 'mutation_id', mutation_key,
        'previous_revision_hash', previous_hash, 'snapshot_hash', snapshot_hash, 'recorded_at', received
      )::text, 'UTF8')), 'hex');
      insert into public.entry_revisions(user_id, case_id, entry_id, version, mutation_id,
        previous_snapshot, snapshot, old_content_hash, new_content_hash, snapshot_hash,
        previous_revision_hash, revision_hash, recorded_at)
      values (owner, (saved->>'case_id')::uuid, record_key, current_version, mutation_key,
        previous, saved, previous->>'content_hash', saved->>'content_hash', snapshot_hash,
        previous_hash, revision_hash, received);
    end if;
    result := jsonb_build_object('table_name', relation_name, 'record_id', record_key,
      'version', current_version, 'mutation_id', mutation_key);
    insert into fb_private.case_sync_receipts(user_id, mutation_id, request, result)
      values (owner, mutation_key, change, result);
    results := results || jsonb_build_array(result);
  end loop;
  return results;
end;
$$;
revoke all on function fb_private.sync_case_records(jsonb) from public, anon;
grant execute on function fb_private.sync_case_records(jsonb) to authenticated;

-- The exposed write RPC is SECURITY INVOKER, with a fixed call into private code.
create function public.sync_case_records(changes jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select fb_private.sync_case_records(changes);
$$;
revoke all on function public.sync_case_records(jsonb) from public, anon;
grant execute on function public.sync_case_records(jsonb) to authenticated;

-- Every collection and its CAS versions share one statement snapshot. Individual
-- table caps detect an oversized workspace without ever returning truncated data.
-- STABLE also keeps the verification check on the caller's statement snapshot.
create function public.read_case_workspace()
returns jsonb language plpgsql stable security invoker set search_path = '' as $$
declare
  result jsonb;
  record_count bigint;
begin
  if not fb_private.is_verified_owner() then
    raise exception using errcode = '42501', message = 'VERIFIED_ACCOUNT_REQUIRED';
  end if;
  select jsonb_build_object(
    'snapshot', jsonb_build_object(
      'cases', (select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]'::jsonb) from (select * from public.cases where user_id = (select auth.uid()) order by id limit 25001) r),
      'children', (select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]'::jsonb) from (select * from public.children where user_id = (select auth.uid()) order by id limit 25001) r),
      'people', (select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]'::jsonb) from (select * from public.people where user_id = (select auth.uid()) order by id limit 25001) r),
      'entries', (select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]'::jsonb) from (select * from public.entries where user_id = (select auth.uid()) order by id limit 25001) r),
      'evidenceAttachments', (select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]'::jsonb) from (select * from public.attachments where user_id = (select auth.uid()) order by id limit 25001) r),
      'courtOrders', (select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]'::jsonb) from (select * from public.court_orders where user_id = (select auth.uid()) order by id limit 25001) r),
      'courtOrderProvisions', (select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]'::jsonb) from (select * from public.court_order_provisions where user_id = (select auth.uid()) order by id limit 25001) r),
      'filingPackages', (select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]'::jsonb) from (select * from public.filing_packages where user_id = (select auth.uid()) order by id limit 25001) r),
      'keyDates', (select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]'::jsonb) from (select * from public.key_dates where user_id = (select auth.uid()) order by id limit 25001) r),
      'patternTags', (select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]'::jsonb) from (select * from public.pattern_tags where user_id = (select auth.uid()) order by id limit 25001) r),
      'advisorThreads', (select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]'::jsonb) from (select * from public.advisor_threads where user_id = (select auth.uid()) order by id limit 25001) r),
      'aiOutputs', (select coalesce(jsonb_agg(to_jsonb(r) order by r.id), '[]'::jsonb) from (select * from public.ai_outputs where user_id = (select auth.uid()) order by id limit 25001) r)
    ),
    'versions', (select coalesce(jsonb_agg(to_jsonb(r) order by r.table_name, r.record_id), '[]'::jsonb) from (select * from public.case_sync_versions where user_id = (select auth.uid()) order by table_name, record_id limit 25002) r),
    'workspace', (select to_jsonb(r) from public.case_workspace_state r where r.user_id = (select auth.uid()) and r.id = (select auth.uid()))
  ) into result;
  select coalesce(sum(jsonb_array_length(value)), 0) into record_count from jsonb_each(result->'snapshot');
  if record_count > 25000 or jsonb_array_length(result->'versions') > 25001 or octet_length(result::text) > 33554432 then
    raise exception using errcode = 'P0001', message = 'WORKSPACE_TOO_LARGE',
      detail = 'Workspace exceeds the beta limit of 25000 records or 32 MiB. No partial snapshot was returned.';
  end if;
  return result;
end;
$$;
revoke all on function public.read_case_workspace() from public, anon;
grant execute on function public.read_case_workspace() to authenticated;

create function fb_private.valid_evidence_path(object_name text)
returns boolean language plpgsql stable security definer set search_path = '' as $$
declare parts text[] := string_to_array(object_name, '/');
begin
  if not fb_private.is_verified_owner() or array_length(parts, 1) is distinct from 5
    or parts[1] is distinct from auth.uid()::text or parts[5] is distinct from 'original'
    or parts[4] !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return exists (
    select 1 from public.entries e join public.cases c on c.id = e.case_id
    where e.id = parts[3]::uuid and e.case_id = parts[2]::uuid
      and e.user_id = auth.uid() and c.user_id = auth.uid()
      and e.deleted_at is null and c.deleted_at is null
  );
exception when invalid_text_representation then return false;
end;
$$;
revoke all on function fb_private.valid_evidence_path(text) from public, anon;
grant execute on function fb_private.valid_evidence_path(text) to anon, authenticated;

insert into storage.buckets(id, name, public, file_size_limit)
  values ('evidence-originals', 'evidence-originals', false, 26214400)
  on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

-- Preserve unrelated bucket policies. Restrictive policies apply even when a
-- pre-existing permissive policy grants broader access to storage.objects.
create policy fb_evidence_read on storage.objects for select to authenticated
  using (bucket_id = 'evidence-originals' and fb_private.valid_evidence_path(name));
create policy fb_evidence_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence-originals' and fb_private.valid_evidence_path(name));
create policy fb_evidence_read_guard on storage.objects as restrictive for select to public
  using (bucket_id <> 'evidence-originals' or (auth.uid() is not null and fb_private.valid_evidence_path(name)));
create policy fb_evidence_insert_guard on storage.objects as restrictive for insert to public
  with check (bucket_id <> 'evidence-originals' or (auth.uid() is not null and fb_private.valid_evidence_path(name)));
create policy fb_evidence_no_update on storage.objects as restrictive for update to public
  using (bucket_id <> 'evidence-originals') with check (bucket_id <> 'evidence-originals');
create policy fb_evidence_no_delete on storage.objects as restrictive for delete to public
  using (bucket_id <> 'evidence-originals');

commit;
