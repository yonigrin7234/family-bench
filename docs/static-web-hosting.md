# Static web routing

Family Bench exports static HTML with Expo Router. Entry IDs belong to private accounts and are created at runtime, so their individual URLs cannot be enumerated during the build. Expo documents that [dynamic routes need explicit handling with static output](https://docs.expo.dev/router/web/static-rendering/).

`vercel.json` enables `cleanUrls` for routes such as `/auth` and `/timeline`, which are exported as `.html` files. Its single `/entry/:id` rewrite serves `/` as the authenticated client shell. Vercel rewrites retain the browser's incoming URL, allowing Expo Router to read the entry ID. Existing files take precedence; there is no global catch-all. See [Vercel's rewrite documentation](https://vercel.com/docs/routing/rewrites) and [clean URL configuration](https://vercel.com/docs/project-configuration/vercel-json#cleanurls).

| Request | Expected hosting result |
| --- | --- |
| `/entry/<id>` or `/entry/<id>?from=timeline` | Serve the app shell; client routing handles the entry |
| `/auth`, `/timeline` | Serve the corresponding exported HTML |
| `/_expo/...js`, `/assets/...` | Serve the existing static file |
| `/entry/<id>/extra`, missing assets, unknown routes | Remain unmatched; do not return the app shell |

The rewrite does not grant access to records. The app's verified-session gate and account-scoped data access still apply. A signed-out visitor may be routed to sign-in and need to reopen the entry link after authentication; restoring protected destinations through sign-in is a separate navigation enhancement.

The hosting configuration uses `npm ci` for the committed dependency lockfile. It also declares no-referrer, MIME-sniffing prevention and frame-embedding prevention headers using Vercel's [header configuration](https://vercel.com/docs/project-configuration/vercel-json#headers). These three headers and HSTS were verified on the inspected production responses at [family-bench.vercel.app](https://family-bench.vercel.app) on September 5, 2026.

Production deployment `dpl_BJH8Dg7cbYWujwH8mpPFgTJneTRY` is READY at main commit `0aad43a971607872971c60fbe6754d3e98f39e96`. The existing Vercel project `family-bench` (`prj_wRnUDdQp47diLU5Z90nRZXnkJTDi`) belongs to team `team_i2eDC4FmQkpJq7mCVwUMEJXp` and uses Git production branch `main`. Seventeen public HTTP checks verified clean `/auth` and `/forms` paths, the direct-entry rewrite with a query, missing/nested path failures, referenced scripts/CSS and representative assets. Both hosted official form templates matched source hashes. The compiled Supabase hostname is `aeeovmnhfxobeqpczjvt.supabase.co`.

The production browser rendered sign-in and redirected signed-out Forms and direct-entry navigation to `/auth`. The public alias presented no Vercel authentication challenge; other aliases and preview protection were not inspected. Later, a confirmed synthetic managed account signed in, saved records/original metadata and restored records after clearing the same browser's cache. The correct Supabase project's Site URL `https://family-bench.vercel.app` and exact `/auth` redirect were saved and reload-verified in the dashboard. A second-account empty-workspace/direct-entry UI isolation check subsequently passed. Email confirmation/reset delivery and second-device/native recovery remain separate checks in [live verification](live-verification.md).

The earlier production export failed on `__extends` despite a successful static build. Application release `2893d3e` fixed the resolver issue and passed actual production PDF/ZIP downloads and byte checks. The [release record](account-release-verification-2026-09-05.md) supersedes the earlier deployment checkpoint above. `npm run build:web` now runs [emitted-runtime PDF/ZIP verification](../scripts/verify-built-web-exports.mjs), including on Vercel, so static compilation alone cannot pass this regression.
