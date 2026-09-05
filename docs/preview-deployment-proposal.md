# Historical preview deployment proposal — superseded

The September 5 preview-only proposal was superseded after the implementation merged into `main` and the existing Family Bench project was verified. Its former missing-project finding and preview-only approval prerequisite are not current release instructions. The earlier unspecified deployment attempt was rejected by automatic approval review and produced no deployment at that stage.

- Source repository: `yonigrin7234/family-bench`.
- Merge receipt: `4e60140` into `main`.
- Deployed commit: `0aad43a971607872971c60fbe6754d3e98f39e96` on `main`.
- Target Vercel team: `yonigrinholz-gmailcoms-projects` (`team_i2eDC4FmQkpJq7mCVwUMEJXp`).
- Existing project: `family-bench` (`prj_wRnUDdQp47diLU5Z90nRZXnkJTDi`), with its Git production branch connected to `main`.
- Production deployment: `dpl_BJH8Dg7cbYWujwH8mpPFgTJneTRY`, READY, alias [family-bench.vercel.app](https://family-bench.vercel.app).
- Build: `npm ci`, then `npx expo export --platform web`; static output `dist`, routing and headers from committed `vercel.json`.
- Public build configuration: the URL and public anonymous key already configured locally for Supabase `aeeovmnhfxobeqpczjvt`, plus its expected project reference. No admin keys, account records, local design exports or synthetic fixture data.
- Backend: the already deployed database foundation in Supabase `aeeovmnhfxobeqpczjvt` remains the target; frontend delivery does not establish managed-service acceptance.

The clean-install [CI run](https://github.com/yonigrin7234/family-bench/actions/runs/33958089206) passed 176 tests, TypeScript and the 27-route web build. Public production HTTP and signed-out browser checks passed within the scope recorded in [current status](production-foundation-status.md) and [static hosting notes](static-web-hosting.md).

Later bounded production checks verified a confirmed synthetic account's password login, saved records/original metadata, original cloud verification and same-browser cloud restoration. The correct Supabase Site URL and exact `/auth` redirect were saved and reload-verified. Email confirmation/reset delivery, the complete two-owner admin harness, second-device recovery and native checks remain outstanding. The later `2893d3e` release fixed the observed export error and passed actual PDF/ZIP and account-menu checks; see its [release record](account-release-verification-2026-09-05.md). See [live verification](live-verification.md). The public alias was reachable without a Vercel challenge; no protection claim is made for other aliases or previews. This release does not mark the full product or private beta complete.
