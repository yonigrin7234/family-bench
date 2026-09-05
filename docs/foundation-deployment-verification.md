# Foundation deployment verification

Verified September 4, 2026 Pacific / September 5 UTC. This records a database deployment and bounded checks, not a frontend launch or full managed-service acceptance.

This receipt preserves that database checkpoint, including its original zero-user counts and then-outstanding checks. Later September 5 frontend deployment, Auth URL configuration and bounded synthetic production account/original checks are recorded in [live verification](live-verification.md). Those later checks do not complete the two-owner admin harness, mailbox delivery, native acceptance or complete product acceptance. The later export regression was fixed and production downloads verified in the [account release](account-release-verification-2026-09-05.md).

## Applied artifact

| Item | Verified value |
| --- | --- |
| Project | Family Bench — `aeeovmnhfxobeqpczjvt` |
| Organization | `epelsraplgfepkesvsdt` |
| API URL | `https://aeeovmnhfxobeqpczjvt.supabase.co` |
| Tool result | `supabase_apply_migration`, name `authenticated_case_foundation`, `{ "success": true }` |
| Ledger version | `20260905032608`; 45 total records, original 44 unchanged |
| Artifact | [20260905032608_authenticated_case_foundation.sql](../supabase/migrations/20260905032608_authenticated_case_foundation.sql) |
| SHA-256 | `0cf2a22700470ec8b16e346ed9dd5db4f313e4d2ce524b876bcab8997457b167` |

The user explicitly approved the previously blocked migration. The exact reviewed content was then applied once. The local file was renamed to the actual generated ledger version without changing its bytes or rewriting remote history.

## Managed-service observations

- Both `public.sync_case_records(jsonb)` and `public.read_case_workspace()` are present. Authenticated has execute permission; anon does not.
- `evidence-originals` exists, is private, and has a 26,214,400-byte upload limit.
- Auth health returned HTTP 200. Public Auth settings reported email sign-in enabled, signup enabled, and automatic email confirmation disabled. These flags do not verify email delivery, redirect allowlists or native callbacks.
- Anonymous HTTP calls to both workspace RPCs returned 401 / `42501`.
- A REST request with `Accept-Profile: fb_private` returned 406 / `PGRST106`, confirming that schema is not exposed through the current API.
- A public original-object URL returned 400 / `NoSuchBucket`; the catalog independently confirms the bucket exists and is private. No actual original was uploaded for this probe.
- Follow-up counts remained zero Auth users, cases, entries and original objects, with 45 migration records. No synthetic user, case or byte object remains from this verification.

Security advisors no longer report the two API-executable RLS-event-function warnings. Two informational notices concern intentionally inaccessible private receipt/context tables with RLS and no direct-access policies. The existing `vector` extension in `public` remains a warning; its legal-knowledge embedding/index dependencies were inspected and left intact. [Supabase remediation guidance](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public).

The live schema's public TypeScript types were generated read-only to `/private/tmp/family-bench-database.generated.ts` and compared with the maintained app contract. All 180 writable fields across 13 supported record kinds exist; current builders supply the live required fields, and both RPC contracts match their callers. Some legacy nullable fields remain narrower in the app's hand-maintained types, so this is a current-path compatibility check rather than full generated-type equivalence. No secret keys, credentials or user data are included in this document or that schema output.

## Local and browser checks

- All 53 JavaScript/TypeScript tests passed with zero failures or skips, including the live-verifier guards. TypeScript and the final production Expo export passed. The export contains 20 routes, with about 1.93 MB main JavaScript and a separately loaded 1.52 MB PDF/export bundle.
- The exact deployed SQL passes both fresh-schema and inspected-legacy-schema suites, including separate-connection conflict/concurrency checks. The additional [rollback verification SQL](../tests/db/live-rollback-verification.sql) passes locally against both fixtures.
- The final built account UI was inspected in the browser at 375px phone, 768px tablet and 1280px desktop widths. Observed layouts had no horizontal overflow. Email/password inputs are 16px, auth buttons are 44px tall with 8px gaps, labels and heading semantics are exposed, and Enter from email focuses password. Empty sign-in/reset email submissions show an accessible error without sending email. Signup displays its password guidance.
- Reloading `/auth` works under the local static routing simulation. A fresh `/entry/<synthetic-id>` URL serves the client shell and sends a signed-out visitor to `/auth`. No browser console errors were captured. This checks the auth gate, not an authenticated entry lookup, Vercel CDN behavior or restoration of an entry destination after sign-in.

## Checks still blocked or outstanding

The live query tool rejected the rollback test at its first `CREATE FUNCTION` with SQLSTATE `25006`: the connection uses a read-only transaction. It stopped before fixture insertion. No write-mode override or migration-ledger workaround was attempted. Accordingly, the local rollback suite must not be represented as a live authenticated test.

The available connection does not provide an Auth Admin/Storage cleanup credential, and the local Supabase CLI is unauthenticated. Original files intentionally cannot be deleted by ordinary account clients. A managed Storage byte test therefore needs a securely configured admin fixture/cleanup path before uploading synthetic objects. No service key belongs in Expo public configuration or chat output.

The [future live verification harness](live-verification.md) creates only generated synthetic accounts through Auth Admin, tests real private object bytes and records cleanup results. Its guards and types pass; it has not been run against the managed project.

Still required: managed account confirmation/reset and redirect behavior; actual private Storage byte upload/download and cleanup; authenticated capture → reload → review → PDF/ZIP; second-account/device isolation and conflicts; deployed deep links; native media, sharing and PKCE; full screen-reader/large-text behavior. The [UI/UX plan](ui-ux-production-plan.md) describes the wider design acceptance work.
