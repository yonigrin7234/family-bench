\set ON_ERROR_STOP on
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
do $$
declare workspace jsonb := public.read_case_workspace();
begin
  if not exists(select 1 from jsonb_array_elements(workspace->'snapshot'->'entries') r where r->>'id'='00000000-0000-0000-0000-000000000401' and r->>'body'='Reviewed observation')
    or not exists(select 1 from jsonb_array_elements(workspace->'versions') r where r->>'table_name'='entries' and r->>'record_id'='00000000-0000-0000-0000-000000000401' and r->>'version'='4') then
    raise exception 'Uncommitted workspace data/version mismatch';
  end if;
  raise notice 'PASS: atomic read during concurrent write pairs previous content and version';
end;
$$;
