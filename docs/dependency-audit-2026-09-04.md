# Dependency audit — September 4, 2026

The npm audit is **not clean**. Compatible updates reduced the reported dependency findings from 38 (2 critical, 16 high, 18 moderate, 2 low) to **26 (0 critical, 8 high, 18 moderate)**. These totals include dependent packages affected by the three vulnerable transitive packages below; they are not 26 distinct advisories. This check does not establish overall production security.

Rechecked September 5, 2026 with `npm audit --json`: totals remain 26 (0 critical, 8 high, 18 moderate).

## Changes applied

Updated installed versions within their existing dependency ranges for `@babel/core`, `@xmldom/xmldom`, `brace-expansion`, `browserslist`, `js-yaml`, `nanoid`, `postcss-selector-parser`, `shell-quote`, `tar`, `undici`, and `ws`. In particular, the installed shell-quote and tar branches no longer have the critical findings reported by the initial audit.

Added a narrow `postcss: 8.5.28` override because Expo Metro pins the vulnerable 8.4 branch. This preserves PostCSS's major API and Node engine requirements; a PostCSS 8.5.28 + Tailwind 3 utility transformation passed. The full production export must also remain part of release validation.

Framework versions remain **Expo 54.0.33, Expo Router 6.0.23, React/React DOM 19.1.0, and React Native 0.81.5**. No forced major upgrade or router downgrade was applied. `esbuild` 0.28.2 is now a direct development dependency for the actual-store integration test harness; it was already the version installed through `tsx`.

## Remaining findings

| Installed package | Advisory and reachable dependency context | Required follow-up |
| --- | --- | --- |
| `decode-uri-component` 0.2.2 — moderate | [Malformed percent-encoded input can cause excessive decoding work](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr). Used by `query-string` 7, which Expo Router and React Navigation consume when parsing links. This is a runtime dependency. | Adopt a supported router/navigation dependency update or a separately reviewed compatible parser change. npm's proposed router downgrade to 5.1.11 was not applied. |
| `image-size` 1.2.1 — high | [ICNS parser infinite loop](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr) and [JXL/HEIF parser infinite loops](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq). Used by Metro's build-time asset processing. User evidence storage does not invoke this package. | Upgrade the compatible Expo/Metro toolchain once patched support is available, or assess a targeted parser migration. npm currently proposes Expo 57.0.20; a major upgrade needs its own verification. |
| `uuid` 7.0.3 — moderate | [Missing output-buffer bounds checks in v3/v5/v6](https://github.com/advisories/GHSA-w5hq-g745-h8pq). Pulled in by `xcode` for native project tooling; its installed implementation uses `v4` for project IDs. No vulnerable v3/v5/v6 call was found in that consumer. | Track the upstream xcode/Expo dependency update. Do not globally replace uuid 7 with a different major without checking its consumers. |

The exposure descriptions are based on the installed dependency graph and local source inspection, not a penetration test or proof that every path is unreachable.

## Reproduction

Run `npm ci`, then `npm audit --json`, `npm run typecheck`, `npm test`, and `npm run build:web`. The security update was applied with package lifecycle scripts disabled. Audit advisories can change after this date, so use a fresh audit for the release decision.

Verified an isolated clean `npm ci --ignore-scripts` from the updated lockfile, followed by the package's unmodified `npm test` script: **51 tests passed**. The root workspace TypeScript check also passed. No environment files or credentials were copied into the verification directory.

The store integration tests isolate platform and I/O ports while executing the actual workspace store. They exercise rejected persistence, duplicate-free draft retries, account-session races, concurrent edits during sync, cloud hydration with pending work, and preservation of both conflict copies. They supplement, rather than replace, authenticated browser/device and backend isolation tests.
