# Case Intelligence Data Model

This PR adds the Family Bench case-intelligence data foundation using the existing Supabase client and PowerSync setup. It does not replace auth, change the Supabase project connection, add real AI, or generate filings.

## Current Supabase Setup

- Client: `lib/supabase/client.ts`
- Auth storage: Expo SecureStore on native, `localStorage` on web
- Auth/session usage: `lib/powersync/connector.ts` calls `supabase.auth.getSession()` for the PowerSync token
- Existing local sync schema: `lib/powersync/schema.ts`
- Existing stores: `stores/entries.ts`, `stores/onboarding.ts`
- Existing SQL migrations before this PR: none found
- Existing generated Supabase types before this PR: none found

## Current Schema Map

| Current table/source | Intended model | Status |
|---|---|---|
| `cases` | cases | Reused and lightly enriched |
| `children` | children | Reused and linked to cases |
| `entries` | entries | Reused and enriched with issue/court-ready fields |
| `attachments` | evidence attachments | Reused as the evidence attachment table |
| `court_orders` | court orders | Reused and linked to source evidence |
| `compliance_checks` | compliance checks | Preserved |
| `filing_packages` | filing packages | Reused and enriched for filing package state |
| `key_dates` | key dates/deadlines | Reused and linked to filings/orders |
| `reports` | report exports | Preserved for later report work |
| missing | people/parties | Added as `people` |
| missing | court order provisions | Added as `court_order_provisions` |
| missing | pattern tags | Added as `pattern_tags` |
| missing | AI outputs | Added as `ai_outputs` |
| missing | advisor threads | Added as `advisor_threads` |

## Intended Schema

Core ownership:

- Every case-intelligence table has `user_id`.
- Public tables have RLS enabled.
- Owner policies use `user_id = auth.uid()`.
- Client code does not hardcode user IDs.

Core relationships:

- `entries.case_id -> cases.id`
- `children.case_id -> cases.id`
- `people.case_id -> cases.id`
- `attachments.entry_id -> entries.id`
- `attachments.case_id -> cases.id`
- `attachments.storage_bucket` + `attachments.storage_path -> Supabase Storage object`
- `court_orders.case_id -> cases.id`
- `court_order_provisions.court_order_id -> court_orders.id`
- `entry_children` links entries to children
- `entry_people` links entries to people
- `entry_court_order_provisions` links entries to order provisions
- `filing_package_entries` links filings to entries
- `filing_package_attachments` links filings to evidence
- `ai_output_sources` links AI outputs to source entries, evidence, or order provisions

Evidence and AI are intentionally separate:

- Evidence lives in `attachments` with hash/provenance fields.
- AI interpretation lives in `ai_outputs`.
- AI source grounding lives in `ai_output_sources`.

## App-Side Types And Selectors

Typed models:

- `lib/supabase/database.types.ts`
- `lib/case-intelligence/types.ts`

Selectors and hook:

- `getActiveCase`
- `getUpcomingKeyDates`
- `getRecentEntries`
- `getFlaggedEntries`
- `getEntriesByType`
- `getEntriesByIssue`
- `getPatternsForCase`
- `getNextStepForCase`
- `useCaseIntelligenceHome`

The home screen now reads from Supabase when a session and case data exist. If no session or case data exists, it uses a local non-persistent fallback snapshot.

## Migrations Added

- `supabase/migrations/20260506150506_case_intelligence_foundation.sql`
- `supabase/migrations/20260506211725_case_intelligence_deferred_rls_policies.sql`

The foundation migration:

- Creates missing case-intelligence tables.
- Adds columns to existing core tables with `alter table ... add column if not exists`.
- Adds indexes used by the app selectors.
- Does not enable RLS.
- Does not create policies.
- Does not change grants.
- Does not create storage buckets or storage policies.

The deferred RLS migration is intentionally separated and labeled:

```text
DO NOT APPLY UNTIL RLS INSPECTION IS COMPLETE.
```

It contains the planned RLS enablement, authenticated grants, and owner policies, but it should not be applied until current live policies and RLS status are inspected.

## Remote Verification Notes

PR 2.5B performed read-only verification against the confirmed project ref `aeeovmnhfxobeqpczjvt` using the local anon key and Supabase REST schema cache. MCP OAuth was configured, but catalog-level MCP inspection was blocked by a token-refresh initialization failure in the active Codex session. Supabase CLI project inspection was also unavailable in this session.

Remote tables visible through the anon REST API:

- `cases`
- `children`
- `entries`
- `attachments`
- `court_orders`
- `filing_packages`
- `key_dates`

Tables missing from the REST schema cache:

- `people`
- `court_order_provisions`
- `entry_children`
- `entry_people`
- `entry_court_order_provisions`
- `filing_package_entries`
- `filing_package_attachments`
- `pattern_tags`
- `advisor_threads`
- `ai_outputs`
- `ai_output_sources`

Column gaps found on existing remote tables:

- `cases`: missing `title`, `county`, `state`, `is_active`, `next_hearing_at`
- `children`: missing `case_id`, `deleted_at`
- `entries`: missing `issue_key`, `private_notes`, `court_ready_summary`
- `attachments`: missing `case_id`, `mime_type`, `file_size_bytes`, `hash_algorithm`, `captured_at`, `source_device`, `exif`, `deleted_at`
- `court_orders`: missing `source_attachment_id`
- `filing_packages`: missing `title`, `due_date`, `completion_percent`, `court_ready_summary`
- `key_dates`: missing `related_filing_package_id`, `related_court_order_id`

## Migration Conflict Found

The first version of the migration was not safe for the verified remote schema because `filing_packages` already exists remotely, while intended columns such as `title`, `due_date`, `completion_percent`, and `court_ready_summary` were only inside the `create table if not exists public.filing_packages` block.

In PostgreSQL, `create table if not exists` does not enrich an existing table. If applied as originally written, the app-side schema would still expect columns that were never added.

PR 2.5C revised the migration so intended columns are also covered by `alter table ... add column if not exists` statements after each `create table if not exists` block. For pre-existing tables, newly added business fields are nullable unless they have a safe default.

PR 2.5E split schema work from RLS work. The schema foundation migration now contains tables, columns, foreign-key references, and indexes only. RLS enablement, grants, and policies are deferred to a separate migration that is not approved for apply.

## Revised Migration Safety Notes

The revised migration is safer for the currently observed schema because:

- existing core tables receive explicit `alter table add column if not exists` coverage
- `filing_packages` now receives the missing PR 2.5B columns
- `attachments` now includes `storage_bucket` and `storage_path` linkage for the storage plan
- new tables are still created when missing

The schema foundation migration may be reviewed for apply separately from RLS because it no longer changes table access policy. It still needs normal migration review against the live project before apply.

The deferred RLS migration should not be applied until catalog-level RLS inspection is completed. It enables RLS and adds owner policies. That is structurally correct for the intended model, but the project already has exposed tables, and existing policy behavior must be inspected before changing it.

Use `docs/supabase-rls-inspection.sql` before applying this migration.

Storage bucket creation is intentionally separate. See `docs/evidence-storage-plan.md`.

## Gaps / Next Migrations

PR 3 should not add real AI yet unless the product scope changes. Recommended next data work:

- Inspect current remote RLS policies and RLS enabled status with catalog-level access.
- Re-run the remote Supabase schema comparison against this revised migration.
- Apply the schema foundation migration only after confirming the target project and reviewing the SQL.
- Apply the deferred RLS migration only after `docs/supabase-rls-inspection.sql` results are reviewed.
- Generate official Supabase types from the linked project after the migration is applied.
- Add storage bucket policies for evidence attachments.
- Add audit logging for evidence mutations and practitioner sharing.
- Add stricter enum/check constraints once capture flows are finalized.
- Add report/export tables only when report generation is implemented.
- Decide whether `attachments` should be renamed later or kept as the stable table for `EvidenceAttachment`.
