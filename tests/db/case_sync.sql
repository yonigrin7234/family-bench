\set ON_ERROR_STOP on
create function pg_temp.id(n integer) returns uuid language sql immutable as $$
  select ('00000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid;
$$;
create function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'FAIL: %', label; end if;
  raise notice 'PASS: %', label;
end;
$$;
create function pg_temp.denied(statement text, expected_code text, expected_message text default null)
returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_code and (expected_message is null or sqlerrm = expected_message) then
      raise notice 'PASS: rejected %', coalesce(expected_message, expected_code);
      return;
    end if;
    raise;
  end;
  raise exception 'FAIL: statement unexpectedly succeeded: %', statement;
end;
$$;
create function pg_temp.change(t text, r jsonb, version bigint, mutation integer)
returns jsonb language sql as $$
  select jsonb_build_object('table_name', t, 'row', r, 'expected_version', version, 'mutation_id', pg_temp.id(mutation));
$$;
create function pg_temp.row(id integer, case_id integer default null) returns jsonb language sql as $$
  select jsonb_build_object('id', pg_temp.id(id), 'user_id', auth.uid()) ||
    case when case_id is null then '{}'::jsonb else jsonb_build_object('case_id', pg_temp.id(case_id)) end;
$$;

insert into auth.users(id, email_confirmed_at) values (pg_temp.id(1), now()), (pg_temp.id(2), now()), (pg_temp.id(3), null);
-- Deliberately hostile pre-existing permissive policies must not bypass guards.
create policy malicious_legacy_read on public.cases for select to public using (true);
create policy malicious_storage_all on storage.objects for all to public using (true) with check (true);

set role authenticated;
select set_config('request.jwt.claim.sub', pg_temp.id(1)::text, false);
select public.sync_case_records(jsonb_build_array(
  pg_temp.change('cases', pg_temp.row(101) || '{"title":"A first case"}', 0, 1001),
  pg_temp.change('cases', pg_temp.row(102) || '{"title":"A second case"}', 0, 1002),
  pg_temp.change('children', pg_temp.row(301, 101) || '{"name":"Child A"}', 0, 1003),
  pg_temp.change('children', pg_temp.row(302, 102) || '{"name":"Child B"}', 0, 1004),
  pg_temp.change('entries', pg_temp.row(401, 101) || jsonb_build_object('entry_type','journal','event_date','2026-09-04','body','Original observation','private_notes','Private context','child_id',pg_temp.id(301),'content_hash',repeat('a',64)), 0, 1005)
));
select pg_temp.check((select count(*) = 2 from public.cases), 'owner reads own cases');
select pg_temp.check((select count(*) = 1 from public.entry_revisions), 'initial entry creates server revision');
select pg_temp.check((select snapshot_hash = encode(sha256(convert_to(snapshot::text,'UTF8')),'hex') from public.entry_revisions), 'server snapshot hash recomputes');

-- Same payload mutation retry returns original receipt without another revision.
select public.sync_case_records(jsonb_build_array(
  pg_temp.change('entries', pg_temp.row(401, 101) || jsonb_build_object('entry_type','journal','event_date','2026-09-04','body','Original observation','private_notes','Private context','child_id',pg_temp.id(301),'content_hash',repeat('a',64)), 0, 1005)
));
select pg_temp.check((select count(*) = 1 from public.entry_revisions), 'retry creates no duplicate entry/revision');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('entries',pg_temp.row(401,101)||'{"body":"Changed retry"}',0,1005)))$q$, '22023', 'MUTATION_ID_REUSED');

select public.sync_case_records(jsonb_build_array(pg_temp.change('entries', pg_temp.row(401,101)||jsonb_build_object('body','Reviewed observation','content_hash',repeat('b',64)),1,1006)));
select pg_temp.check((select count(*) = 2 from public.entry_revisions), 'edit creates second revision');
select pg_temp.check((select previous_snapshot->>'body' = 'Original observation' and snapshot->>'body' = 'Reviewed observation' and snapshot->>'private_notes' = 'Private context' from public.entry_revisions where version=2), 'edit preserves prior snapshot and omitted fields');
select pg_temp.check((select metadata->>'captured_body'='Original observation' from public.entries where id=pg_temp.id(401)), 'original capture survives reviewed body edit');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('entries',pg_temp.row(401,101)||'{"metadata":{"captured_body":"Replacement"}}',2,1091)))$q$,'42501','ORIGINAL_CAPTURE_IMMUTABLE');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('entries',pg_temp.row(401,101)||'{"metadata":{}}',2,1092)))$q$,'42501','ORIGINAL_CAPTURE_IMMUTABLE');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('entries',pg_temp.row(401,101)||'{"voice_transcript":"Replacement transcript"}',2,1093)))$q$,'42501','ORIGINAL_CAPTURE_IMMUTABLE');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('entries',pg_temp.row(401,101)||'{"capture_method":"voice_local"}',2,1094)))$q$,'42501','ORIGINAL_CAPTURE_IMMUTABLE');
select pg_temp.check((select later.previous_revision_hash = earlier.revision_hash from public.entry_revisions earlier join public.entry_revisions later on later.entry_id=earlier.entry_id and later.version=2 where earlier.version=1), 'revision hash chain links');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('entries',pg_temp.row(401,101)||'{"body":"Stale"}',1,1007)))$q$, 'P0001', 'SYNC_CONFLICT');
select pg_temp.check((select body='Reviewed observation' from public.entries), 'stale update does not overwrite');
select public.sync_case_records(jsonb_build_array(
  pg_temp.change('entries', pg_temp.row(401, 101) || jsonb_build_object('entry_type','journal','event_date','2026-09-04','body','Original observation','private_notes','Private context','child_id',pg_temp.id(301),'content_hash',repeat('a',64)), 0, 1005)
));
select pg_temp.check((select body='Reviewed observation' from public.entries), 'old mutation replay after newer edit cannot overwrite');

-- A later invalid operation rolls back the entire transaction's earlier writes.
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('cases',pg_temp.row(103)||'{"title":"Must roll back"}',0,1008),pg_temp.change('entries',pg_temp.row(403,103)||'{"entry_type":"journal","event_date":"2026-09-04","unknown_field":true}',0,1009)))$q$, '22023', 'UNKNOWN_SYNC_FIELD');
select pg_temp.check((select count(*)=0 from public.cases where id=pg_temp.id(103)), 'batch rollback is atomic');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('auth.users',pg_temp.row(4),0,1010)))$q$, '22023', 'INVALID_SYNC_TABLE');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('entries',pg_temp.row(404,101)||jsonb_build_object('entry_type','journal','event_date','2026-09-04','child_id',pg_temp.id(302)),0,1011)))$q$, '42501', 'CASE_ACCESS_DENIED');

-- All snapshot table paths exercise actual inserts with ownership linkage.
select public.sync_case_records(jsonb_build_array(
  pg_temp.change('people',pg_temp.row(501,101)||'{"display_name":"Parent","role":"self"}',0,1012),
  pg_temp.change('attachments',pg_temp.row(601,101)||jsonb_build_object('entry_id',pg_temp.id(401),'file_name','source.txt','file_type','document','file_size_bytes',8,'storage_bucket','evidence-originals','storage_path',auth.uid()::text||'/'||pg_temp.id(101)||'/'||pg_temp.id(401)||'/'||pg_temp.id(601)||'/original','file_hash',repeat('c',64),'hash_algorithm','sha256'),0,1013),
  pg_temp.change('court_orders',pg_temp.row(701,101)||jsonb_build_object('order_title','Order','source_attachment_id',pg_temp.id(601)),0,1014),
  pg_temp.change('court_order_provisions',pg_temp.row(801,101)||jsonb_build_object('court_order_id',pg_temp.id(701),'label','Provision','body','Text'),0,1015),
  pg_temp.change('filing_packages',pg_temp.row(901,101)||'{"title":"Draft","filing_type":"request_for_order"}',0,1016),
  pg_temp.change('key_dates',pg_temp.row(1001,101)||jsonb_build_object('title','Hearing','date_type','hearing','event_date','2026-10-01','related_filing_package_id',pg_temp.id(901),'related_court_order_id',pg_temp.id(701)),0,1017),
  pg_temp.change('pattern_tags',pg_temp.row(1101,101)||jsonb_build_object('label','Review','issue_key','general','source_entry_ids',jsonb_build_array(pg_temp.id(401))),0,1018),
  pg_temp.change('advisor_threads',pg_temp.row(1201,101)||'{"title":"Notes"}',0,1019),
  pg_temp.change('ai_outputs',pg_temp.row(1301,101)||jsonb_build_object('output_type','placeholder','advisor_thread_id',pg_temp.id(1201)),0,1020),
  pg_temp.change('case_workspace_state',pg_temp.row(1)||'{"state":{"reportPreviewState":{"reportType":"timeline"}}}',0,1021)
));
select pg_temp.check((select count(*)=15 from public.case_sync_versions), 'all 13 supported snapshot table kinds sync');
select pg_temp.check((select full_name='Parent' and email='fixture@example.test' from public.profiles), 'verified profile created without invented personal identity');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('attachments',pg_temp.row(601,101)||'{"file_hash":"dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd"}',1,1022)))$q$, '42501', 'ORIGINAL_ATTACHMENT_IMMUTABLE');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('entries',pg_temp.row(401,102),2,1023)))$q$, '42501', 'CASE_ACCESS_DENIED');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('court_orders',pg_temp.row(702,102)||jsonb_build_object('order_title','Wrong source','source_attachment_id',pg_temp.id(601)),0,1024)))$q$, '42501', 'CASE_ACCESS_DENIED');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('pattern_tags',pg_temp.row(1102,102)||jsonb_build_object('label','Wrong entry','issue_key','general','source_entry_ids',jsonb_build_array(pg_temp.id(401))),0,1025)))$q$, '42501', 'CASE_ACCESS_DENIED');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('case_workspace_state',pg_temp.row(2)||'{"state":{}}',0,1026)))$q$, '42501', 'CASE_ACCESS_DENIED');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('entries',pg_temp.row(401,102)||'{"child_id":null}',2,1027)))$q$, '42501', 'CASE_IDENTITY_IMMUTABLE');
select public.sync_case_records(jsonb_build_array(pg_temp.change('entries',pg_temp.row(410,101)||'{"entry_type":"schedule_change","event_date":"2026-09-04","capture_method":"voice_local","voice_transcript":"Original transcript","child_mood":"calm","is_flagged":true,"flag_severity":"review","flag_category":"schedule_changes"}',0,1028)));
select pg_temp.check((select entry_type='schedule_change' and child_mood='calm' from public.entries where id=pg_temp.id(410)), 'current app capture values survive legacy constraints');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('attachments',pg_temp.row(602,101)||jsonb_build_object('entry_id',pg_temp.id(401),'file_name','empty.txt','file_type','document','file_size_bytes',0,'storage_bucket','evidence-originals','storage_path',auth.uid()::text||'/'||pg_temp.id(101)||'/'||pg_temp.id(401)||'/'||pg_temp.id(602)||'/original','file_hash',repeat('c',64),'hash_algorithm','sha256'),0,1029)))$q$,'42501','CASE_ACCESS_DENIED');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('attachments',pg_temp.row(602,101)||jsonb_build_object('entry_id',pg_temp.id(401),'file_name','oversized.txt','file_type','document','file_size_bytes',26214401,'storage_bucket','evidence-originals','storage_path',auth.uid()::text||'/'||pg_temp.id(101)||'/'||pg_temp.id(401)||'/'||pg_temp.id(602)||'/original','file_hash',repeat('c',64),'hash_algorithm','sha256'),0,1030)))$q$,'42501','CASE_ACCESS_DENIED');
with workspace as (select public.read_case_workspace() as data)
select pg_temp.check(
  (select count(*)=12 from jsonb_object_keys(data->'snapshot'))
  and jsonb_array_length(data->'snapshot'->'cases')=2
  and jsonb_array_length(data->'snapshot'->'evidenceAttachments')=1
  and jsonb_array_length(data->'versions')=16
  and data->'workspace'->>'id'=auth.uid()::text,
  'atomic read returns all snapshot groups, versions and owned workspace'
) from workspace;

-- Real roles, not superuser, exercise storage and direct-DML denials.
insert into storage.objects(bucket_id,name) values ('evidence-originals',auth.uid()::text||'/'||pg_temp.id(101)||'/'||pg_temp.id(401)||'/'||pg_temp.id(601)||'/original');
select pg_temp.check((select count(*)=1 from storage.objects), 'owner can insert/read linked original object');
select pg_temp.denied($q$insert into storage.objects(bucket_id,name) values ('evidence-originals',auth.uid()::text||'/'||pg_temp.id(102)||'/'||pg_temp.id(401)||'/'||pg_temp.id(602)||'/original')$q$, '42501');
with changed as (update storage.objects set name=name||'-replacement' returning id)
select pg_temp.check(count(*)=0, 'original object update is blocked despite permissive policy') from changed;
with changed as (delete from storage.objects returning id)
select pg_temp.check(count(*)=0, 'original object delete is blocked despite permissive policy') from changed;
select pg_temp.denied($q$insert into public.cases(id,user_id,title) values (pg_temp.id(104),auth.uid(),'Bypass')$q$,'42501');
select pg_temp.denied($q$update public.entries set body='Bypass'$q$,'42501');
select pg_temp.denied($q$delete from public.entry_revisions$q$,'42501');
select pg_temp.denied($q$update public.case_sync_versions set version=999$q$,'42501');

-- Soft-deleting a parent revokes byte access without destroying the original.
select public.sync_case_records(jsonb_build_array(pg_temp.change('entries',pg_temp.row(401,101)||jsonb_build_object('deleted_at',now()),2,1031)));
select pg_temp.check((select count(*)=0 from storage.objects), 'soft-deleted entry cannot expose original bytes');
select public.sync_case_records(jsonb_build_array(pg_temp.change('entries',pg_temp.row(401,101)||'{"deleted_at":null}',3,1032)));
select public.sync_case_records(jsonb_build_array(pg_temp.change('cases',pg_temp.row(101)||jsonb_build_object('deleted_at',now()),1,1033)));
select pg_temp.check((select count(*)=0 from storage.objects), 'soft-deleted case cannot expose original bytes');
select public.sync_case_records(jsonb_build_array(pg_temp.change('cases',pg_temp.row(101)||'{"deleted_at":null}',2,1034)));
select pg_temp.check((select count(*)=1 from storage.objects), 'restoring parents reveals the same preserved original');

-- A second user sees neither records, revisions, versions nor original objects.
select set_config('request.jwt.claim.sub', pg_temp.id(2)::text, false);
select pg_temp.check((select count(*)=0 from public.cases), 'second owner cannot read first owner despite permissive policy');
select pg_temp.check((select count(*)=0 from public.entry_revisions), 'revisions are owner-scoped');
select pg_temp.check((select count(*)=0 from public.case_sync_versions), 'versions are owner-scoped');
select pg_temp.check((select count(*)=0 from storage.objects), 'original objects are owner-scoped');
select pg_temp.check(public.read_case_workspace() = '{"snapshot":{"cases":[],"children":[],"people":[],"entries":[],"evidenceAttachments":[],"courtOrders":[],"courtOrderProvisions":[],"filingPackages":[],"keyDates":[],"patternTags":[],"advisorThreads":[],"aiOutputs":[]},"versions":[],"workspace":null}'::jsonb, 'second owner atomic read contains no foreign records');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('entries',pg_temp.row(405,101)||'{"entry_type":"journal","event_date":"2026-09-04"}',0,2001)))$q$,'42501','CASE_ACCESS_DENIED');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('cases',pg_temp.row(101)||'{"title":"Foreign"}',0,2002)))$q$,'42501','CASE_ACCESS_DENIED');
select pg_temp.denied($q$insert into storage.objects(bucket_id,name) values ('evidence-originals',pg_temp.id(1)||'/'||pg_temp.id(101)||'/'||pg_temp.id(401)||'/'||pg_temp.id(602)||'/original')$q$,'42501');
select public.sync_case_records(jsonb_build_array(pg_temp.change('cases',pg_temp.row(201)||'{"title":"B case"}',0,2003)));
select pg_temp.check((select count(*)=1 from public.cases), 'second owner can create own workspace');

select set_config('request.jwt.claim.sub', pg_temp.id(3)::text, false);
select pg_temp.check((select count(*)=0 from public.cases), 'unverified account has no record reads');
select pg_temp.denied($q$select public.read_case_workspace()$q$,'42501','VERIFIED_ACCOUNT_REQUIRED');
select pg_temp.denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.change('cases',pg_temp.row(301)||'{"title":"Unverified"}',0,3001)))$q$,'42501','VERIFIED_ACCOUNT_REQUIRED');
select pg_temp.denied($q$insert into storage.objects(bucket_id,name) values ('evidence-originals',auth.uid()::text||'/'||pg_temp.id(101)||'/'||pg_temp.id(401)||'/'||pg_temp.id(603)||'/original')$q$,'42501');

reset role;
set role anon;
select set_config('request.jwt.claim.sub','',false);
select pg_temp.denied($q$select public.sync_case_records('[]'::jsonb)$q$,'42501');
select pg_temp.denied($q$select public.read_case_workspace()$q$,'42501');
select pg_temp.denied($q$select * from public.cases$q$,'42501');
select pg_temp.check((select count(*)=0 from storage.objects), 'anonymous original access denied');
reset role;
-- Even an accidentally granted old SECURITY DEFINER writer cannot bypass CAS.
create function pg_temp.legacy_write() returns void language sql security definer as $$
  update public.entries set body='Old RPC bypass' where id='00000000-0000-0000-0000-000000000401';
$$;
grant insert,update,delete on public.cases, public.entries, public.entry_revisions to authenticated;
grant select on public.cases to anon;
set role authenticated;
select set_config('request.jwt.claim.sub',pg_temp.id(1)::text,false);
select pg_temp.denied($q$select pg_temp.legacy_write()$q$,'42501','SYNC_RPC_REQUIRED');
select pg_temp.denied($q$insert into public.cases(id,user_id,title) values (pg_temp.id(104),auth.uid(),'Regranted bypass')$q$,'42501','SYNC_RPC_REQUIRED');
with changed as (update public.entries set body='Regranted bypass' returning id)
select pg_temp.check(count(*)=0,'restrictive write guard survives accidental grants') from changed;
select pg_temp.denied($q$insert into public.entry_revisions(user_id,case_id,entry_id,version,mutation_id,snapshot,snapshot_hash,revision_hash,recorded_at) values(auth.uid(),pg_temp.id(101),pg_temp.id(401),99,pg_temp.id(9099),'{}','fake','fake',now())$q$,'42501');
reset role;
set role anon;
select set_config('request.jwt.claim.sub','',false);
select pg_temp.check((select count(*)=0 from public.cases),'restrictive read guard survives anonymous grant');
reset role;
select pg_temp.check((select public=false and file_size_limit=26214400 from storage.buckets where id='evidence-originals'), 'original bucket private and limited to 25 MiB');
select pg_temp.check(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and p.proname in ('sync_case_records','read_case_workspace')), 'public sync and read RPCs are invoker');
select pg_temp.check((select count(*)=0 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity), 'RLS enabled on every public table');
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    perform pg_temp.check(not has_function_privilege('anon','public.rls_auto_enable()','EXECUTE') and not has_function_privilege('authenticated','public.rls_auto_enable()','EXECUTE'), 'managed RLS event function unavailable to API roles');
    perform pg_temp.check(exists(select 1 from pg_event_trigger where evtname='fixture_rls_auto_enable' and evtenabled='O'), 'managed RLS event trigger remains enabled');
  end if;
end;
$$;
