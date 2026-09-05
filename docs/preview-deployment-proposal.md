# Family Bench preview deployment proposal

Prepared September 5, 2026. This is a reviewable proposal, not a deployment receipt.

- Source repository: `yonigrin7234/family-bench`.
- Verified implementation commit: `43eab2c9a5b662079b10116f6ccaadeaf8ce50cc` on `codex/production-foundation`.
- Target Vercel team: `yonigrinholz-gmailcoms-projects` (`team_i2eDC4FmQkpJq7mCVwUMEJXp`).
- Proposed dedicated project: `family-bench`. The connected team's project inventory currently has no Family Bench project; do not reuse an unrelated app. If the name is unavailable or another existing Family Bench project is found, verify its repository and team before selecting it.
- Deployment scope: preview only. Do not promote to production, assign a production/custom domain, merge the PR, or invite users to store real records as part of this step.
- Build: `npm ci`, then `npx expo export --platform web`; static output `dist`, routing and headers from committed `vercel.json`.
- Public build configuration: the URL and public anonymous key already configured locally for Supabase `aeeovmnhfxobeqpczjvt`, plus its expected project reference. No admin keys, account records, local design exports or synthetic fixture data.
- Backend: use the already deployed database foundation. No migration, ledger, schema, storage-policy or data changes are included in this preview deployment.

After deployment, verify the returned preview hostname, build/asset responses, signed-out route protection, redirect settings and deployment access controls. Preview access protection must be inspected rather than assumed. Managed authenticated account/storage and device checks remain necessary before a beta launch.

Automatic approval review rejected the earlier deploy action because its destination and preview/production scope were unspecified and the source was uncommitted. No deployment occurred. This proposal requires approval for the concrete project/team/preview scope before a new deployment attempt.
