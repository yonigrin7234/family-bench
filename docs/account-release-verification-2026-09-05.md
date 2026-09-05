# Account navigation and production workflow verification

Verified September 5, 2026 at [family-bench.vercel.app](https://family-bench.vercel.app).

## Release

- Application commit: [`2893d3e5cd871153069633278240b38f7105330e`](https://github.com/yonigrin7234/family-bench/commit/2893d3e5cd871153069633278240b38f7105330e), pushed to `main`.
- Existing Vercel project: `family-bench`, `prj_wRnUDdQp47diLU5Z90nRZXnkJTDi`, team `team_i2eDC4FmQkpJq7mCVwUMEJXp`.
- Production deployment: `dpl_daSdp9zEwbdpaB2JME8fhxPxBsF9`, READY. Build logs identify that exact commit and show the compiled-export check passed before deployment.
- [GitHub CI](https://github.com/yonigrin7234/family-bench/actions/runs/33989179651) passed 200 tests, TypeScript, all 27 exported routes and the compiled-export check. The same checks passed locally.
- Supabase: **Family Bench `aeeovmnhfxobeqpczjvt`**, organization `epelsraplgfepkesvsdt`. The existing foundation migration remains `20260905032608`; this release required no additional schema changes.

## Changes and evidence

The shared header now has an initials button opening Dashboard, Account & settings, verified email status and guarded Sign out. Mobile production rendering and both navigation actions were checked. Real sign-out returned to the sign-in screen and hid the workspace. Rendered interaction tests cover failed sign-out, busy saves and account changes.

Home's case switch, next-step capture and dismissal actions were exercised on production. Timeline row navigation is covered by rendered tests at 800, 1280 and 1439 pixels; at 1440 pixels selection targets a visible inspector. New-password validation now matches Supabase's 72 UTF-8 byte limit; existing-password sign-in is not constrained by that rule.

Cache clearing retains the current account's browser writer lock and invalidates unfinished preparation before deletion begins. Failed refreshes remain visibly blocked and retryable. Nine cache-reset tests cover these boundaries. On production, clearing a synthetic account's local cache recovered its case and entry from cloud without the earlier lock failure. This was the same browser, not a second device.

The actual production export previously failed with `Cannot destructure property '__extends' of 'n.default'`. A narrow Metro resolver change selects the installed `pdf-lib` dependency's proper `tslib` ESM entry. The [compiled-output check](../scripts/verify-built-web-exports.mjs) reproduced the original failure and now exercises timeline PDF, exact-byte evidence ZIP, changed-original rejection, factual report PDF and editable MC-031 generation. Both GitHub CI and Vercel run it through `npm run build:web`.

After clearing the synthetic cache, the production ZIP downloaded successfully. Its 199-byte original matched the uploaded file byte-for-byte and SHA-256 `df52f63ddb5ba05db3689618eb352eb87dee8525ddad83e9122743d06f438fdf`; the manifest matched. The bundled and standalone PDFs each contained one page with the expected factual text. Text extraction excluded the test private-note canary from both PDFs and the ZIP's text/JSON files, and the rendered PDF page was visually checked. The browser's download-event observer timed out, but the actual timestamped files in Downloads were independently inspected; UI success text alone was not treated as proof.

## Managed accounts, configuration and cleanup

Two disposable confirmed accounts were created through the Supabase dashboard's no-email form. The first signed in, created a case, child, people, entry and original through the app; exact database rows were checked. The second signed into an empty workspace, and a direct link to the first account's entry showed “Entry not found.” Both signed out through the new menu. This is bounded UI isolation evidence, not the complete API harness.

The correct project's Auth Site URL was changed from `http://localhost:3000` to `https://family-bench.vercel.app`; the previously empty allowlist now contains exact redirect `https://family-bench.vercel.app/auth`. Both were saved and verified after reloading the dashboard. No test emails were sent.

The exact synthetic original was removed through Storage, then the two exact Auth accounts were deleted through the dashboard. Storage's resulting empty-folder placeholder was also removed. Read-only verification found zero fixture rows across 30 Auth/database scopes and zero fixture Storage objects. No unrelated account was selected for deletion. The recovery manifest is retained locally without passwords or tokens.

## Still open

Confirmation/reset email delivery and completed email callbacks await an authorized mailbox. The full two-owner admin API harness, second-device recovery, native media/sharing/PKCE, broader failure and conflict scenarios, and remaining dependency findings remain open. Account deletion for arbitrary populated accounts is not established by minimal synthetic fixture cleanup.

This release does not complete automatic case-number lookup/docket tracking, OCR/AI, provider integrations, collaboration, e-filing/service, billing or the complete product specification. See [requirements coverage](requirements-coverage.md) and the [case lookup plan](case-lookup-docket-plan.md).
