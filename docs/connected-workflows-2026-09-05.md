# Connected workspace verification — September 5, 2026

This note covers the connected case, capture/import, forms, filing, workspace-context, private-archive and native persistence work. It records local implementation and automated verification, not a claim that every production workflow has been exercised.

## Case setup and switching

- `/cases` lists the signed-in account's cases and supports opening, switching, creating and editing case setup. Onboarding preserves existing children and records when another case is created or edited.
- The selected case is persisted in the encrypted workspace. Case creation and switching publish the new selection only after the durable save succeeds; failure leaves the previous case selected. Account changes invalidate in-flight work.
- Conversations, report filters, filing selections and pattern-review state are maintained per case. Shared mutators check the current owner and case, including child, original-attachment, provision, filing and saved-report links.
- Onboarding preserves an explicit first-task destination of `capture` or `briefcase`; unknown destinations return home.

## Invalid context and recovery

`lib/case-intelligence/contextIntegrity.ts` checks workspace references before hydration, case switching and persistence. Checks cover case selection, per-case state, conversation source entries, filing/exhibit attachments, report entry/child/filing filters, pattern namespaces and court-form source entries. Unsupported imported fields are also detected.

An invalid context is preserved as an owner-bound copy in encrypted local storage. Affected view state is hidden while unrelated valid context and case records remain available. The interface presents a generic recoverable issue without printing imported field names or content. Valid record rows can continue syncing, but the affected workspace JSON and recovery copies are withheld from cloud sync.

Settings offers **Continue with safe working context**. It first saves the safe context and retained recovery copies durably, then clears the active issue. A failed write leaves the issue and original copies in place. Recovery copies survive reload and remain local even after this action; clearing the local workspace is blocked while those copies exist. No automatic destructive cleanup or archive-restore workflow was added.

## Private archive

The private archive includes all loaded case records and live original attachment bytes, plus explicit projections of selected-case state, per-case conversations and selections, saved reports, filing/pattern state, incomplete court-form drafts, conflict history and preserved context-recovery copies. Active authentication sessions, runtime credentials and device encryption keys are excluded.

Unknown fields inside preserved recovery copies are deliberately retained for recovery. The archive README identifies these copies as potentially sensitive imported content; they are never applied automatically or included in shared evidence packets. Archive creation validates ownership and case references, verifies every included original's bytes and hash, enforces the existing 128 MiB limit and cancels if the account/session or captured workspace changes. It fails as a whole when an original is unavailable.

The archive represents the data loaded into the app. It does not claim to include deleted attachment bytes, server-only audit history, billing/provider data or authentication credentials, and it is not yet a supported restore format.

## Capture, CSV import and source privacy

Initial entry capture validates typed details, custody intervals, child/custody scope and optional initial visibility. The initial content hash binds those structured fields. [CSV import](../app/import.tsx) adds an explicitly selected case and child scope, downloadable template/field guide, row review, validation and partial-progress retry. It accepts the documented Family Bench UTF-8 CSV format, up to 4 MiB and 500 records; provider-specific exports are not mapped automatically.

The [import runner](../lib/imports/run.ts) durably saves the private CSV source, preserves and reads back its original bytes, and checks the reviewed hash before adding rows. Stable identities and duplicate matching are scoped to owner, case, child, original file and imported fields. Exact replay retains later edits; it does not merge manually entered events by similar text. Failed saves remain retryable and cannot count an optimistic unsaved record as complete. Case/session checks run after asynchronous boundaries.

The [store](../lib/case-intelligence/useCaseIntelligence.ts) validates CSV provenance, matching source/attachment identity, owner, case, file hash and child scope before saving imported rows. Original CSV sources are private at the first durable save and cannot later become court-ready. Imported rows start private and can be reviewed individually. [Shared-output selection](../lib/export/model.ts) independently excludes CSV source records even if their ordinary visibility metadata is inconsistent. Private notes and raw import metadata are excluded from shared outputs.

## Forms and filing packages

[Court forms](../app/forms.tsx) provides an initial MC-031 and selected FL-300 field workflow using [manifested official sources and editable working templates](../assets/forms/manifest.json). It supports incomplete sanitized drafts, explicit source-text insertion, save/resume, validation and unsigned editable PDFs. Template hashes, mapped field types, checkbox values, repeated captions, preserved form fields and overflow/unsupported-glyph failures are tested in [forms tests](../lib/forms/__tests__/forms.test.ts). Source entries must still be live, shareable and in the current owned case before generation. No package text is inserted automatically, and the generated forms contain only the reviewed form inputs.

This is a limited form library, not every state/county form or all FL-300 requests. Support, property, fees, emergency requests, extra attachments, final signatures and court acceptance remain outside the guided flow. The template’s embedded Save/Print/Clear buttons are inactive; users use their PDF viewer controls. The [preparation guard](../lib/forms/preparation.ts) pins meaningful draft/source content before saving. Same-content sync replacements and unrelated updates can complete generation; source facts, privacy, identity or draft changes still cancel it. The 10 focused forms tests include a real MC-031 generation across same-content replacement, while account/session/mount/case checks remain in the caller. Browser and native sharing checks are separate.

[Filing Builder](../app/filings.tsx) connects a selected package to entry review, its linked factual report types, timeline PDF/evidence ZIP preparation, the separate Forms workflow and Briefcase. [Package selection](../lib/filings/model.ts) resolves only current owned case records. Explicit original links include their parent entries; the review explains that the ZIP contains every live original attached to the selected entries, including sibling files not linked individually. Private, cross-case, missing or inconsistent source links block output. Generic unlink controls recover tombstoned source references without revealing another case’s labels or deleting records/files.

Package creation, selection, status and link/checklist changes publish after durable persistence succeeds. Failed toggles leave the prior visible selection intact, and stable creation IDs prevent duplicates on retry. Status and checklist marks are user preparation notes; they do not establish completed, filed, accepted or served papers. E-filing and service are not performed. Package-scoped [reports](../app/reports.tsx) and [export preparation](../app/export-prep.tsx) retain the explicit scope and fail closed for invalid package requests.

## Native temporary files and persistence

The [temporary-source registry](../lib/evidence/sourceCleanup.ts) records individual app-cache paths in bounded SecureStore slots before using a native selection. Its [queue](../lib/evidence/sourceCleanupCore.ts) protects active selections, removes abandoned/successfully preserved copies, retains failed removals for retry and recovers cleanup on process restart. Capture, voice, entry selection, CSV staging and native artifact delivery use this lifecycle. Provider/gallery originals, app Documents files, directories and cache-path escapes are excluded from cleanup. A cleanup failure remains visible with a retry action; it is not reported as successful deletion. Tests exercise the queue and native adapter with injected file/SecureStore ports, not a physical-device deletion audit.

[Native workspace persistence](../lib/case-intelligence/persistence.ts) now serializes reads and sequence initialization with writes and clears for each account. A same-account reopen waits for an earlier pending save, and a failed write can recover the previous verified encrypted slot. [Native persistence tests](../tests/persistence.native.test.ts) reproduce reopen/save, failed-slot recovery and clear/read interleavings while preserving another account’s data. These checks supplement the store’s account-epoch, durable-save, retry and conflict tests.

## Checks completed

Checks recorded on September 5, 2026:

- The release coordinator’s full-suite checkpoint was **169 passed**. This is a checkpoint, not the final post-review count; consult the release status for subsequent changes and final build results.
- `node --import tsx --test tests/store.integration.test.ts tests/context-integrity.test.ts lib/export/__tests__/privateArchive.test.ts` — 33 passed at the context/archive checkpoint.
- `node --import tsx --test tests/store.integration.test.ts lib/filings/__tests__/model.test.ts tests/imports.test.ts` — 43 passed at the filing/CSV checkpoint.
- `node --import tsx --test lib/filings/__tests__/model.test.ts tests/store.integration.test.ts` — 28 passed after unavailable-source unlink recovery.
- The forms implementation handoff records **10 passing forms tests**, including four preparation-guard tests; these are additional focused evidence after the 169-test checkpoint.
- `npm run typecheck` and `git diff --check` passed at the scoped handoff. The final release reruns are owned by the coordinator.

The focused tests exercise the actual store and pure validators with injected authentication, network and durable-storage ports. They cover two-case switching/reload, failed writes, account changes, scoped links, preservation of malformed imported context, successful and failed recovery, cloud withholding, form drafts, CSV privacy and archive contents. These tests verify application state transitions; they do not replace real browser/native, second-device or deployed Auth/Storage testing.

These connected-workflow fixes made no remote mutation or schema change; the separately approved foundation deployment is documented elsewhere. Live password authentication and actual Storage byte round trips remain outside this verification. The earlier deployed rollback-fixture attempt was rejected by the SQL tool's read-only transaction before fixture creation; see `live-verification.md` and `foundation-deployment-verification.md` for that boundary.

## Account lifecycle follow-up

The installed Supabase SDK supports TOTP enrollment, verification, removal and assurance-level inspection. Completing MFA requires both UI/session handling and backend assurance enforcement; the current verified-owner database gate checks email confirmation. This review did not change Auth configuration, policies or migrations. Official guidance: [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa) and [TOTP implementation](https://supabase.com/docs/guides/auth/auth-mfa/totp).
