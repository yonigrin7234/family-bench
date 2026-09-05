# Supabase Project Setup

Family Bench must know exactly which Supabase project it is targeting before any schema, migration, RLS, storage, or generated-type work happens.

Current status: the exact project is confirmed and the tested composite migration was applied after explicit user approval. Ledger version `20260905032608` and the resulting RPCs/private evidence bucket were verified. The frontend and complete managed-service workflow are not yet release-verified. See [production foundation status](production-foundation-status.md).

## Required Environment

Create a local env file from the example:

```bash
cp .env.example .env.local
```

Set these values:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-client-key>
EXPO_PUBLIC_POWERSYNC_URL=<powersync-endpoint-if-used>
```

Never put a service role key or secret key in Expo public environment variables.

## Identify the Correct Project

Before linking or generating types, confirm the project in the Supabase dashboard:

1. Open the intended Supabase project.
2. Confirm the project name and organization.
3. Copy the project reference ID from the project URL or Project Settings.
4. Confirm the app environment: local, staging, or production.
5. Compare the project ref with `EXPO_PUBLIC_SUPABASE_URL`.

The project URL should follow this shape:

```text
https://<project-ref>.supabase.co
```

If the project ref in the URL does not match the intended environment, stop.

Confirmed target, inspected September 4, 2026:

```text
URL: https://aeeovmnhfxobeqpczjvt.supabase.co
Project ref: aeeovmnhfxobeqpczjvt
Project name: Family Bench
Organization ID: epelsraplgfepkesvsdt
Status: ACTIVE_HEALTHY
Migration target: identity confirmed; composite applied as 20260905032608
Release status: existing managed project; database foundation deployed, app not launched
```

Read-only verification after the approved deployment found zero Auth users, 45 migration records ending at `20260905032608`, the `case_sync_versions` table, both new read/sync RPCs, and the private `evidence-originals` bucket. Its 44 original migration records are unchanged. Do not relabel this managed project as a disposable staging environment based on the empty user count.

## Link The Project

Only link after the project ref is confirmed:

```bash
supabase link --project-ref <project-ref>
```

After linking, verify the local CLI metadata:

```bash
cat supabase/.temp/project-ref
```

The printed ref must match the confirmed project ref.

## Generate Types Safely

Do not overwrite generated types until the project is verified.

Preview to stdout first:

```bash
supabase gen types --lang typescript --project-id <project-ref> --schema public
```

After the migration is applied, generate to a separate local file and review the result before merging it into the app types:

```bash
supabase gen types --lang typescript --project-id <project-ref> --schema public > /tmp/family-bench-database.types.ts
```

Use `--project-id` with the confirmed ref when there is any doubt about the linked target. Generation is read-only. The deployed schema now includes the new workflow tables/RPCs as well as historical product tables; review the generated output against the app's maintained contract before replacing it.

## Verify Migrations Before Applying

Inspect local migration files:

```bash
rg --files supabase/migrations
```

The sole active artifact is [`20260905032608_authenticated_case_foundation.sql`](../supabase/migrations/20260905032608_authenticated_case_foundation.sql). It combines schema enrichment, the earlier RLS input and current hardening inside one transaction. The May schema/RLS files and September hardening source are preserved unchanged under [migration inputs](../supabase/migration-inputs/README.md). **Never apply the archived inputs independently.** The former separate schema-then-RLS deployment instructions are superseded.

Check linked migration history:

```bash
supabase migration list --linked
```

The target's 44 historical managed migrations are not reproduced in this repository. Do not blindly run `supabase db push`, rewrite history, or reset the remote database to make those histories look alike. The exact composite was applied once through the Supabase migration tool using name `authenticated_case_foundation`; its generated ledger version was read and the uncommitted file renamed to match without changing its SQL. Do not apply it again. No historical ledger rows were inserted, removed, or rewritten.

For reproducible local verification with PostgreSQL 14+, run:

```bash
bash scripts/test-db.sh
```

The script creates isolated temporary databases with synthetic Auth/Storage fixtures, applies the exact composite, and runs ownership, integrity, conflict and concurrency tests against both fresh and inspected-schema fixtures. It uses no remote connection. Full local Supabase services and native devices remain separate integration environments.

For future schema changes, confirm the target and inspect the actual schema/data difference. Catalog inspection results and the compatibility/restriction design are described in [authenticated sync notes](authenticated-case-sync.md). The foundation is deployed, but the managed-service workflow still needs verification before inviting users with real records.

## Production Safety Rule

Keep read-only inspection separate from remote schema/access mutations. The user approved this exact foundation migration and it is complete. Preserve the managed project's history and data. An available project, a successful migration, a passing local build or a passing SQL fixture suite does not establish production readiness.
