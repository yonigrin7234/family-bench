# Family Bench launch readiness

Assessment date: September 4, 2026 (America/Los_Angeles).
Reviewed local branch `baseline-v2`, commit `16248b2`; latest local commit dated May 11, 2026.
Status: DONE_WITH_CONCERNS. Assessment completed; production readiness has not been established.

**Historical baseline, superseded for current implementation status.** The findings and checks below describe the starting commit before the focused workflow was built. See [production foundation status](production-foundation-status.md) for the subsequent implementation and remaining verification. The tested [single composite migration](../supabase/migrations/20260905032608_authenticated_case_foundation.sql) was applied after explicit user approval as `20260905032608`. The app has not been launched or production-verified. Earlier SQL is preserved under [migration inputs](../supabase/migration-inputs/README.md) and must never be applied independently.

Family Bench is a substantial functioning local prototype. The next useful milestone is a private beta that completes one trustworthy workflow: create a personal case, record an event with original evidence, recover the record, find and review it, and download an organized factual packet. The full product specification remains a much broader undertaking.

## What exists

| Area | Verified state |
| --- | --- |
| Product definition | Canonical 79-section specification, design references, shared responsive UI, Expo routes for mobile and web. |
| Capture and review | Six-step manual capture, local entries, review/edit metadata, flags, timeline and evidence search. |
| Case organization | Local case setup, children, people, court orders, provisions, key dates and filing packages. |
| Reports | Data-derived timeline, flagged, communication and medical previews; local saved report versions. |
| Voice | Local recording and typed/pasted transcript review; automatic transcription is absent. |
| Backend foundation | Supabase client, types, migrations and PowerSync scaffolding exist. Account and sync workflows are incomplete. |

Implementation references: [capture](/Users/yoni/family-bench/app/capture.tsx:479), [case setup persistence](/Users/yoni/family-bench/lib/case-intelligence/useCaseIntelligence.ts:1910), [report calculations](/Users/yoni/family-bench/app/reports.tsx:174), [voice capture](/Users/yoni/family-bench/app/voice-capture.tsx:151).

## Blockers before a beta with real records

1. **Accounts and private case ownership.** No sign-in, sign-up, sign-out or auth-state lifecycle exists in the application. Without an existing session, loading returns demo data. Case setup saves locally. Implement a clean personal workspace and verify isolation between two accounts. [Loader](/Users/yoni/family-bench/lib/case-intelligence/useCaseIntelligence.ts:91).

2. **Reliable persistence and recovery.** The store launches persistence without awaiting it; write failures update diagnostics without failing the capture action. Capture can navigate to the timeline despite a storage error. Save completion must reflect durable success, with visible recovery behavior. [Persistence](/Users/yoni/family-bench/lib/case-intelligence/useCaseIntelligence.ts:1701), [capture](/Users/yoni/family-bench/app/capture.tsx:544).

3. **Connected cloud data and sync.** PowerSync has no runtime initialization or connection. The only direct remote mutation is a gated entry insert; simply enabling it is insufficient because it sends `local-entry-<uuid>` identifiers to UUID database columns, and the corresponding case is local. Implement ownership, compatible IDs, case/entry/attachment persistence, retries and conflict behavior. [Entry ID](/Users/yoni/family-bench/lib/case-intelligence/useCaseIntelligence.ts:487), [insert](/Users/yoni/family-bench/lib/case-intelligence/useCaseIntelligence.ts:1316), [archived baseline SQL](/Users/yoni/family-bench/supabase/migration-inputs/20260506150506_case_intelligence_foundation.sql:85).

4. **Durable original evidence.** Attachment metadata stores local references and placeholder hashes. The web picker creates object URLs without persisting file bytes, so those references do not preserve files across browser sessions. Storage buckets and policies are a plan. Implement original-file storage, actual file hashes, retrieval and truthful provenance. Main capture attachment slots are still coming-later controls. [Attachment builder](/Users/yoni/family-bench/lib/case-intelligence/useCaseIntelligence.ts:637), [web picker](/Users/yoni/family-bench/app/entry/[id].tsx:243), [storage plan](/Users/yoni/family-bench/docs/evidence-storage-plan.md:3), [capture attachments](/Users/yoni/family-bench/app/capture.tsx:340).

5. **A usable output.** Export currently displays JSON and explicitly creates no file. Final report PDF, print output and evidence packets are absent. Finish one downloadable factual timeline with source references and an accompanying evidence bundle; verify private notes are excluded from shared outputs. [Export](/Users/yoni/family-bench/app/export-prep.tsx:145), [export limits](/Users/yoni/family-bench/app/export-prep.tsx:217).

6. **Verified privacy and release behavior.** Local case contents are serialized JSON. The RLS migration is marked deferred pending inspection, and the intended remote environment is unclassified in setup documentation. These are unverified deployment gates, not evidence of an exposed live database. Verify account separation, storage permissions, session handling, backup/restore, deletion, error reporting and core workflow tests before inviting users with real evidence. [Local storage](/Users/yoni/family-bench/lib/case-intelligence/persistence.ts:382), [archived baseline RLS input](/Users/yoni/family-bench/supabase/migration-inputs/20260506211725_case_intelligence_deferred_rls_policies.sql:1), [current setup status](/Users/yoni/family-bench/docs/supabase-project-setup.md).

## Features that overstate current capability

- The custody calculator counts entries by their custody-period tag, not hours or overnights. New capture records set that tag to null. Treat this as an entry breakdown until the custody schedule/time model is implemented. [Calculator](/Users/yoni/family-bench/app/calculator.tsx:77), [capture record](/Users/yoni/family-bench/lib/case-intelligence/useCaseIntelligence.ts:495).
- Capture says GPS is automatically recorded, while the entry builder sets coordinates to null. Align copy with actual behavior. [Copy](/Users/yoni/family-bench/app/capture.tsx:320), [record](/Users/yoni/family-bench/lib/case-intelligence/useCaseIntelligence.ts:503).
- Advisor responses are scripted. Practitioner sharing and safety features are placeholders. These need a clearly limited presentation in an initial beta. [Advisor](/Users/yoni/family-bench/lib/case-intelligence/useCaseIntelligence.ts:1295), [practitioners](/Users/yoni/family-bench/app/practitioners.tsx:130), [safety](/Users/yoni/family-bench/app/safety.tsx:69).

## Recommended delivery milestones

| Milestone | Acceptance condition |
| --- | --- |
| 1. Personal workspace | New account starts with an empty case; a second account cannot access it; logout/session changes isolate local records. |
| 2. Trusted record | Entry and original evidence survive reload, restart and a second device; failed saves are visible and recoverable; originals and edits are distinguishable. |
| 3. Useful packet | User selects a date range and records, reviews the result, and downloads a factual timeline plus evidence bundle with source references and no unintended private notes. |
| 4. Private beta | A proposed 5–10 invited users complete the workflow; observe repeated use, retrieval success and packet usefulness; provide an accessible support channel. |
| 5. Paid release | Address beta failures, add billing and account lifecycle as needed, verify operations and finish the chosen platform's distribution requirements. |

The initial product can serve a single parent and case. AI advice, OCR, official court forms, automated filing, integrations and practitioner collaboration should be scheduled after the first workflow is dependable and its usefulness is demonstrated. This is a proposed scope reduction from the canonical specification, not an already approved specification change.

## Verification performed

- `./node_modules/.bin/tsc --noEmit`: passed, no errors.
- Production web export: passed, 19 routes. A temporary Metro configuration disabled Watchman to avoid a sandbox restriction; application source was unchanged. Output is in `/private/tmp/family-bench-readiness-20260905-build-verification`.
- Browser smoke check of fresh export: Home → Reports → Export preparation rendered. No browser console errors were reported on that path. Export visibly states that no file is generated.
- No configured product test runner, linter or CI workflow was found. The only test is a legacy text-rendering snapshot. These categories are unverified, not passing tests. [Scripts](/Users/yoni/family-bench/package.json:5), [legacy test](/Users/yoni/family-bench/components/__tests__/StyledText-test.js:6).
- Health workflow score for the sole configured check, TypeScript: 10/10. A redistributed composite would also be 10/10 but would measure only compilation, not product or launch readiness. No prior health-history file was found.
- Native release remains unverified: bundle/package identifiers are missing, store submission fields are blank, and Expo Crypto/Haptics dependency versions differ from those expected by installed Expo 54. [App configuration](/Users/yoni/family-bench/app.json:16), [submission](/Users/yoni/family-bench/eas.json:23), [dependencies](/Users/yoni/family-bench/package.json:25).
- No deployed website, live database, storage policies, native device build, account flow, file recovery or full capture/export workflow was verified. No application code, database, deployment or user records were changed by this assessment.

## Roadmap accuracy

The existing roadmap describes an earlier prototype pass. It says the calculator screen does not exist and reports only support timeline, though current code has both the calculator and additional report previews. The parity plan still describes capture as a single form, though it is now a wizard. The roadmap also explicitly defers accounts, storage/sync and final outputs. Use this assessment to plan the move to a real beta, while retaining the canonical specification for the longer-term vision.
