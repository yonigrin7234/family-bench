import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createSharedTimeline } from '../lib/export/model';
import type { Entry, EvidenceAttachment } from '../lib/case-intelligence/types';

export const VERIFY_PROJECT_REF = 'aeeovmnhfxobeqpczjvt';
const URL_BASE = `https://${VERIFY_PROJECT_REF}.supabase.co`;
const BUCKET = 'evidence-originals';
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
type FixtureUser = { id: string; email: string; password: string };
export type FixtureCredentials = { projectRef: string; runId: string; users: [FixtureUser, FixtureUser] };
type Row = Record<string, unknown> & { id: string; user_id: string };
type Change = { table_name: string; row: Row; expected_version: number; mutation_id: string };
type ApiResult = { data: any; error: { code?: string; status?: number; message?: string } | null };
type Manifest = { projectRef: string; runId: string; users: Array<Omit<FixtureUser, 'password'>>; records: Array<{ table: string; id: string; userId: string }>; storagePaths: string[]; status: string; checks: string[] };

export function assertVerifyProject(url: string): void {
  if (url !== URL_BASE) throw new Error('Verification is restricted to the approved Family Bench project.');
}

export function validateVerificationKeys(publishableKey: string, adminKey: string): void {
  function jwtRole(key: string): string | undefined {
    try { return JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8')).role; } catch { return undefined; }
  }
  if (!(publishableKey.startsWith('sb_publishable_') || jwtRole(publishableKey) === 'anon') || publishableKey.startsWith('sb_secret_')) {
    throw new Error('Ownership tests require a publishable key or an anon-role legacy key.');
  }
  if (!(adminKey.startsWith('sb_secret_') || jwtRole(adminKey) === 'service_role') || adminKey === publishableKey) {
    throw new Error('Every live run requires a separate server admin cleanup key.');
  }
}

export function validateFixtures(value: unknown): FixtureCredentials {
  const data = value as FixtureCredentials;
  if (!data || data.projectRef !== VERIFY_PROJECT_REF || !UUID.test(data.runId) || !Array.isArray(data.users) || data.users.length !== 2) throw new Error('Invalid synthetic fixture credentials.');
  for (const [index, user] of data.users.entries()) {
    if (!UUID.test(user.id) || user.email !== `fb-verify-${data.runId}-${index}@example.invalid` || typeof user.password !== 'string' || user.password.length < 24) throw new Error('Only generated synthetic fixture accounts can be used.');
  }
  if (data.users[0].id === data.users[1].id) throw new Error('Verification needs two distinct fixture accounts.');
  return data;
}

function writePrivate(path: string, value: string): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, value, { mode: 0o600 });
  chmodSync(path, 0o600);
}


function client(key: string): SupabaseClient {
  return createClient(URL_BASE, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(30000) }) } });
}
function check(value: unknown, label: string): asserts value { if (!value) throw new Error(label); }
function ok(result: ApiResult, label: string): any {
  if (result.error) throw new Error(`${label} failed [${result.error.code ?? result.error.status ?? 'API_ERROR'}]`);
  return result.data;
}
function denied(result: ApiResult, label: string, code?: string): void {
  check(result.error && (!code || result.error.message?.includes(code)), label);
}

export async function runLiveVerification(options: { publishableKey: string; adminKey: string; outputDirectory: string }): Promise<void> {
  validateVerificationKeys(options.publishableKey, options.adminKey);
  const runId = randomUUID();
  const fixtures = validateFixtures({ projectRef: VERIFY_PROJECT_REF, runId, users: [0, 1].map((i) => ({ id: randomUUID(), email: `fb-verify-${runId}-${i}@example.invalid`, password: `${randomBytes(32).toString('base64url')}aA1!` })) });
  const clients = fixtures.users.map(() => client(options.publishableKey));
  const anonymous = client(options.publishableKey);
  const admin = client(options.adminKey);
  const manifest: Manifest = { projectRef: VERIFY_PROJECT_REF, runId: fixtures.runId, users: fixtures.users.map(({ id, email }) => ({ id, email })), records: [], storagePaths: [], status: 'started', checks: [] };
  const manifestPath = resolve(options.outputDirectory, 'manifest.json');
  const saveManifest = () => writePrivate(manifestPath, JSON.stringify(manifest, null, 2));
  saveManifest();
  const passed = (label: string) => { manifest.checks.push(label); saveManifest(); process.stdout.write(`PASS ${label}\n`); };
  const change = (table_name: string, row: Row, expected_version = 0): Change => ({ table_name, row, expected_version, mutation_id: randomUUID() });
  const sync = async (c: SupabaseClient, changes: Change[]) => {
    for (const change of changes) {
      if (!manifest.records.some((record) => record.table === change.table_name && record.id === change.row.id && record.userId === change.row.user_id)) {
        manifest.records.push({ table: change.table_name, id: change.row.id, userId: change.row.user_id });
      }
    }
    saveManifest();
    return c.rpc('sync_case_records', { changes });
  };
  const read = async (c: SupabaseClient) => ok(await c.rpc('read_case_workspace'), 'Read owned workspace');
  const [ownerA, ownerB] = fixtures.users.map((u) => u.id);
  const caseA = randomUUID(), caseA2 = randomUUID(), caseB = randomUUID(), entryA = randomUUID(), privateEntry = randomUUID(), attachmentA = randomUUID();
  const originalText = 'Synthetic observed event for live verification.';
  const privateNote = `PRIVATE-NOTE-${fixtures.runId}`;
  const privateBody = `PRIVATE-ENTRY-${fixtures.runId}`;
  const bytes = new Uint8Array([0, 255, 13, 10, ...Buffer.from(`Synthetic evidence ${fixtures.runId}`)]);
  const hash = createHash('sha256').update(bytes).digest('hex');
  let primaryError: unknown;
  try {
    const bucket = ok(await admin.storage.getBucket(BUCKET), 'Admin cleanup access preflight');
    check(bucket.public === false && bucket.file_size_limit === 26214400, 'Original bucket must be private and limited to 25 MiB');
    for (const [i, fixture] of fixtures.users.entries()) {
      const created = ok(await admin.auth.admin.createUser({
        id: fixture.id, email: fixture.email, password: fixture.password, email_confirm: true,
        app_metadata: { family_bench_verification_run: fixtures.runId },
      }), 'Create generated synthetic fixture');
      check(created.user?.id === fixture.id, 'Admin API did not confirm the requested fixture identity');
      const signed = ok(await clients[i].auth.signInWithPassword({ email: fixture.email, password: fixture.password }), 'Synthetic password sign-in');
      check(signed.user?.id === fixture.id && signed.user?.email_confirmed_at && signed.user?.app_metadata?.family_bench_verification_run === fixtures.runId, 'Signed-in fixture identity or marker mismatch');
      const verified = ok(await clients[i].auth.getUser(), 'Server-verified Auth user');
      check(verified.user?.id === fixture.id, 'Auth getUser ownership mismatch');
      const fresh = await read(clients[i]);
      check(Object.values(fresh.snapshot).every((rows: any) => Array.isArray(rows) && rows.length === 0) && fresh.versions.length === 0 && fresh.workspace === null, 'Fixtures must have an empty case workspace before a run');
    }
    passed('two confirmed fixture accounts sign in and server-verify');
    denied(await anonymous.rpc('read_case_workspace'), 'Anonymous workspace RPC must be denied');
    denied(await anonymous.rpc('sync_case_records', { changes: [] }), 'Anonymous write RPC must be denied');
    denied(await anonymous.from('cases').select('id'), 'Anonymous table access must be denied');
    passed('anonymous table and RPC access denied');
    const initial = [
      change('cases', { id: caseA, user_id: ownerA, title: 'Synthetic case A' }),
      change('cases', { id: caseA2, user_id: ownerA, title: 'Synthetic second case A' }),
      change('entries', { id: entryA, user_id: ownerA, case_id: caseA, entry_type: 'journal', event_date: '2026-09-05', body: originalText, private_notes: privateNote, content_hash: createHash('sha256').update(originalText).digest('hex') }),
      change('entries', { id: privateEntry, user_id: ownerA, case_id: caseA, entry_type: 'journal', event_date: '2026-09-05', body: privateBody, metadata: { review_visibility: 'private' } }),
      change('case_workspace_state', { id: ownerA, user_id: ownerA, state: { verification_private_context: privateNote } }),
    ];
    const receipts = ok(await sync(clients[0], initial), 'Owned initial batch');
    check(receipts.length === initial.length && receipts.every((r: any) => r.version === 1), 'Initial version receipts must be one per record');
    ok(await sync(clients[1], [change('cases', { id: caseB, user_id: ownerB, title: 'Synthetic case B' })]), 'Second owner case');
    let workspace = await read(clients[0]);
    check(workspace.snapshot.entries.find((r: any) => r.id === entryA)?.private_notes === privateNote && workspace.workspace.state.verification_private_context === privateNote, 'Owner private fields must round trip');
    const other = await read(clients[1]);
    check(other.snapshot.cases.length === 1 && other.snapshot.cases[0].id === caseB && other.snapshot.entries.length === 0 && !JSON.stringify(other).includes(privateNote), 'Second owner workspace must exclude first owner records and private fields');
    for (const table of ['entries', 'entry_revisions', 'case_sync_versions']) {
      const rows = ok(await clients[1].from(table).select('*').eq('user_id', ownerA), 'Foreign filtered read');
      check(rows.length === 0, 'Foreign rows must remain invisible');
    }
    passed('owned case/private state round trips and second-account reads are isolated');
    const replay = ok(await sync(clients[0], [initial[2]]), 'Identical mutation replay');
    check(replay[0].version === 1 && replay[0].mutation_id === initial[2].mutation_id, 'Replay must return the original receipt');
    denied(await sync(clients[0], [{ ...initial[2], row: { ...initial[2].row, body: 'Changed replay' } }]), 'Changed replay must be rejected', 'MUTATION_ID_REUSED');
    const edit = change('entries', { id: entryA, user_id: ownerA, case_id: caseA, body: 'Synthetic reviewed observation.' }, 1);
    ok(await sync(clients[0], [edit]), 'Versioned entry edit');
    denied(await sync(clients[0], [change('entries', { id: entryA, user_id: ownerA, body: 'Stale update' }, 1)]), 'Stale CAS must reject', 'SYNC_CONFLICT');
    ok(await sync(clients[0], [initial[2]]), 'Old replay after later edit');
    workspace = await read(clients[0]);
    check(workspace.snapshot.entries.find((r: any) => r.id === entryA)?.body === 'Synthetic reviewed observation.', 'Old replay must not roll back a newer edit');
    const revisions = ok(await clients[0].from('entry_revisions').select('version,previous_snapshot,snapshot,previous_revision_hash,revision_hash').eq('entry_id', entryA).order('version'), 'Revision readback');
    check(revisions.length === 2 && revisions[1].previous_snapshot.body === originalText && revisions[1].snapshot.private_notes === privateNote && revisions[1].previous_revision_hash === revisions[0].revision_hash, 'Server revisions must preserve history and chain');
    passed('idempotent replay, changed-replay rejection, CAS, and immutable capture history');
    const racing = await Promise.all(['A', 'B'].map((label) => sync(clients[0], [change('entries', { id: entryA, user_id: ownerA, body: `Synthetic concurrent ${label}` }, 2)])));
    check(racing.filter((r) => !r.error).length === 1 && racing.filter((r) => r.error?.message.includes('SYNC_CONFLICT')).length === 1, 'Concurrent CAS must have exactly one successful writer');
    passed('concurrent writers produce one receipt and one conflict');
    denied(await sync(clients[1], [change('entries', { id: entryA, user_id: ownerB, case_id: caseA, body: 'Foreign write' }, 3)]), 'Cross-owner mutation must reject');
    denied(await sync(clients[0], [change('entries', { id: entryA, user_id: ownerA, case_id: caseA2 }, 3)]), 'Case reassignment must reject');
    denied(await sync(clients[0], [change('entries', { id: entryA, user_id: ownerA, metadata: { captured_body: 'Altered original' } }, 3)]), 'Original captured text mutation must reject', 'ORIGINAL_CAPTURE_IMMUTABLE');
    denied(await clients[0].from('entries').update({ body: 'Direct bypass' }).eq('id', entryA), 'Direct writes must reject');
    const rollbackCase = randomUUID();
    denied(await sync(clients[0], [change('cases', { id: rollbackCase, user_id: ownerA, title: 'Must roll back' }), change('entries', { id: randomUUID(), user_id: ownerA, case_id: rollbackCase, unknown_field: true })]), 'Invalid batch must reject');
    check(ok(await clients[0].from('cases').select('id').eq('id', rollbackCase), 'Rollback readback').length === 0, 'Failed batch must leave no partial case');
    passed('cross-owner, case reassignment, original tampering, direct writes, and partial batches rejected');
    {
      const path = `${ownerA}/${caseA}/${entryA}/${attachmentA}/original`;
      const wrongPath = `${ownerA}/${caseA2}/${entryA}/${randomUUID()}/original`;
      const foreignPath = `${ownerA}/${caseA}/${entryA}/${randomUUID()}/original`;
      manifest.storagePaths.push(path, wrongPath, foreignPath); saveManifest();
      ok(await clients[0].storage.from(BUCKET).upload(path, bytes, { contentType: 'application/octet-stream', upsert: false }), 'Original byte upload');
      const downloaded = ok(await clients[0].storage.from(BUCKET).download(path), 'Authenticated original download') as Blob;
      const downloadedBytes = new Uint8Array(await downloaded.arrayBuffer());
      check(createHash('sha256').update(downloadedBytes).digest('hex') === hash && Buffer.from(downloadedBytes).equals(Buffer.from(bytes)), 'Stored original must match exact source bytes and SHA-256');
      denied(await clients[1].storage.from(BUCKET).download(path), 'Cross-owner original download must reject');
      denied(await clients[1].storage.from(BUCKET).upload(foreignPath, bytes), 'Cross-owner upload must reject');
      denied(await clients[0].storage.from(BUCKET).upload(wrongPath, bytes), 'Cross-case upload path must reject');
      denied(await clients[0].storage.from(BUCKET).upload(path, new Uint8Array([9]), { upsert: true }), 'Original replacement must reject');
      await clients[0].storage.from(BUCKET).remove([path]); // RLS may return [] instead of an error.
      const afterDelete = ok(await clients[0].storage.from(BUCKET).download(path), 'Original remains after denied owner delete') as Blob;
      check(createHash('sha256').update(new Uint8Array(await afterDelete.arrayBuffer())).digest('hex') === hash, 'Owner delete must preserve original');
      const publicResponse = await fetch(`${URL_BASE}/storage/v1/object/public/${BUCKET}/${path}`, { signal: AbortSignal.timeout(30000) });
      check(!publicResponse.ok, 'Private originals must have no public download');
      ok(await sync(clients[0], [change('attachments', { id: attachmentA, user_id: ownerA, case_id: caseA, entry_id: entryA, file_name: 'synthetic-original.bin', file_type: 'document', mime_type: 'application/octet-stream', file_size_bytes: bytes.length, storage_bucket: BUCKET, storage_path: path, file_hash: hash, hash_algorithm: 'sha256' })]), 'Original metadata persistence');
      ok(await sync(clients[0], [change('entries', { id: entryA, user_id: ownerA, deleted_at: new Date().toISOString() }, 3)]), 'Soft-delete source entry');
      denied(await clients[0].storage.from(BUCKET).download(path), 'Deleted entry must revoke original access');
      ok(await sync(clients[0], [change('entries', { id: entryA, user_id: ownerA, deleted_at: null }, 4)]), 'Restore source entry');
      passed('real private Storage bytes, SHA-256, immutable object, ownership, and revocation checks');
    }
    workspace = await read(clients[0]);
    const selection = { caseId: caseA, caseTitle: 'Synthetic sharing test', entries: workspace.snapshot.entries as Entry[], attachments: workspace.snapshot.evidenceAttachments as EvidenceAttachment[], includedEntryIds: [entryA] };
    const shared = JSON.stringify(createSharedTimeline(selection));
    check(!shared.includes(privateNote) && !shared.includes(privateBody) && !shared.includes('private_notes') && !shared.includes('storage_path'), 'Shared output must exclude private notes, private entries, and internal storage metadata');
    let privateRejected = false;
    try { createSharedTimeline({ ...selection, includedEntryIds: [privateEntry] }); } catch { privateRejected = true; }
    check(privateRejected, 'Explicitly selected private entry must reject sharing');
    passed('shared projection from live rows excludes private content and rejects private selection');
    manifest.status = 'checks-passed';
  } catch (error) { primaryError = error; manifest.status = 'checks-failed'; }
  finally {
    for (const c of clients) await c.auth.signOut({ scope: 'global' }).catch(() => undefined);
    const cleanupErrors: string[] = [];
    for (const fixture of fixtures.users) {
      try {
        const lookup = await admin.auth.admin.getUserById(fixture.id);
        const alreadyAbsent = lookup.error?.status === 404 || lookup.error?.code === 'user_not_found';
        const ownedPaths = manifest.storagePaths.filter((value) => value.startsWith(`${fixture.id}/`));
        if (!alreadyAbsent) {
          const user = ok(lookup, 'Cleanup identity verification').user;
          check(user?.email === fixture.email && user?.app_metadata?.family_bench_verification_run === fixtures.runId, 'Cleanup identity marker mismatch');
          for (const path of ownedPaths) ok(await admin.storage.from(BUCKET).remove([path]), 'Remove generated Storage original');
          for (const table of ['attachments', 'entries', 'cases']) ok(await admin.from(table).delete().eq('user_id', fixture.id), 'Remove generated fixture records');
          ok(await admin.auth.admin.deleteUser(fixture.id), 'Delete generated fixture Auth user');
        }
        for (const path of ownedPaths) {
          const prefix = path.slice(0, path.lastIndexOf('/'));
          const listed = ok(await admin.storage.from(BUCKET).list(prefix, { limit: 100 }), 'Verify object removal');
          check(!listed.some((file: any) => file.name === 'original'), 'Generated Storage object still exists');
        }
        const removedUser = await admin.auth.admin.getUserById(fixture.id);
        check(removedUser.error?.status === 404 || removedUser.error?.code === 'user_not_found', 'Fixture Auth deletion was not confirmed');
        for (const table of ['cases', 'entries', 'attachments', 'case_workspace_state', 'case_sync_versions', 'entry_revisions']) {
          const rows = ok(await admin.from(table).select('user_id').eq('user_id', fixture.id).limit(1), 'Verify generated row removal');
          check(rows.length === 0, 'Generated fixture rows remain');
        }
        for (const record of manifest.records.filter((value) => value.userId === fixture.id)) {
          const rows = ok(await admin.from(record.table).select('id').eq('id', record.id).eq('user_id', fixture.id), 'Verify exact attempted fixture row removal');
          check(rows.length === 0, 'An exact attempted fixture row remains');
        }
        check(ok(await admin.from('profiles').select('id').eq('id', fixture.id), 'Verify generated profile removal').length === 0, 'Generated fixture profile remains');
      } catch { cleanupErrors.push(fixture.id); }
    }
    if (cleanupErrors.length) {
      manifest.status += '-cleanup-incomplete';
      primaryError ??= new Error('Synthetic fixture cleanup could not be verified; the private manifest identifies every fixture and attempted object path.');
    } else manifest.status += '-cleanup-verified';
    saveManifest();
  }
  if (primaryError) throw primaryError;
  process.stdout.write(`${manifest.checks.length} check groups passed. Auth, RPC, private Storage byte roundtrip, and fixture cleanup verified.\n`);
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.includes('--run')) {
    process.stdout.write('Future authorized live run: node --import tsx scripts/verify-live.ts --run --output /private/tmp/fb-live\nRequires FB_VERIFY_PUBLISHABLE_KEY and FB_VERIFY_ADMIN_KEY. Creates only generated, confirmed synthetic accounts through Auth Admin API; tests and verifies cleanup. Passwords/tokens are never saved or printed.\n');
    return;
  }
  check(!args.includes('--api-only') && !args.includes('--credentials'), 'Limited or external-fixture modes are not supported; use rollback SQL for database-only verification.');
  assertVerifyProject(process.env.FB_VERIFY_URL ?? URL_BASE);
  const outputIndex = args.indexOf('--output');
  const directory = resolve(outputIndex < 0 ? `/tmp/family-bench-live-${randomUUID()}` : args[outputIndex + 1]);
  await runLiveVerification({ publishableKey: process.env.FB_VERIFY_PUBLISHABLE_KEY ?? '', adminKey: process.env.FB_VERIFY_ADMIN_KEY ?? '', outputDirectory: directory });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch((error) => {
  process.stderr.write(`Verification stopped: ${error instanceof Error ? error.message : 'Unexpected failure'}. Inspect the private cleanup manifest before rerunning.\n`);
  process.exitCode = 1;
});
