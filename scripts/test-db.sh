#!/usr/bin/env bash
set -euo pipefail

# Uses a fresh disposable PostgreSQL cluster on a private Unix socket, with no
# TCP listener, remote connection, real user data, or Supabase migration history.
repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
pg_bin="${FAMILY_BENCH_PG_BIN:-}"
if [[ -z "$pg_bin" ]]; then
  if command -v pg_config >/dev/null 2>&1; then
    pg_bin="$(pg_config --bindir)"
  elif [[ -x /opt/homebrew/bin/initdb ]]; then
    pg_bin=/opt/homebrew/bin
  else
    echo 'PostgreSQL 14+ required. Set FAMILY_BENCH_PG_BIN to its bin directory.' >&2
    exit 1
  fi
fi
for binary in initdb pg_ctl psql; do
  [[ -x "$pg_bin/$binary" ]] || { echo "Missing PostgreSQL binary: $pg_bin/$binary" >&2; exit 1; }
done
db_test_root="$(mktemp -d /tmp/family-bench-db.XXXXXX)"
db_started=false
cleanup() {
  if [[ "$db_started" == true ]]; then
    "$pg_bin/pg_ctl" -D "$db_test_root/data" -m immediate -w stop >/dev/null 2>&1 || true
  fi
  rm -rf "$db_test_root"
}
trap cleanup EXIT INT TERM
"$pg_bin/initdb" -D "$db_test_root/data" --auth-local=trust --auth-host=reject --no-locale --encoding=UTF8 >"$db_test_root/init.log" 2>&1 || {
  cat "$db_test_root/init.log" >&2
  exit 1
}
"$pg_bin/pg_ctl" -D "$db_test_root/data" -l "$db_test_root/server.log" -o "-F -h '' -k $db_test_root -p 5432" -w start >"$db_test_root/start.log" 2>&1 || {
  cat "$db_test_root/server.log" >&2
  exit 1
}
db_started=true
psql_args=(-X -q -v ON_ERROR_STOP=1 -h "$db_test_root" -p 5432)
apply_sql() {
  "$pg_bin/psql" "${psql_args[@]}" -d "$1" -f "$2" >"$db_test_root/migration.log" 2>&1 || {
    cat "$db_test_root/migration.log" >&2
    exit 1
  }
}
run_suite() {
  local test_database="$1"
  # Roles are cluster-wide, so only the first suite creates them.
  if [[ "$test_database" == postgres ]]; then
    apply_sql "$test_database" "$repo_root/tests/db/bootstrap.sql"
  else
    sed '/^create role /d' "$repo_root/tests/db/bootstrap.sql" >"$db_test_root/bootstrap-second.sql"
    apply_sql "$test_database" "$db_test_root/bootstrap-second.sql"
    python3 "$repo_root/tests/db/build-inspected-fixture.py" "$db_test_root/inspected-schema.sql"
    apply_sql "$test_database" "$db_test_root/inspected-schema.sql"
  fi
  local composite_migrations=("$repo_root"/supabase/migrations/*_authenticated_case_foundation.sql)
  [[ ${#composite_migrations[@]} -eq 1 && -f "${composite_migrations[0]}" ]] || {
    echo 'Expected exactly one authenticated_case_foundation migration.' >&2
    exit 1
  }
  apply_sql "$test_database" "${composite_migrations[0]}"
  "$pg_bin/psql" "${psql_args[@]}" -d "$test_database" -f "$repo_root/tests/db/case_sync.sql" >/dev/null
  "$pg_bin/psql" "${psql_args[@]}" -d "$test_database" -f "$repo_root/tests/db/concurrent-writer.sql" >"$db_test_root/writer.log" 2>&1 &
  writer_pid=$!
  attempts=0
  until rg -q 'FIRST_WRITER_HOLDS_LOCK' "$db_test_root/writer.log"; do
    attempts=$((attempts + 1))
    if [[ "$attempts" -ge 100 ]]; then
      cat "$db_test_root/writer.log" >&2
      echo 'Concurrent writer did not reach its test barrier.' >&2
      exit 1
    fi
    sleep 0.05
  done
  "$pg_bin/psql" "${psql_args[@]}" -d "$test_database" -f "$repo_root/tests/db/concurrent-read.sql" >/dev/null
  if "$pg_bin/psql" "${psql_args[@]}" -d "$test_database" -f "$repo_root/tests/db/concurrent-contender.sql" >"$db_test_root/contender.log" 2>&1; then
    echo 'Concurrent stale writer unexpectedly succeeded.' >&2
    exit 1
  fi
  wait "$writer_pid"
  rg -q 'SYNC_CONFLICT' "$db_test_root/contender.log" || { cat "$db_test_root/contender.log" >&2; exit 1; }
  "$pg_bin/psql" "${psql_args[@]}" -d "$test_database" -f "$repo_root/tests/db/concurrent-result.sql" >/dev/null
  echo "Local PostgreSQL checks passed: $test_database"
}
run_suite postgres
"$pg_bin/psql" "${psql_args[@]}" -d postgres -c 'create database inspected_schema' >/dev/null
run_suite inspected_schema
