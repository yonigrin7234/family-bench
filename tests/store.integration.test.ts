import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { emptyCaseSnapshot } from '../lib/case-intelligence/ownership';
import { SYNC_TABLES, type SyncChange, type SyncRow, type SyncVersion } from '../lib/case-intelligence/syncModel';
import type { CaseIntelligenceSnapshot, Entry, FamilyBenchCase, LocalRecordMeta } from '../lib/case-intelligence/types';
import type { PersistedCaseIntelligenceDocument } from '../lib/case-intelligence/persistence';
import type * as StoreModule from '../lib/case-intelligence/useCaseIntelligence';
import { extractWorkspaceContext, inspectWorkspaceContext } from '../lib/case-intelligence/contextIntegrity';
import type { Session } from '@supabase/supabase-js';

// Exercise the real store, merge code, record metadata and normalization. Only
// platform/authentication and durable/network I/O ports are substituted. Every
// harness loads a fresh bundle so subscriptions and module epochs cannot leak.
const directory = mkdtempSync(join(tmpdir(), 'family-bench-store-tests-'));
after(() => rmSync(directory, { recursive: true, force: true }));
const root = resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const owner = '11111111-1111-4111-8111-111111111111';
const caseId = '22222222-2222-4222-8222-222222222222';
const entryId = '33333333-3333-4333-8333-333333333333';
const now = '2026-09-04T12:00:00.000Z';
const session = { user: { id: owner, email_confirmed_at: now } } as Session;
type Cloud = { snapshot: CaseIntelligenceSnapshot; rows: Record<string, SyncRow>; versions: SyncVersion[]; workspace: unknown };
type ReadResult = { document: PersistedCaseIntelligenceDocument | null; adapter: 'memory'; warning: null };
type WriteInput = Omit<PersistedCaseIntelligenceDocument, 'version' | 'savedAt'>;
type AuthState = { session: Session | null; recovery: boolean };
type Ports = {
  auth: { getState(): AuthState; subscribe(listener: (state: AuthState) => void): () => void; setState(patch: Partial<AuthState>): void };
  read(ownerId: string): Promise<ReadResult>;
  write(input: WriteInput): Promise<{ adapter: 'memory'; savedAt: string }>;
  fetch(ownerId: string): Promise<Cloud>;
  send(ownerId: string, changes: SyncChange[]): Promise<SyncVersion[]>;
};
const globals = globalThis as typeof globalThis & { __familyBenchStoreTestPorts?: Ports };
let bundle: Promise<string> | undefined;
function storeBundle() {
  return bundle ??= build({
    absWorkingDir: root, entryPoints: ['lib/case-intelligence/useCaseIntelligence.ts'],
    bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
    plugins: [{ name: 'store-test-ports', setup(builder) {
      const modules: Record<string, string> = {
        'react-native': `export const Platform = { OS: 'ios' }; export const AppState = { addEventListener: () => ({ remove() {} }) };`,
        'expo-crypto': `import { randomUUID, createHash } from 'node:crypto'; export { randomUUID }; export const CryptoDigestAlgorithm = { SHA256: 'sha256' }; export async function digestStringAsync(algorithm, value) { return createHash(algorithm).update(value).digest('hex'); }`,
        'expo-file-system': `export const documentDirectory = null;`,
        'expo-file-system/legacy': `export const documentDirectory = null;`,
        '@/lib/auth/session': `const ports = globalThis.__familyBenchStoreTestPorts; export const useAuthStore = ports.auth; export const hasVerifiedSession = (session) => Boolean(session?.user.email_confirmed_at); export function getWorkspaceOwnerId() { const state = ports.auth.getState(); if (!hasVerifiedSession(state.session) || state.recovery) throw new Error('Sign in first'); return state.session.user.id; }`,
        '@/lib/supabase/client': `export const isSupabaseConfigured = true;`,
        '@/lib/security/localEncryption': `export function sealLocalBytes() { throw new Error('Unexpected direct encryption I/O'); } export const openLocalBytes = sealLocalBytes;`,
        '@/lib/evidence': `export async function uploadEvidenceOriginal(attachment) { return attachment; } export async function clearLocalEvidence() {} export async function cleanupEvidenceSource() {} export function preserveEvidenceOriginal() { throw new Error('Evidence capture is outside this store test'); }`,
        './cloud': `const ports = globalThis.__familyBenchStoreTestPorts; export const fetchCloudWorkspace = (...args) => ports.fetch(...args); export const sendCloudChanges = (...args) => ports.send(...args);`,
        './persistence': `export * from ${JSON.stringify(join(root, 'lib/case-intelligence/persistence.ts'))}; const ports = globalThis.__familyBenchStoreTestPorts; export const readPersistedCaseIntelligence = (...args) => ports.read(...args); export const writePersistedCaseIntelligence = (...args) => ports.write(...args); export const getLocalPersistenceAdapter = () => 'memory'; export async function clearPersistedCaseIntelligence() { throw new Error('Unexpected clear'); }`,
      };
      builder.onResolve({ filter: /.*/ }, (args) => Object.hasOwn(modules, args.path) ? { path: args.path, namespace: 'test-ports' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'test-ports' }, (args) => ({ contents: modules[args.path], loader: 'js', resolveDir: root }));
    } }],
  }).then((result) => result.outputFiles![0].text);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
function meta(table: string, id: string, pending = true): LocalRecordMeta {
  return { table, id, local_created_at: now, local_updated_at: now, mutation_id: `${id}-mutation`, server_version: 0, sync_status: pending ? 'pending' : 'synced' };
}
function caseSnapshot(): CaseIntelligenceSnapshot {
  const snapshot = emptyCaseSnapshot();
  snapshot.cases = [{ id: caseId, user_id: owner, title: 'Synthetic case', is_active: true, created_at: now, updated_at: now, deleted_at: null } as FamilyBenchCase];
  return snapshot;
}
function cloudValue(snapshot = caseSnapshot(), versions: SyncVersion[] = []): Cloud {
  const rows: Record<string, SyncRow> = {};
  for (const [table, collection] of SYNC_TABLES) for (const row of snapshot[collection]) rows[`${table}:${row.id}`] = row;
  return { snapshot: structuredClone(snapshot), rows, versions, workspace: null };
}
function documentFor(snapshot: CaseIntelligenceSnapshot): PersistedCaseIntelligenceDocument {
  return { version: 2, ownerId: owner, savedAt: now, snapshot, localRecords: {}, reportPreviewState: { reportType: 'timeline', typeFilter: 'all', flagFilter: 'all' }, savedReportVersions: [], advisorState: { threadId: 'local', pinnedThreadId: 'local', messages: [], updatedAt: null }, filingBuilderState: { selectedPackageId: null, packageStates: {}, updatedAt: null }, patternReviewState: { acknowledgedPatternIds: [], dismissedPatternIds: [], updatedAt: null }, conflictHistory: [] };
}
const draft = { id: entryId, entryType: 'pickup_dropoff' as const, eventDate: '2026-09-04', body: 'Original fact', isFlagged: false };
let moduleNumber = 0;
async function harness() {
  const listeners = new Set<(state: AuthState) => void>();
  let authState: AuthState = { session, recovery: false };
  const writes: WriteInput[] = [];
  const ports: Ports = {
    auth: { getState: () => authState, subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); }, setState: (patch) => { authState = { ...authState, ...patch }; listeners.forEach((listener) => listener(authState)); } },
    read: async () => ({ document: null, adapter: 'memory', warning: null }),
    write: async (input) => { writes.push(structuredClone(input)); return { adapter: 'memory', savedAt: now }; },
    fetch: async () => cloudValue(),
    send: async (_owner, changes) => changes.map((change) => ({ table_name: change.table_name, record_id: change.row.id, mutation_id: change.mutation_id, version: change.expected_version + 1 })),
  };
  globals.__familyBenchStoreTestPorts = ports;
  const path = join(directory, `store-${moduleNumber++}.cjs`);
  writeFileSync(path, await storeBundle());
  const loaded = require(path) as typeof StoreModule;
  delete globals.__familyBenchStoreTestPorts;
  const store = loaded.useCaseIntelligenceStore;
  const sync = store.getState().sync;
  // Disable the automatic scheduler so each network interleaving is deliberate.
  store.setState({ ownerId: owner, hasLoaded: true, hasHydrated: true, snapshot: caseSnapshot(), localRecords: { [`cases:${caseId}`]: meta('cases', caseId, false) }, sync: async () => {} });
  return { ports, writes, store, sync, initialize: loaded.initializeCaseWorkspace };
}

test('store rejects failed durable saves and an identical draft retries without duplicate entries', async () => {
  const h = await harness();
  const write = h.ports.write;
  h.ports.write = async () => { throw new Error('Storage quota reached'); };
  await assert.rejects(h.store.getState().createEntry(draft), /Storage quota reached/);
  assert.equal(h.store.getState().snapshot.entries.length, 1);
  assert.match(h.store.getState().persistence.error!, /Storage quota/);
  assert.equal(h.store.getState().saving, 0);
  h.ports.write = write;
  const saved = await h.store.getState().createEntry(draft);
  assert.equal(saved.entry.id, entryId);
  assert.equal(h.store.getState().snapshot.entries.length, 1);
  assert.equal(h.writes.at(-1)!.snapshot.entries.length, 1);
  assert.equal(h.store.getState().persistence.error, null);
  await assert.rejects(h.store.getState().createEntry({ ...draft, body: 'Different draft under the same id' }), /already has an entry/);
});

test('logout and re-login with the same owner cannot apply an earlier asynchronous load', async () => {
  const h = await harness();
  const oldRead = deferred<ReadResult>();
  let readCount = 0;
  h.ports.read = async () => ++readCount === 1 ? oldRead.promise : { document: documentFor(caseSnapshot()), adapter: 'memory', warning: null };
  const stop = h.initialize();
  try {
    await flush();
    assert.equal(readCount, 1);
    h.ports.auth.setState({ session: null });
    assert.equal(h.store.getState().snapshot.cases.length, 0);
    h.ports.auth.setState({ session });
    await flush();
    assert.equal(readCount, 2);
    const stale = caseSnapshot();
    stale.cases[0].title = 'Old session must never replace current workspace';
    oldRead.resolve({ document: documentFor(stale), adapter: 'memory', warning: null });
    await flush();
    assert.equal(h.store.getState().snapshot.cases[0].title, 'Synthetic case');
    assert.equal(h.writes.some((write) => write.snapshot.cases[0]?.title === stale.cases[0].title), false);
  } finally { stop(); }
});

test('an edit during an in-flight sync remains pending after the earlier receipt and cloud read', async () => {
  const h = await harness();
  await h.store.getState().createEntry(draft);
  const firstEntry = structuredClone(h.store.getState().snapshot.entries[0]);
  const started = deferred<SyncChange>();
  const finish = deferred<SyncVersion[]>();
  const regularSend = h.ports.send;
  h.ports.send = async (owner, changes) => {
    if (changes[0].table_name !== 'entries') return regularSend(owner, changes);
    started.resolve(changes[0]); return finish.promise;
  };
  const syncing = h.sync();
  const change = await started.promise;
  await h.store.getState().updateEntryReview(entryId, { body: 'Newer local fact' });
  const newerMutation = h.store.getState().localRecords[`entries:${entryId}`].mutation_id;
  assert.notEqual(newerMutation, change.mutation_id);
  const version = { table_name: 'entries', record_id: entryId, mutation_id: change.mutation_id, version: 1 };
  const cloud = caseSnapshot(); cloud.entries = [firstEntry];
  h.ports.fetch = async () => cloudValue(cloud, [version]);
  finish.resolve([version]);
  await syncing;
  const state = h.store.getState();
  assert.equal(state.snapshot.entries[0].body, 'Newer local fact');
  assert.equal(state.localRecords[`entries:${entryId}`].mutation_id, newerMutation);
  assert.equal(state.localRecords[`entries:${entryId}`].sync_status, 'pending');
  assert.equal(state.localRecords[`entries:${entryId}`].server_version, 1);
  assert.equal(h.writes.at(-1)!.snapshot.entries[0].body, 'Newer local fact');
});

test('cloud hydration preserves both a pending edit and a local record absent from cloud', async () => {
  const h = await harness();
  await h.store.getState().createEntry(draft);
  const extraId = '44444444-4444-4444-8444-444444444444';
  await h.store.getState().createEntry({ ...draft, id: extraId, body: 'Only on this device' });
  const remote = caseSnapshot();
  remote.entries = [{ ...h.store.getState().snapshot.entries.find((row) => row.id === entryId)!, body: 'Other device text' }];
  h.ports.fetch = async () => cloudValue(remote, [{ table_name: 'entries', record_id: entryId, mutation_id: 'other-device', version: 2 }]);
  await h.store.getState().load();
  assert.equal(h.store.getState().snapshot.entries.length, 2);
  assert.equal(h.store.getState().snapshot.entries.find((row) => row.id === entryId)!.body, 'Original fact');
  assert.equal(h.store.getState().snapshot.entries.find((row) => row.id === extraId)!.body, 'Only on this device');
  assert.equal(h.store.getState().localRecords[`entries:${entryId}`].server_version, 0);
});

for (const keepLocal of [false, true]) test(`conflict resolution durably archives both copies when choosing ${keepLocal ? 'device' : 'cloud'}`, async () => {
  const h = await harness();
  await h.store.getState().createEntry(draft);
  const local = structuredClone(h.store.getState().snapshot.entries[0]);
  const remote: Entry = { ...local, body: 'Conflicting cloud fact' };
  const key = `entries:${entryId}`;
  h.store.setState({ conflicts: [{ key, table: 'entries', local, remote, version: 3 }] });
  await h.store.getState().resolveConflict(key, keepLocal);
  const state = h.store.getState();
  assert.equal(state.conflicts.length, 0);
  assert.equal(state.snapshot.entries[0].body, keepLocal ? local.body : remote.body);
  assert.equal(state.conflictHistory.length, 1);
  assert.equal(state.conflictHistory[0].local.body, 'Original fact');
  assert.equal(state.conflictHistory[0].remote!.body, 'Conflicting cloud fact');
  assert.equal(state.conflictHistory[0].choice, keepLocal ? 'device' : 'cloud');
  assert.equal(h.writes.at(-1)!.conflictHistory[0].local.body, 'Original fact');
  assert.equal(h.writes.at(-1)!.conflictHistory[0].remote!.body, 'Conflicting cloud fact');
  assert.equal(state.localRecords[key].server_version, 3);
  assert.equal(state.localRecords[key].sync_status, keepLocal ? 'pending' : 'synced');
});

const secondCaseId = '44444444-4444-4444-8444-444444444444';
const secondChildId = '55555555-5555-4555-8555-555555555555';
const secondSetup = { id: secondCaseId, mode: 'create' as const, caseName: 'Second family case', courtName: 'Synthetic court', county: 'Synthetic county', userRole: 'respondent' as const, otherParentName: 'Second parent', childName: 'Second child', children: [{ id: secondChildId, name: 'Second child', dateOfBirth: '2018-03-04' }], nextHearingDate: '2026-12-11' };

test('creating a second case preserves first-case records and scopes subsequent captures and edits', async () => {
  const h = await harness();
  await h.store.getState().createEntry(draft);
  const firstEntry = structuredClone(h.store.getState().snapshot.entries[0]);
  const firstCase = structuredClone(h.store.getState().snapshot.cases[0]);
  await h.store.getState().saveCaseSetup(secondSetup);
  assert.equal(h.store.getState().snapshot.cases.length, 2);
  assert.deepEqual(h.store.getState().snapshot.cases.find((row) => row.id === caseId), firstCase);
  assert.deepEqual(h.store.getState().snapshot.entries[0], firstEntry);
  assert.equal(h.store.getState().snapshot.selectedCaseId, secondCaseId);
  const second = await h.store.getState().createEntry({ ...draft, id: '66666666-6666-4666-8666-666666666666', childId: secondChildId });
  assert.equal(second.entry.case_id, secondCaseId);
  assert.equal(second.entry.child_id, secondChildId);
  await assert.rejects(h.store.getState().updateEntryReview(entryId, { body: 'Wrong case' }), /selected case/);
  await assert.rejects(h.store.getState().createEntry(draft), /already has an entry/);
  await h.store.getState().saveCaseSetup({ ...secondSetup, mode: 'edit', caseName: 'Renamed second case' });
  assert.equal(h.store.getState().snapshot.children.filter((row) => row.case_id === secondCaseId).length, 1);
  assert.equal(h.store.getState().snapshot.people.filter((row) => row.case_id === secondCaseId).length, 2);
  assert.equal(h.store.getState().snapshot.keyDates.filter((row) => row.case_id === secondCaseId && !row.deleted_at).length, 1);
  await h.store.getState().switchCase(caseId);
  await assert.rejects(h.store.getState().createEntry({ ...draft, id: '77777777-7777-4777-8777-777777777777', childId: secondChildId }), /child from the selected case/);
  const caseWide = await h.store.getState().createEntry({ ...draft, id: '88888888-8888-4888-8888-888888888888', childId: null });
  assert.equal(caseWide.entry.child_id, null);
});

test('case selection and creation publish only after durable success and retain retry identity on failure', async () => {
  const h = await harness();
  const write = h.ports.write;
  h.ports.write = async () => { throw new Error('Disk full'); };
  await assert.rejects(h.store.getState().saveCaseSetup(secondSetup), /Disk full/);
  assert.equal(h.store.getState().snapshot.cases.length, 1);
  assert.equal(h.store.getState().switchingCase, false);
  h.ports.write = write;
  await h.store.getState().saveCaseSetup(secondSetup);
  const pending = deferred<{ adapter: 'memory'; savedAt: string }>();
  h.ports.write = async () => pending.promise;
  const switching = h.store.getState().switchCase(caseId);
  assert.equal(h.store.getState().snapshot.selectedCaseId, secondCaseId);
  assert.equal(h.store.getState().switchingCase, true);
  await assert.rejects(h.store.getState().createEntry(draft), /workspace is not ready/);
  pending.reject(new Error('Interrupted write'));
  await assert.rejects(switching, /Interrupted write/);
  assert.equal(h.store.getState().snapshot.selectedCaseId, secondCaseId);
  h.ports.write = write;
  await h.store.getState().switchCase(caseId);
  assert.equal(h.store.getState().snapshot.selectedCaseId, caseId);
  assert.equal(h.writes.at(-1)!.selectedCaseId, caseId);
  assert.equal(h.store.getState().snapshot.cases.filter((row) => row.id === secondCaseId).length, 1);
});

test('case-specific conversation and working selections restore after switching, persisted-document reload and cloud merge', async () => {
  const h = await harness();
  const firstAdvisor = { ...h.store.getState().advisorState, threadId: 'case-one-thread', messages: [{ id: 'm1', role: 'user' as const, body: 'First case private draft', createdAt: now, linkedEntryIds: [], localOnly: true }] };
  h.store.setState({ advisorState: firstAdvisor, reportPreviewState: { reportType: 'medical', flagFilter: 'flagged', typeFilter: 'all' } });
  await h.store.getState().saveCaseSetup(secondSetup);
  assert.deepEqual(h.store.getState().advisorState.messages, []);
  assert.equal(h.store.getState().reportPreviewState.reportType, 'timeline');
  const secondAdvisor = { ...h.store.getState().advisorState, threadId: 'case-two-thread', messages: [{ id: 'm2', role: 'user' as const, body: 'Second case private draft', createdAt: now, linkedEntryIds: [], localOnly: true }] };
  h.store.setState({ advisorState: secondAdvisor });
  await h.store.getState().switchCase(caseId);
  assert.deepEqual(h.store.getState().advisorState, firstAdvisor);
  assert.equal(h.store.getState().reportPreviewState.reportType, 'medical');
  const persisted = { ...h.writes.at(-1)!, version: 2 as const, savedAt: now };
  const reload = await harness();
  reload.ports.read = async () => ({ document: persisted, adapter: 'memory', warning: null });
  reload.ports.fetch = async () => { throw new Error('Offline'); };
  await reload.store.getState().load();
  assert.equal(reload.store.getState().snapshot.selectedCaseId, caseId);
  assert.deepEqual(reload.store.getState().advisorState, firstAdvisor);
  await reload.store.getState().switchCase(secondCaseId);
  assert.deepEqual(reload.store.getState().advisorState, secondAdvisor);
  const cloud = cloudValue(reload.store.getState().snapshot);
  cloud.workspace = extractWorkspaceContext(reload.writes.at(-1)! as unknown as Record<string, unknown>);
  const fromCloud = await harness();
  fromCloud.ports.fetch = async () => cloud;
  await fromCloud.store.getState().load();
  assert.equal(fromCloud.store.getState().snapshot.selectedCaseId, secondCaseId);
  assert.deepEqual(fromCloud.store.getState().advisorState, secondAdvisor);
  assert.equal(fromCloud.store.getState().contextError, null);
});

test('cross-case order, provision, filing and report links are rejected before a write', async () => {
  const h = await harness();
  await h.store.getState().createEntry(draft);
  const order = await h.store.getState().createCourtOrder({ title: 'First order' });
  const filing = await h.store.getState().createFilingPackage({ title: 'First filing', filingType: 'other' });
  await h.store.getState().saveCaseSetup(secondSetup);
  const count = h.writes.length;
  await assert.rejects(h.store.getState().updateCourtOrder(order.id, { title: 'Wrong case' }), /selected case/);
  await assert.rejects(h.store.getState().createCourtOrderProvision({ courtOrderId: order.id, category: 'other', status: 'active', label: 'Invalid', body: 'Wrong case' }), /selected case/);
  await assert.rejects(h.store.getState().toggleFilingPackageEntry(filing.filingPackage.id, entryId), /selected case/);
  await assert.rejects(h.store.getState().saveReportVersion({ reportType: 'timeline', title: 'Invalid report', includedEntryIds: [entryId], filters: { typeFilter: 'all', flagFilter: 'all', childFilter: null, dateRangeLabel: 'All dates' } }), /selected case/);
  await assert.rejects(h.store.getState().switchCase('99999999-9999-4999-8999-999999999999'), /not available/);
  assert.equal(h.writes.length, count);
});

test('setup preserves existing children and safely updates only the setup hearing', async () => {
  const h = await harness();
  await h.store.getState().saveCaseSetup(secondSetup);
  const otherHearing = await h.store.getState().createKeyDate({ category: 'hearing', title: 'Separate hearing', eventDate: '2027-02-01', notes: 'Entered in the calendar' });
  const siblingId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  await h.store.getState().saveCaseSetup({ ...secondSetup, mode: 'edit', children: [...secondSetup.children, { id: siblingId, name: 'Sibling', dateOfBirth: '2020-07-08' }], nextHearingDate: null });
  assert.equal(h.store.getState().snapshot.children.filter((row) => row.case_id === secondCaseId).length, 2);
  assert.equal(h.store.getState().snapshot.keyDates.find((row) => row.id === otherHearing.id)?.event_date, '2027-02-01');
  const removedSetupDate = h.store.getState().snapshot.keyDates.find((row) => row.description === 'Recorded during case setup.');
  assert.ok(removedSetupDate?.deleted_at);
  assert.ok(h.store.getState().localRecords[`key_dates:${removedSetupDate!.id}`]);
  await h.store.getState().switchCase(caseId);
  await assert.rejects(h.store.getState().saveCaseSetup({ ...secondSetup, id: caseId, mode: 'edit' }), /cannot be moved between cases/);
});

test('initial content hashes bind validated structured fields, child scope and custody intervals', async () => {
  const h = await harness();
  await h.store.getState().saveCaseSetup(secondSetup);
  const input = { ...draft, entryType: 'expense' as const, childId: secondChildId, custodyPeriod: 'my_time' as const, typedDetails: { version: 1 as const, kind: 'expense' as const, amountCents: 2450, currency: 'USD' as const, category: 'school', paidBy: 'me' as const, reimbursementRequestedCents: 1200, reimbursementReceivedCents: 0 } };
  const saved = await h.store.getState().createEntry(input);
  assert.equal(saved.entry.custody_period, 'my_time');
  assert.deepEqual((saved.entry.metadata as Record<string, unknown>).typed_capture, input.typedDetails);
  await assert.rejects(h.store.getState().createEntry({ ...input, typedDetails: { ...input.typedDetails, amountCents: 2600 } }), /already has an entry/);
  await assert.rejects(h.store.getState().createEntry({ ...input, childId: null }), /already has an entry/);
  const interval = { version: 1 as const, startAt: '2026-09-04T12:00:00Z', endAt: '2026-09-04T16:00:00Z', caregiver: 'me' as const, basis: 'actual' as const };
  const time = await h.store.getState().createEntry({ ...draft, id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', entryType: 'other', childId: null, custodyInterval: interval });
  assert.deepEqual((time.entry.metadata as Record<string, unknown>).custody_interval, { ...interval, startAt: '2026-09-04T12:00:00.000Z', endAt: '2026-09-04T16:00:00.000Z' });
  await assert.rejects(h.store.getState().createEntry({ ...draft, id: time.entry.id, entryType: 'other', childId: null, custodyInterval: { ...interval, caregiver: 'other_parent' } }), /already has an entry/);
});

test('signing out during case-selection persistence cannot publish a prior account context', async () => {
  const h = await harness();
  h.ports.read = async () => ({ document: documentFor(caseSnapshot()), adapter: 'memory', warning: null });
  const stop = h.initialize();
  try {
    await flush(); await flush();
    await h.store.getState().saveCaseSetup(secondSetup);
    const pending = deferred<{ adapter: 'memory'; savedAt: string }>();
    h.ports.write = async () => pending.promise;
    const switching = h.store.getState().switchCase(caseId);
    h.ports.auth.setState({ session: null });
    pending.resolve({ adapter: 'memory', savedAt: now });
    await assert.rejects(switching, /Account changed/);
    assert.equal(h.store.getState().ownerId, null);
    assert.equal(h.store.getState().snapshot.cases.length, 0);
    assert.deepEqual(h.store.getState().caseWorkspaceStates, {});
  } finally { stop(); }
});

test('invalid local case links are quarantined before display, persist across reload and never enter cloud workspace writes', async () => {
  const h = await harness();
  await h.store.getState().createEntry(draft);
  await h.store.getState().saveCaseSetup(secondSetup);
  const persisted = { ...h.writes.at(-1)!, version: 2 as const, savedAt: now };
  persisted.advisorState = { threadId: 'local', pinnedThreadId: null, updatedAt: now, messages: [{ id: 'bad-link', role: 'user', body: 'Keep this original privately', linkedEntryIds: [entryId], createdAt: now, localOnly: true }] };
  const reload = await harness();
  reload.ports.read = async () => ({ document: persisted, adapter: 'memory', warning: null });
  reload.ports.fetch = async () => { throw new Error('Offline'); };
  await reload.store.getState().load();
  assert.ok(reload.store.getState().contextError);
  assert.deepEqual(reload.store.getState().advisorState.messages, []);
  assert.equal(reload.store.getState().snapshot.entries.length, 1);
  assert.equal(reload.store.getState().contextRecovery.length, 1);
  assert.match(JSON.stringify(reload.writes.at(-1)!.contextRecovery), /Keep this original privately/);
  assert.equal(reload.writes.at(-1)!.contextRecovery![0].ownerId, owner);
  await reload.store.getState().createEntry({ ...draft, id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', childId: secondChildId });
  assert.equal(reload.store.getState().snapshot.entries.length, 2);
  const submissions: SyncChange[] = [];
  reload.ports.send = async (_owner, changes) => { submissions.push(...changes); return changes.map((change) => ({ table_name: change.table_name, record_id: change.row.id, version: change.expected_version + 1, mutation_id: change.mutation_id })); };
  await reload.sync();
  assert.ok(submissions.some((change) => change.table_name === 'entries'));
  assert.ok(!submissions.some((change) => change.table_name === 'case_workspace_state'));
  assert.ok(!JSON.stringify(submissions).includes('Keep this original privately'));
  const reloadAgain = await harness();
  reloadAgain.ports.read = async () => ({ document: { ...reload.writes.at(-1)!, version: 2, savedAt: now }, adapter: 'memory', warning: null });
  reloadAgain.ports.fetch = async () => { throw new Error('Offline'); };
  await reloadAgain.store.getState().load();
  assert.equal(reloadAgain.store.getState().contextRecovery.length, 1);
  assert.ok(reloadAgain.store.getState().contextError);
});

test('unsupported context metadata is preserved without displaying raw fields, and reset waits for durable preservation', async () => {
  const h = await harness();
  const cloud = cloudValue();
  cloud.workspace = { ...extractWorkspaceContext(documentFor(cloud.snapshot) as unknown as Record<string, unknown>), futureContext: { opaque: 'UNRECOGNIZED_PRIVATE_SOURCE' } };
  h.ports.fetch = async () => cloud;
  await h.store.getState().load();
  assert.ok(h.store.getState().contextError);
  assert.ok(!h.store.getState().contextError!.includes('UNRECOGNIZED_PRIVATE_SOURCE'));
  assert.ok(!h.store.getState().contextError!.includes('futureContext'));
  assert.match(JSON.stringify(h.store.getState().contextRecovery[0].raw), /UNRECOGNIZED_PRIVATE_SOURCE/);
  const write = h.ports.write;
  h.ports.write = async () => { throw new Error('Disk full'); };
  await assert.rejects(h.store.getState().resetAffectedViewSelections(), /Disk full/);
  assert.ok(h.store.getState().contextError);
  assert.equal(h.store.getState().contextRecovery[0].resolvedAt, null);
  h.ports.write = write;
  await h.store.getState().resetAffectedViewSelections();
  assert.equal(h.store.getState().contextError, null);
  assert.ok(h.store.getState().contextRecovery[0].resolvedAt);
  assert.match(JSON.stringify(h.writes.at(-1)!.contextRecovery), /UNRECOGNIZED_PRIVATE_SOURCE/);
  assert.equal(inspectWorkspaceContext(extractWorkspaceContext(h.writes.at(-1)! as unknown as Record<string, unknown>), h.store.getState().snapshot, owner).length, 0);
});

test('a malformed inactive case context cannot be exposed by switching and valid selections remain preserved', async () => {
  const h = await harness();
  await h.store.getState().createEntry(draft);
  await h.store.getState().saveCaseSetup(secondSetup);
  await h.store.getState().switchCase(caseId);
  const context = h.store.getState().caseWorkspaceStates[secondCaseId];
  h.store.setState({ caseWorkspaceStates: { ...h.store.getState().caseWorkspaceStates, [secondCaseId]: { ...context, advisorState: { ...context.advisorState, messages: [{ id: 'bad', role: 'user', body: 'Wrong-case note', linkedEntryIds: [entryId], createdAt: now, localOnly: true }] } } } });
  await assert.rejects(h.store.getState().switchCase(secondCaseId), /context needs review/);
  assert.equal(h.store.getState().snapshot.selectedCaseId, caseId);
  assert.deepEqual(h.store.getState().advisorState.messages, []);
  assert.equal(h.store.getState().contextRecovery.length, 1);
  await h.store.getState().switchCase(secondCaseId);
  assert.equal(h.store.getState().snapshot.selectedCaseId, secondCaseId);
  assert.deepEqual(h.store.getState().advisorState.messages, []);
  assert.match(JSON.stringify(h.store.getState().contextRecovery), /Wrong-case note/);
});

test('incomplete form drafts are durable, case-scoped and included in validated working context', async () => {
  const h = await harness();
  await h.store.getState().createEntry(draft);
  const id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const saved = await h.store.getState().saveCourtFormDraft({ id, caseId, formId: 'mc031', values: { declaration: 'Initial facts', unsupported: 'ignored' }, sourceEntryIds: [entryId] });
  assert.equal(saved.userId, owner);
  assert.deepEqual(saved.values, { declaration: 'Initial facts' });
  assert.equal(h.writes.at(-1)!.courtFormDrafts!.length, 1);
  const edited = await h.store.getState().saveCourtFormDraft({ id, caseId, formId: 'mc031', values: { declaration: 'Revised draft' }, sourceEntryIds: [] });
  assert.equal(edited.createdAt, saved.createdAt);
  assert.equal(h.store.getState().courtFormDrafts.length, 1);
  await h.store.getState().saveCaseSetup(secondSetup);
  await assert.rejects(h.store.getState().saveCourtFormDraft({ id, caseId: secondCaseId, formId: 'mc031', values: {}, sourceEntryIds: [] }), /another case/);
  await assert.rejects(h.store.getState().saveCourtFormDraft({ id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', caseId: secondCaseId, formId: 'mc031', values: {}, sourceEntryIds: [entryId] }), /selected case/);
  assert.equal(h.store.getState().courtFormDrafts.length, 1);
});

test('CSV sources are private at the first durable save and import provenance is retained through review', async () => {
  const h = await harness();
  const sourceAttachmentId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
  const provenance = { version: 1 as const, kind: 'csv_source' as const, fileHash: 'a'.repeat(64), scopeKey: 'b'.repeat(64), sourceEntryId: entryId, sourceAttachmentId, rowIndex: null, rowHash: null };
  await assert.rejects(h.store.getState().createEntry({ ...draft, importProvenance: provenance }), /must be private/);
  const saved = await h.store.getState().createEntry({ ...draft, reviewVisibility: 'private', importProvenance: provenance });
  const initial = h.writes.at(-1)!.snapshot.entries.find((row) => row.id === entryId)!;
  assert.equal((initial.metadata as Record<string, unknown>).review_visibility, 'private');
  assert.deepEqual((initial.metadata as Record<string, unknown>).import_provenance, provenance);
  await h.store.getState().updateEntryReview(entryId, { body: 'Reviewed private source label' });
  assert.deepEqual((h.store.getState().snapshot.entries[0].metadata as Record<string, unknown>).import_provenance, provenance);
  await assert.rejects(h.store.getState().updateEntryReview(entryId, { reviewVisibility: 'court_ready' }), /remain private/);
  await assert.rejects(h.store.getState().createEntry({ ...draft, reviewVisibility: 'private', importProvenance: { ...provenance, fileHash: 'c'.repeat(64) } }), /already has an entry/);
  assert.equal(saved.entry.id, entryId);
});

test('filing creation and toggles publish only after durable success and retry without duplicate or reversed links', async () => {
  const h = await harness();
  const write = h.ports.write;
  const id = '88888888-8888-4888-8888-888888888888';
  const input = { id, title: 'Reviewed package', filingType: 'request_for_order', dueDate: '2026-10-01' };
  h.ports.write = async () => { throw new Error('Device storage full'); };
  await assert.rejects(h.store.getState().createFilingPackage(input), /storage full/);
  assert.equal(h.store.getState().snapshot.filingPackages.length, 0);
  h.ports.write = write;
  const saved = await h.store.getState().createFilingPackage(input);
  assert.equal(saved.filingPackage.id, id);
  await h.store.getState().createFilingPackage(input);
  assert.equal(h.store.getState().snapshot.filingPackages.length, 1);
  await assert.rejects(h.store.getState().createFilingPackage({ ...input, title: 'Different draft' }), /different package/);
  await h.store.getState().createEntry(draft);
  h.ports.write = async () => { throw new Error('Device storage full'); };
  await assert.rejects(h.store.getState().toggleFilingPackageEntry(id, entryId), /storage full/);
  assert.deepEqual(h.store.getState().filingBuilderState.packageStates[id].linkedEntryIds, []);
  await assert.rejects(h.store.getState().updateFilingPackageStatus(id, 'ready_for_review'), /storage full/);
  assert.equal(h.store.getState().snapshot.filingPackages[0].status, 'draft');
  h.ports.write = write;
  const pending = deferred<{ adapter: 'memory'; savedAt: string }>();
  h.ports.write = async () => pending.promise;
  const saving = h.store.getState().toggleFilingPackageEntry(id, entryId);
  assert.deepEqual(h.store.getState().filingBuilderState.packageStates[id].linkedEntryIds, []);
  pending.resolve({ adapter: 'memory', savedAt: now }); await saving;
  assert.deepEqual(h.store.getState().filingBuilderState.packageStates[id].linkedEntryIds, [entryId]);
  assert.equal(h.store.getState().saving, 0);
  h.ports.write = write;
  await h.store.getState().toggleFilingPackageChecklist(id, 'service');
  assert.equal(h.store.getState().snapshot.filingPackages[0].status, 'draft', 'A preparation checkbox never marks filed or served');
  assert.equal(h.store.getState().snapshot.filingPackages[0].completion_percent, 25);
});

test('filing links reject private sources and invalid report/status fields before persistence', async () => {
  const h = await harness();
  const { filingPackage } = await h.store.getState().createFilingPackage({ title: 'Case package', filingType: 'other' });
  await h.store.getState().createEntry({ ...draft, reviewVisibility: 'private' });
  const before = h.writes.length;
  await assert.rejects(h.store.getState().toggleFilingPackageEntry(filingPackage.id, entryId), /Private entries/);
  await assert.rejects(h.store.getState().updateFilingPackageStatus(filingPackage.id, 'filed' as never), /valid preparation/);
  await assert.rejects(h.store.getState().toggleFilingPackageReport(filingPackage.id, 'unsupported' as never), /supported report/);
  assert.equal(h.writes.length, before);
  await h.store.getState().updateEntryReview(entryId, { reviewVisibility: 'court_ready' });
  await h.store.getState().toggleFilingPackageEntry(filingPackage.id, entryId);
  await h.store.getState().updateEntryReview(entryId, { reviewVisibility: 'private' });
  await h.store.getState().toggleFilingPackageEntry(filingPackage.id, entryId);
  assert.deepEqual(h.store.getState().filingBuilderState.packageStates[filingPackage.id].linkedEntryIds, [], 'A linked entry that became private can be removed');
});

test('signing out during a filing save cannot publish the prior account package', async () => {
  const h = await harness();
  h.ports.read = async () => ({ document: documentFor(caseSnapshot()), adapter: 'memory', warning: null });
  const stop = h.initialize();
  try {
    await flush(); await flush();
    const pending = deferred<{ adapter: 'memory'; savedAt: string }>();
    h.ports.write = async () => pending.promise;
    const saving = h.store.getState().createFilingPackage({ title: 'Do not publish after signout', filingType: 'other' });
    h.ports.auth.setState({ session: null });
    pending.resolve({ adapter: 'memory', savedAt: now });
    await assert.rejects(saving, /account changed/);
    assert.equal(h.store.getState().ownerId, null);
    assert.deepEqual(h.store.getState().snapshot.filingPackages, []);
    assert.deepEqual(h.store.getState().filingBuilderState.packageStates, {});
  } finally { stop(); }
});

test('CSV rows require the same owned source, verified attachment metadata, file hash and child scope before saving', async () => {
  const h = await harness();
  const sourceAttachmentId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
  const rowId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const childId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const sourceProvenance = { version: 1 as const, kind: 'csv_source' as const, fileHash: 'a'.repeat(64), scopeKey: 'b'.repeat(64), sourceEntryId: entryId, sourceAttachmentId, rowIndex: null, rowHash: null };
  const provenance = { ...sourceProvenance, kind: 'csv_row' as const, rowIndex: 1, rowHash: 'c'.repeat(64) };
  const row = { ...draft, id: rowId, childId: null, reviewVisibility: 'private' as const, importProvenance: provenance };
  await assert.rejects(h.store.getState().createEntry(row), /Preserve the original CSV/);
  await h.store.getState().createEntry({ ...draft, childId: null, reviewVisibility: 'private', importProvenance: sourceProvenance });
  await assert.rejects(h.store.getState().createEntry(row), /Preserve the original CSV/);
  const snapshot = h.store.getState().snapshot;
  const attachment = { id: sourceAttachmentId, user_id: owner, case_id: caseId, entry_id: entryId, file_hash: sourceProvenance.fileHash, deleted_at: null } as CaseIntelligenceSnapshot['evidenceAttachments'][number];
  h.store.setState({ snapshot: { ...snapshot, evidenceAttachments: [attachment], children: [{ id: childId, user_id: owner, case_id: caseId, name: 'Another child', deleted_at: null } as CaseIntelligenceSnapshot['children'][number]] } });
  const goodSnapshot = h.store.getState().snapshot;
  const before = h.writes.length;
  await assert.rejects(h.store.getState().createEntry({ ...row, importProvenance: { ...provenance, scopeKey: 'd'.repeat(64) } }), /does not match/);
  await assert.rejects(h.store.getState().createEntry({ ...row, importProvenance: { ...provenance, fileHash: 'd'.repeat(64) } }), /Preserve the original CSV/);
  await assert.rejects(h.store.getState().createEntry({ ...row, childId }), /does not match/);
  for (const invalid of [{ user_id: '99999999-9999-4999-8999-999999999999' }, { case_id: secondCaseId }, { file_hash: 'e'.repeat(64) }, { entry_id: rowId }]) {
    h.store.setState({ snapshot: { ...goodSnapshot, evidenceAttachments: [{ ...attachment, ...invalid }] } });
    await assert.rejects(h.store.getState().createEntry(row), /Preserve the original CSV/);
  }
  h.store.setState({ snapshot: { ...goodSnapshot, entries: goodSnapshot.entries.map((entry) => ({ ...entry, user_id: '99999999-9999-4999-8999-999999999999' })) } });
  await assert.rejects(h.store.getState().createEntry(row), /Preserve the original CSV/);
  assert.equal(h.writes.length, before, 'Rejected provenance must not reach durable writes');
  h.store.setState({ snapshot: goodSnapshot });
  const saved = await h.store.getState().createEntry(row);
  assert.equal(saved.entry.child_id, null);
  assert.equal((saved.entry.metadata as Record<string, unknown>).review_visibility, 'private');
  assert.deepEqual((saved.entry.metadata as Record<string, unknown>).import_provenance, provenance);
  await h.store.getState().createEntry(row);
  assert.equal(h.store.getState().snapshot.entries.filter((entry) => entry.id === rowId).length, 1);
});
