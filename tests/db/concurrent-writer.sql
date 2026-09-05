\set ON_ERROR_STOP on
begin;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select public.sync_case_records('[{"table_name":"entries","row":{"id":"00000000-0000-0000-0000-000000000401","user_id":"00000000-0000-0000-0000-000000000001","case_id":"00000000-0000-0000-0000-000000000101","body":"First concurrent writer"},"expected_version":4,"mutation_id":"00000000-0000-0000-0000-000000009001"}]');
\echo FIRST_WRITER_HOLDS_LOCK
select pg_sleep(1);
commit;
