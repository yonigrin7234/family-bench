The deployed migration is `20260905032608_authenticated_case_foundation`. Database verification and full application-service verification are separate.

`tests/db/live-rollback-verification.sql` passed against both disposable local PostgreSQL fixtures, including the inspected legacy schema. It inserts three synthetic Auth rows and one Storage metadata row inside a transaction, exercises the deployed RPC and ownership rules under database roles, and rolls everything back. It does not sign in through Auth, send email, or upload file bytes. The connected SQL tool rejected its first temporary function with `25006: cannot execute CREATE FUNCTION in a read-only transaction`; no live fixture rows were inserted. Do not override the tool's read-only transaction or apply this test as a migration.

For a future authorized full service test, `scripts/verify-live.ts` requires both `FB_VERIFY_PUBLISHABLE_KEY` and `FB_VERIFY_ADMIN_KEY` through a trusted process environment. The admin key must be a server secret or legacy service-role key; the test clients must use a distinct publishable or anon-role key. The script is restricted to project `aeeovmnhfxobeqpczjvt` and has no reduced-privilege live mode.

```sh
node --import tsx scripts/verify-live.ts --run --output /private/tmp/family-bench-live-check
```

The script uses [Auth Admin `createUser`](https://supabase.com/docs/reference/javascript/auth-admin-createuser) with generated UUIDs, strong random passwords, `.invalid` fixture addresses, `email_confirm: true`, and a protected `app_metadata` run marker. It uses no invitations or signup-email flow. Passwords and tokens stay in memory and are never logged or saved. A private manifest records only generated identities, attempted row IDs, object paths, check labels, and status.

The checks cover password sign-in and server user verification; cross-account and anonymous isolation; RPC replay, conflicting writes, and original-capture history; private workspace state; exact original bytes and SHA-256 through private Storage; rejected overwrites/deletes and revoked access; and exclusion of private content from the shared timeline projection.

Cleanup first verifies each account's exact identity and protected run marker, revokes sessions, removes only generated object paths through the [Storage API](https://supabase.com/docs/guides/storage/management/delete-objects), removes the fixture records in dependency order, then deletes the synthetic Auth users. It verifies object listings, Auth absence, exact attempted records, revision/version/workspace rows, and profile absence before reporting cleanup success. Deleting `storage.objects` through SQL is never a cleanup substitute because it can orphan stored bytes. Auth deletion can fail on unexpected deployed foreign keys or triggers; any failure is reported as incomplete cleanup in the manifest. Keep that manifest for operator recovery and do not infer cleanup success from a failed run.

This full API harness has been typechecked and its project/key/identity guards have unit tests. It has not run against the live project because no admin cleanup key was available. Real password-login, Storage byte roundtrip, and native-device verification remain outstanding.
