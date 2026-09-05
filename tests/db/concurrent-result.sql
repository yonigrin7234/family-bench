\set ON_ERROR_STOP on
do $$
begin
  if not exists(select 1 from public.entries where id='00000000-0000-0000-0000-000000000401' and body='First concurrent writer') then
    raise exception 'Concurrent winner data lost';
  end if;
  if (select count(*) from public.entry_revisions where entry_id='00000000-0000-0000-0000-000000000401') <> 5 then
    raise exception 'Concurrent conflict produced unexpected revision';
  end if;
  if exists(select 1 from fb_private.case_sync_receipts where mutation_id='00000000-0000-0000-0000-000000009002') then
    raise exception 'Conflicting mutation recorded a success receipt';
  end if;
  if exists(select 1 from fb_private.case_sync_write_context) then
    raise exception 'Write context leaked after commit';
  end if;
  raise notice 'PASS: two concurrent connections preserve winner and reject stale writer';
end;
$$;

set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$
declare workspace jsonb := public.read_case_workspace();
begin
  if not exists(select 1 from jsonb_array_elements(workspace->'snapshot'->'entries') r where r->>'id'='00000000-0000-0000-0000-000000000401' and r->>'body'='First concurrent writer')
    or not exists(select 1 from jsonb_array_elements(workspace->'versions') r where r->>'table_name'='entries' and r->>'record_id'='00000000-0000-0000-0000-000000000401' and r->>'version'='5') then
    raise exception 'Committed workspace data/version mismatch';
  end if;
  raise notice 'PASS: atomic read after commit pairs winner content and version';
end;
$$;
