# Supabase Project Setup

Family Bench must know exactly which Supabase project it is targeting before any schema, migration, RLS, storage, or generated-type work happens.

Do not run migrations against production unless the active project has been explicitly confirmed for that change.

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

Current intended project for later verification:

```text
URL: https://aeeovmnhfxobeqpczjvt.supabase.co
Project ref: aeeovmnhfxobeqpczjvt
Migration target: not confirmed
Environment: not classified
```

This project is identified for later setup work, but it is not approved for migrations until the environment is classified and confirmed in the task thread.

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
supabase gen types typescript --project-id <project-ref> --schema public
```

After review, write to the app type file:

```bash
supabase gen types typescript --project-id <project-ref> --schema public > lib/supabase/database.types.ts
```

Use `--project-id` with the confirmed ref when there is any doubt about the linked target.

## Verify Migrations Before Applying

Inspect local migration files:

```bash
ls supabase/migrations
```

Migration split:

- `20260506150506_case_intelligence_foundation.sql` is schema-only.
- `20260506211725_case_intelligence_deferred_rls_policies.sql` is deferred and must not be applied until RLS inspection is complete.

Check linked migration history:

```bash
supabase migration list --linked
```

For local verification, start local Supabase and inspect local migration state:

```bash
supabase start
supabase migration list --local
```

Before applying any migration remotely, confirm:

- the linked project ref
- the environment classification
- the migration filenames
- whether the target is production
- whether the migration changes RLS, storage policies, auth, or user data

For the deferred RLS migration, also run and review:

```bash
docs/supabase-rls-inspection.sql
```

If any of those are unclear, stop.

## Production Safety Rule

Never run `supabase db push`, remote migration commands, storage policy changes, or type generation against an ambiguous or production Supabase project without explicit confirmation in the task thread.
