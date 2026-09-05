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

The hosting configuration uses `npm ci` for the committed dependency lockfile. It also declares no-referrer, MIME-sniffing prevention and frame-embedding prevention headers using Vercel's [header configuration](https://vercel.com/docs/project-configuration/vercel-json#headers). Confirm the actual response headers on the approved preview deployment; local configuration inspection is not a CDN check.

Local checks verified the documented mapping against exported files, including preservation of existing JavaScript assets and unknown-route failures. This was a local routing simulation, not a Vercel CDN test. Before release, test a fresh deployed `/entry/<known-own-id>` URL and reload it while signed in, then test signed-out and other-account access. Rebuild the export before deploying any source change.
