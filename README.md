# Family Bench

A private case workspace for recording events, preserving original evidence, organizing case papers and preparing selected factual output. Built with Expo Router, React Native/Web, TypeScript and Supabase.

**Development status:** the connected workspace is live at [family-bench.vercel.app](https://family-bench.vercel.app). A confirmed synthetic account has exercised production sign-in, saved case records and an original, and restored records from cloud after clearing the same browser's cache. The account menu and export/cache fixes are deployed; real PDF/ZIP downloads, exact original bytes, private-note exclusion, sign-out and a second-account UI isolation check passed. See the [release verification](docs/account-release-verification-2026-09-05.md). The application is not yet a verified private beta. See [current status](docs/production-foundation-status.md), [requirements coverage](docs/requirements-coverage.md) and [canonical specification](docs/product-spec.md).

## Local development

Use Node.js 22 and the committed npm lockfile:

```sh
npm ci
cp .env.example .env.local
```

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in the ignored `.env.local` for the verified Family Bench project **`aeeovmnhfxobeqpczjvt`**. Public configuration belongs in the client; secret/admin keys never do. The environment validator rejects an unexpected managed project. See [project setup](docs/supabase-project-setup.md).

```sh
npm run web
```

Sign in with a verified account, then create a case. New accounts start with empty records. The app does not seed a fictional case into an authenticated account.

## Verification

```sh
npm run typecheck
npm test
npm run build:web
```

The GitHub workflow runs these checks on pull requests and pushes to `main`, `baseline-v2` or `codex/**`, using pinned [checkout](https://github.com/actions/checkout) and [setup-node](https://github.com/actions/setup-node) actions with read-only repository permissions. It does not deploy or receive live Supabase credentials.

Unit/integration tests use synthetic records and selected I/O substitutes. The separate [live verification record and procedure](docs/live-verification.md) distinguish observed production account/Storage checks from the unrun two-owner admin harness. Email confirmation/reset delivery, second-device recovery and native behavior remain untested. Do not use real family records as test fixtures.

## Data and output boundaries

- Local workspace records and original files are encrypted for the account on the device. The cloud service can access server records; this is not end-to-end encryption.
- Saves await durable local storage; the visible workspace status reports cloud synchronization and failures separately.
- Original evidence retains its bytes and SHA-256 fingerprint. A matching hash checks bytes, not the truth of an event or legal admissibility.
- Shared factual output excludes private notes and private entries. Complete CSV import sources stay private. Original evidence files can contain their own sensitive content and metadata.
- The private archive includes loaded records, working context and available originals. It is an unencrypted download, not a complete server-account backup or a supported restore format.
- Official form drafts are editable and unsigned. The guided fields do not determine which requests to make or establish complete filing requirements.

## Database and hosting

The composite migration `20260905032608_authenticated_case_foundation.sql` is already applied to the verified project. Do not reapply it, run the archived component inputs, or blindly reset/push the historical managed migration ledger. Read the [migration receipt and checks](docs/foundation-deployment-verification.md).

Expo exports static web files to `dist`. The existing Vercel project `family-bench` is connected to production branch `main`; application release `2893d3e` is deployed, with [200-test CI and live workflow verification](docs/account-release-verification-2026-09-05.md). Supabase `aeeovmnhfxobeqpczjvt` now has Site URL `https://family-bench.vercel.app` and exact redirect `https://family-bench.vercel.app/auth` saved and verified after dashboard reload. This configuration check does not test delivery or completion of confirmation/reset emails. [Static hosting notes](docs/static-web-hosting.md) explain private dynamic entry routes and the Vercel mapping.

The [shared-design comparison](docs/shared-design-comparison.md) records the newer 71-artboard reference and its differences from the local exports. A design screen is a requirement reference, not proof of a connected service.
