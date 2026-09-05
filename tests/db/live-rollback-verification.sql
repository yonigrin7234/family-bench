-- Project: aeeovmnhfxobeqpczjvt only. Against deployed migration 20260905032608.
-- This is database-role verification, NOT a password-login or Storage-byte test.
-- Creates only transaction-local synthetic fixtures and pg_temp assertions.
-- No passwords, Auth identities/sessions, emails, policies, grants, or byte uploads.
-- Every successful path ends in ROLLBACK; any assertion failure aborts the transaction.
begin;
set local statement_timeout = '30s';
set local lock_timeout = '5s';

select set_config('fb_verify.owner_a', gen_random_uuid()::text, true),
       set_config('fb_verify.owner_b', gen_random_uuid()::text, true),
       set_config('fb_verify.unverified', gen_random_uuid()::text, true),
       set_config('fb_verify.case_a', gen_random_uuid()::text, true),
       set_config('fb_verify.case_a2', gen_random_uuid()::text, true),
       set_config('fb_verify.case_b', gen_random_uuid()::text, true),
       set_config('fb_verify.entry_a', gen_random_uuid()::text, true),
       set_config('fb_verify.attachment_a', gen_random_uuid()::text, true),
       set_config('fb_verify.entry_mutation', gen_random_uuid()::text, true),
       set_config('fb_verify.case_rollback', gen_random_uuid()::text, true);

create function pg_temp.fb_id(key text) returns uuid language sql stable as $$
  select current_setting('fb_verify.' || key)::uuid;
$$;
create function pg_temp.fb_assert(ok boolean, label text) returns text language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'LIVE_VERIFY_FAILED: %', label; end if;
  return 'PASS: ' || label;
end;
$$;
create function pg_temp.fb_denied(statement text, expected_code text, expected_message text default null)
returns text language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if sqlstate = expected_code and (expected_message is null or sqlerrm = expected_message) then
      return 'PASS: denied ' || coalesce(expected_message, expected_code);
    end if;
    raise exception 'LIVE_VERIFY_UNEXPECTED_ERROR: expected % / %, received % / %', expected_code, expected_message, sqlstate, sqlerrm;
  end;
  raise exception 'LIVE_VERIFY_FAILED: expected denied operation';
end;
$$;
create function pg_temp.fb_row(key text, case_key text default null) returns jsonb language sql stable as $$
  select jsonb_build_object('id',pg_temp.fb_id(key),'user_id',auth.uid()) ||
    case when case_key is null then '{}'::jsonb else jsonb_build_object('case_id',pg_temp.fb_id(case_key)) end;
$$;
create function pg_temp.fb_change(relation_name text, record jsonb, version bigint default 0, mutation uuid default gen_random_uuid())
returns jsonb language sql as $$
  select jsonb_build_object('table_name',relation_name,'row',record,'expected_version',version,'mutation_id',mutation);
$$;
create function pg_temp.fb_original_change() returns jsonb language sql stable as $$
  select pg_temp.fb_change('entries',pg_temp.fb_row('entry_a','case_a') ||
    jsonb_build_object('entry_type','journal','event_date','2026-09-05','body','Synthetic original observation',
      'private_notes','Synthetic private context','content_hash',repeat('a',64)),0,pg_temp.fb_id('entry_mutation'));
$$;

-- Actual managed auth.users columns were inspected before this fixture was prepared.
-- No sign-in credentials or identities are created. The rows never commit.
insert into auth.users(id,email,email_confirmed_at)
select fixture.id,'fb-rollback-'||fixture.id::text||'@example.invalid',fixture.confirmed
from (values (pg_temp.fb_id('owner_a'),now()),(pg_temp.fb_id('owner_b'),now()),(pg_temp.fb_id('unverified'),null::timestamptz)) fixture(id,confirmed);

set local role authenticated;
select set_config('request.jwt.claim.sub',pg_temp.fb_id('owner_a')::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.fb_id('owner_a'),'role','authenticated')::text,true);
select pg_temp.fb_assert(
  jsonb_array_length(public.sync_case_records(jsonb_build_array(
    pg_temp.fb_change('cases',pg_temp.fb_row('case_a')||'{"title":"Synthetic rollback case A"}'),
    pg_temp.fb_change('cases',pg_temp.fb_row('case_a2')||'{"title":"Synthetic rollback case A2"}'),
    pg_temp.fb_original_change(),
    pg_temp.fb_change('case_workspace_state',pg_temp.fb_row('owner_a')||'{"state":{"private_context":"Synthetic private workspace"}}')
  )))=4,'owned batch returns one receipt per record');
select pg_temp.fb_assert((select count(*)=2 from public.cases where user_id=pg_temp.fb_id('owner_a')),'owner reads own generated cases');
select pg_temp.fb_assert((select count(*)=1 from public.entry_revisions where entry_id=pg_temp.fb_id('entry_a')),'initial entry creates one server revision');
select pg_temp.fb_assert((select snapshot_hash=encode(sha256(convert_to(snapshot::text,'UTF8')),'hex') from public.entry_revisions where entry_id=pg_temp.fb_id('entry_a')),'server snapshot SHA-256 recomputes');

select pg_temp.fb_assert((public.sync_case_records(jsonb_build_array(pg_temp.fb_original_change()))->0->>'version')::int=1,'identical mutation replay returns original version');
select pg_temp.fb_assert((select count(*)=1 from public.entry_revisions where entry_id=pg_temp.fb_id('entry_a')),'replay adds no duplicate revision');
select pg_temp.fb_denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.fb_change('entries',pg_temp.fb_row('entry_a','case_a')||'{"body":"Changed replay"}',0,pg_temp.fb_id('entry_mutation'))))$q$,'22023','MUTATION_ID_REUSED');
select pg_temp.fb_assert((public.sync_case_records(jsonb_build_array(pg_temp.fb_change('entries',pg_temp.fb_row('entry_a','case_a')||'{"body":"Synthetic reviewed observation"}',1)))->0->>'version')::int=2,'review increments version');
select pg_temp.fb_assert((select previous_snapshot->>'body'='Synthetic original observation' and snapshot->>'private_notes'='Synthetic private context' from public.entry_revisions where entry_id=pg_temp.fb_id('entry_a') and version=2),'review preserves original and omitted private fields');
select pg_temp.fb_assert((select later.previous_revision_hash=earlier.revision_hash from public.entry_revisions earlier join public.entry_revisions later on later.entry_id=earlier.entry_id and later.version=2 where earlier.entry_id=pg_temp.fb_id('entry_a') and earlier.version=1),'server revision hash chain links');
select pg_temp.fb_denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.fb_change('entries',pg_temp.fb_row('entry_a')||'{"body":"Stale observation"}',1)))$q$,'P0001','SYNC_CONFLICT');
select pg_temp.fb_assert((public.sync_case_records(jsonb_build_array(pg_temp.fb_original_change()))->0->>'version')::int=1,'old replay retains original receipt after newer edit');
select pg_temp.fb_assert((select body='Synthetic reviewed observation' and metadata->>'captured_body'='Synthetic original observation' from public.entries where id=pg_temp.fb_id('entry_a')),'old replay cannot overwrite reviewed or original content');
select pg_temp.fb_denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.fb_change('entries',pg_temp.fb_row('entry_a')||'{"metadata":{"captured_body":"Altered original"}}',2)))$q$,'42501','ORIGINAL_CAPTURE_IMMUTABLE');
select pg_temp.fb_denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.fb_change('entries',pg_temp.fb_row('entry_a','case_a2'),2)))$q$,'42501','CASE_IDENTITY_IMMUTABLE');

select pg_temp.fb_denied($q$select public.sync_case_records(jsonb_build_array(
  pg_temp.fb_change('cases',pg_temp.fb_row('case_rollback')||'{"title":"Must roll back"}'),
  pg_temp.fb_change('entries',jsonb_build_object('id',gen_random_uuid(),'user_id',auth.uid(),'case_id',pg_temp.fb_id('case_rollback'),'unknown_field',true))))$q$,'22023','UNKNOWN_SYNC_FIELD');
select pg_temp.fb_assert((select count(*)=0 from public.cases where id=pg_temp.fb_id('case_rollback')),'failed batch leaves no partial case');
select pg_temp.fb_denied($q$insert into public.cases(id,user_id,title) values(gen_random_uuid(),auth.uid(),'Direct bypass')$q$,'42501');
select pg_temp.fb_denied($q$update public.entries set body='Direct bypass' where id=pg_temp.fb_id('entry_a')$q$,'42501');
select pg_temp.fb_denied($q$delete from public.entry_revisions where entry_id=pg_temp.fb_id('entry_a')$q$,'42501');

-- Storage policy predicate and metadata permissions only; no underlying object bytes exist.
select pg_temp.fb_assert(fb_private.valid_evidence_path(auth.uid()::text||'/'||pg_temp.fb_id('case_a')||'/'||pg_temp.fb_id('entry_a')||'/'||pg_temp.fb_id('attachment_a')||'/original'),'valid owned evidence path accepted');
select pg_temp.fb_assert(not fb_private.valid_evidence_path(auth.uid()::text||'/'||pg_temp.fb_id('case_a2')||'/'||pg_temp.fb_id('entry_a')||'/'||pg_temp.fb_id('attachment_a')||'/original'),'cross-case evidence path rejected');
select pg_temp.fb_assert(not fb_private.valid_evidence_path(auth.uid()::text||'/../original'),'traversal-shaped evidence path rejected');
insert into storage.objects(bucket_id,name)
values('evidence-originals',auth.uid()::text||'/'||pg_temp.fb_id('case_a')||'/'||pg_temp.fb_id('entry_a')||'/'||pg_temp.fb_id('attachment_a')||'/original');
select pg_temp.fb_assert((select count(*)=1 from storage.objects where name like pg_temp.fb_id('owner_a')::text||'/%'),'owner reads transaction-local storage metadata');
with changed as (update storage.objects set name=name||'-replacement' where name like pg_temp.fb_id('owner_a')::text||'/%' returning id)
select pg_temp.fb_assert(count(*)=0,'immutable storage update changes zero rows') from changed;
with changed as (delete from storage.objects where name like pg_temp.fb_id('owner_a')::text||'/%' returning id)
select pg_temp.fb_assert(count(*)=0,'immutable storage delete changes zero rows') from changed;
select pg_temp.fb_assert((public.sync_case_records(jsonb_build_array(pg_temp.fb_change('attachments',pg_temp.fb_row('attachment_a','case_a')||jsonb_build_object('entry_id',pg_temp.fb_id('entry_a'),'file_name','synthetic.txt','file_type','document','file_size_bytes',8,'storage_bucket','evidence-originals','storage_path',auth.uid()::text||'/'||pg_temp.fb_id('case_a')||'/'||pg_temp.fb_id('entry_a')||'/'||pg_temp.fb_id('attachment_a')||'/original','file_hash',repeat('c',64),'hash_algorithm','sha256'))))->0->>'version')::int=1,'original attachment claims accepted with valid ownership');
select pg_temp.fb_denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.fb_change('attachments',pg_temp.fb_row('attachment_a','case_a')||jsonb_build_object('file_hash',repeat('d',64)),1)))$q$,'42501','ORIGINAL_ATTACHMENT_IMMUTABLE');
select pg_temp.fb_assert((public.sync_case_records(jsonb_build_array(pg_temp.fb_change('entries',pg_temp.fb_row('entry_a')||jsonb_build_object('deleted_at',now()),2)))->0->>'version')::int=3,'entry soft deletion is versioned');
select pg_temp.fb_assert((select count(*)=0 from storage.objects where name like pg_temp.fb_id('owner_a')::text||'/%'),'soft-deleted entry revokes storage metadata access');
select pg_temp.fb_assert((public.sync_case_records(jsonb_build_array(pg_temp.fb_change('entries',pg_temp.fb_row('entry_a')||'{"deleted_at":null}',3)))->0->>'version')::int=4,'entry restore is versioned');
select pg_temp.fb_assert((public.sync_case_records(jsonb_build_array(pg_temp.fb_change('cases',pg_temp.fb_row('case_a')||jsonb_build_object('deleted_at',now()),1)))->0->>'version')::int=2,'case soft deletion is versioned');
select pg_temp.fb_assert((select count(*)=0 from storage.objects where name like pg_temp.fb_id('owner_a')::text||'/%'),'soft-deleted case revokes storage metadata access');
select pg_temp.fb_assert((public.sync_case_records(jsonb_build_array(pg_temp.fb_change('cases',pg_temp.fb_row('case_a')||'{"deleted_at":null}',2)))->0->>'version')::int=3,'case restore is versioned');
select pg_temp.fb_assert((select count(*)=1 from storage.objects where name like pg_temp.fb_id('owner_a')::text||'/%'),'restored parents reveal same transaction-local original metadata');
with workspace as (select public.read_case_workspace() as value)
select pg_temp.fb_assert(jsonb_array_length(value->'snapshot'->'cases')=2
  and jsonb_array_length(value->'snapshot'->'entries')=1
  and jsonb_array_length(value->'snapshot'->'evidenceAttachments')=1
  and value->'workspace'->'state'->>'private_context'='Synthetic private workspace',
  'atomic workspace read returns owned records and private state') from workspace;

select set_config('request.jwt.claim.sub',pg_temp.fb_id('owner_b')::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.fb_id('owner_b'),'role','authenticated')::text,true);
select pg_temp.fb_assert((select count(*)=0 from public.cases where user_id=pg_temp.fb_id('owner_a')),'second owner cannot read first owner cases');
select pg_temp.fb_assert((select count(*)=0 from public.entry_revisions where user_id=pg_temp.fb_id('owner_a')),'second owner cannot read first owner revisions');
select pg_temp.fb_assert((select count(*)=0 from public.case_sync_versions where user_id=pg_temp.fb_id('owner_a')),'second owner cannot read first owner versions');
select pg_temp.fb_assert((select count(*)=0 from storage.objects where name like pg_temp.fb_id('owner_a')::text||'/%'),'second owner cannot read first owner storage metadata');
select pg_temp.fb_assert(public.read_case_workspace()='{ "snapshot":{"cases":[],"children":[],"people":[],"entries":[],"evidenceAttachments":[],"courtOrders":[],"courtOrderProvisions":[],"filingPackages":[],"keyDates":[],"patternTags":[],"advisorThreads":[],"aiOutputs":[]},"versions":[],"workspace":null}'::jsonb,'second owner snapshot contains no foreign private state');
select pg_temp.fb_denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.fb_change('entries',jsonb_build_object('id',gen_random_uuid(),'user_id',auth.uid(),'case_id',pg_temp.fb_id('case_a'),'entry_type','journal','event_date','2026-09-05'))))$q$,'42501','CASE_ACCESS_DENIED');
select pg_temp.fb_denied($q$select public.sync_case_records(jsonb_build_array(pg_temp.fb_change('cases',pg_temp.fb_row('case_a')||'{"title":"Foreign overwrite"}')))$q$,'42501','CASE_ACCESS_DENIED');
select pg_temp.fb_denied($q$insert into storage.objects(bucket_id,name) values('evidence-originals',pg_temp.fb_id('owner_a')::text||'/'||pg_temp.fb_id('case_a')||'/'||pg_temp.fb_id('entry_a')||'/'||gen_random_uuid()||'/original')$q$,'42501');
select pg_temp.fb_assert((public.sync_case_records(jsonb_build_array(pg_temp.fb_change('cases',pg_temp.fb_row('case_b')||'{"title":"Synthetic second owner case"}')))->0->>'version')::int=1,'second owner can create own case');

select set_config('request.jwt.claim.sub',pg_temp.fb_id('unverified')::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.fb_id('unverified'),'role','authenticated','user_metadata',jsonb_build_object('email_verified',true))::text,true);
select pg_temp.fb_denied($q$select public.read_case_workspace()$q$,'42501','VERIFIED_ACCOUNT_REQUIRED');
select pg_temp.fb_denied($q$select public.sync_case_records('[]'::jsonb)$q$,'42501','VERIFIED_ACCOUNT_REQUIRED');
select pg_temp.fb_assert((select count(*)=0 from public.cases),'user-editable verified claim does not grant reads');

reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true),set_config('request.jwt.claims','{"role":"anon"}',true);
select pg_temp.fb_denied($q$select public.read_case_workspace()$q$,'42501');
select pg_temp.fb_denied($q$select public.sync_case_records('[]'::jsonb)$q$,'42501');
select pg_temp.fb_denied($q$select * from public.cases$q$,'42501');
select pg_temp.fb_assert((select count(*)=0 from storage.objects where name like pg_temp.fb_id('owner_a')::text||'/%'),'anonymous storage metadata access denied');
reset role;
select pg_temp.fb_assert((select public=false and file_size_limit=26214400 from storage.buckets where id='evidence-originals'),'deployed original bucket private with 25 MiB limit');
select pg_temp.fb_assert(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('sync_case_records','read_case_workspace') and p.prosecdef),'public RPC wrappers are security invoker');

rollback;
select 'PASS: complete transaction rolled back; no Auth fixtures, records, metadata objects, or helper functions persisted' as verification;
