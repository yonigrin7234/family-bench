# Case Intelligence Data Model

This document preserves the earlier PR 2.5 data-model design and findings. Its baseline schema map and historical verification remain useful context; its original deployment sequence has been superseded. See [production foundation status](production-foundation-status.md) for the implementation built on September 4, 2026 and [authenticated sync notes](authenticated-case-sync.md) for the current RPC and access model.

The active deployment artifact is the single [authenticated case foundation](../supabase/migrations/20260905032608_authenticated_case_foundation.sql), which combines schema enrichment, old policy inputs and current hardening in one transaction. It was implemented, tested locally and applied after explicit user approval as ledger version `20260905032608` in the confirmed Family Bench project. The app and managed-service workflow still need release verification. Archived [migration inputs](../supabase/migration-inputs/README.md) must never be applied independently.

## Historical PR 2.5 Supabase Setup

- Client: `lib/supabase/client.ts`
- Auth storage: Expo SecureStore on native, `localStorage` on web
- Auth/session usage: `lib/powersync/connector.ts` calls `supabase.auth.getSession()` for the PowerSync token
- Existing local sync schema: `lib/powersync/schema.ts`
- Existing stores: `stores/entries.ts`, `stores/onboarding.ts`
- Existing SQL migrations before this PR: none found
- Existing generated Supabase types before this PR: none found

## Historical Schema Map

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

At the PR 2.5 baseline, the home screen read from Supabase when a session and case data existed and otherwise used a local fallback snapshot. The current implementation separates demo and authenticated owner workspaces and uses the atomic workspace-read RPC; it does not retain that baseline fallback as the authenticated account model.

## Preserved Migration Inputs

- [May schema foundation](../supabase/migration-inputs/20260506150506_case_intelligence_foundation.sql)
- [May deferred RLS policies](../supabase/migration-inputs/20260506211725_case_intelligence_deferred_rls_policies.sql)
- [September sync hardening](../supabase/migration-inputs/20260905023317_authenticated_case_sync.sql)

The two May files were not present in the restored target's migration history. They have been moved out of the active migrations directory with their contents unchanged. The following descriptions explain their historical split, not a current instruction to apply them separately.

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

It contains the earlier RLS enablement, authenticated grants, and owner policies. Current target inspection is complete, but this input remains archived: never apply it separately. The composite adds restrictive verified-owner policies, denies direct client DML and writes through a fixed version-checked RPC, so the older permissive grants cannot define the final deployed access model.

## Historical Remote Verification Notes

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

## Historical Migration Safety Notes, Superseded Deployment Instructions

The revised migration is safer for the currently observed schema because:

- existing core tables receive explicit `alter table add column if not exists` coverage
- `filing_packages` now receives the missing PR 2.5B columns
- `attachments` now includes `storage_bucket` and `storage_path` linkage for the storage plan
- new tables are still created when missing

The earlier recommendation to deploy schema and RLS separately is superseded. The active composite includes schema additions, restrictive policies, the private original-evidence bucket, version receipts, original-capture protection and server entry revisions in one transaction. This prevents an externally visible interval with only the old permissive policy grants. See [authenticated sync notes](authenticated-case-sync.md) for compatibility checks against the restored schema, including required profiles and legacy CHECK values.

## Remaining Data Work

- Obtain the pending explicit approval for the exact tested composite and target, then apply it once through the reviewed migration path. Never apply archived inputs or blindly run `db push` or a remote reset: the target has 44 historical managed migrations not reproduced by this repository.
- Verify managed Auth, Storage HTTP behavior, deployed owner isolation and the complete capture/recovery/export workflow after application. Local PostgreSQL tests do not establish these outcomes.
- Generate and review official Supabase types against the confirmed schema after migration; preserve application-specific types intentionally.
- Retain practitioner sharing, broader audit/retention policy, official filing/form support, complete account portability and AI grounding as separate requirements in the [coverage inventory](requirements-coverage.md).
