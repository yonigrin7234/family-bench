\set ON_ERROR_STOP on
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select public.sync_case_records('[{"table_name":"entries","row":{"id":"00000000-0000-0000-0000-000000000401","user_id":"00000000-0000-0000-0000-000000000001","case_id":"00000000-0000-0000-0000-000000000101","body":"Stale concurrent writer"},"expected_version":4,"mutation_id":"00000000-0000-0000-0000-000000009002"}]');
