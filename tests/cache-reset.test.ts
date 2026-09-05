import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import type { Session } from '@supabase/supabase-js';
import { emptyCaseSnapshot } from '../lib/case-intelligence/ownership';
import type { FamilyBenchCase } from '../lib/case-intelligence/types';
import type * as StoreModule from '../lib/case-intelligence/useCaseIntelligence';
import type * as LeaseModule from '../lib/case-intelligence/workspaceLease';
import type * as Persistence from '../lib/case-intelligence/persistence';
import type * as Cloud from '../lib/case-intelligence/cloud';

const owner = '11111111-1111-4111-8111-111111111111';
const otherOwner = '44444444-4444-4444-8444-444444444444';
const caseId = '22222222-2222-4222-8222-222222222222';
const now = '2026-09-05T12:00:00.000Z';
const sessionFor = (id: string) => ({ user: { id, email_confirmed_at: now } }) as Session;
type Auth = { session: Session | null; recovery: boolean };
type WriteInput = Parameters<typeof Persistence.writePersistedCaseIntelligence>[0];
type Ports = {
  auth: { getState(): Auth; subscribe(listener: (state: Auth) => void): () => void; setState(patch: Partial<Auth>): void };
  read: typeof Persistence.readPersistedCaseIntelligence;
  write: typeof Persistence.writePersistedCaseIntelligence;
  clear: () => Promise<void>;
  clearEvidence: () => Promise<void>;
  fetch: typeof Cloud.fetchCloudWorkspace;
  hash: (value: string) => Promise<string>;
};
const globals = globalThis as typeof globalThis & { __cacheResetPorts?: Ports };
const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, '..');
let bundle: Promise<string> | undefined;
function storeBundle() {
  return bundle ??= build({
    stdin: { contents: `export * from './lib/case-intelligence/useCaseIntelligence'; export * from './lib/case-intelligence/workspaceLease';`, resolveDir: root, loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
    plugins: [{ name: 'cache-reset-ports', setup(builder) {
      const sources: Record<string, string> = {
        'react-native': `export const Platform={OS:'web'}; export const AppState={addEventListener:()=>({remove(){}})};`,
        'expo-crypto': `import {randomUUID} from 'node:crypto'; export {randomUUID}; const p=globalThis.__cacheResetPorts; export const CryptoDigestAlgorithm={SHA256:'sha256'}; export const digestStringAsync=(_algorithm,value)=>p.hash(value);`,
        'expo-file-system': `export const documentDirectory=null;`,
        'expo-file-system/legacy': `export const documentDirectory=null;`,
        '@/lib/auth/session': `const p=globalThis.__cacheResetPorts; export const useAuthStore=p.auth; export const hasVerifiedSession=s=>Boolean(s?.user.email_confirmed_at); export function getWorkspaceOwnerId(){const s=p.auth.getState();if(!hasVerifiedSession(s.session)||s.recovery)throw new Error('Sign in first');return s.session.user.id;}`,
        '@/lib/supabase/client': `export const isSupabaseConfigured=true;`,
        '@/lib/utils/hash': `const p=globalThis.__cacheResetPorts; export const hashString=value=>p.hash(value);`,
        '@/lib/security/localEncryption': `export function sealLocalBytes(){throw new Error('Unexpected encryption I/O')} export const openLocalBytes=sealLocalBytes;`,
        '@/lib/evidence': `const p=globalThis.__cacheResetPorts; export const clearLocalEvidence=()=>p.clearEvidence(); export const uploadEvidenceOriginal=async a=>a; export async function cleanupEvidenceSource(){} export function preserveEvidenceOriginal(){throw new Error('Unexpected attachment I/O')}`,
        './cloud': `const p=globalThis.__cacheResetPorts; export const fetchCloudWorkspace=(owner)=>p.fetch(owner); export async function sendCloudChanges(){throw new Error('Unexpected automatic sync')}`,
        './persistence': `export * from './lib/case-intelligence/persistence'; import {captureWorkspaceLease} from './lib/case-intelligence/workspaceLease'; const p=globalThis.__cacheResetPorts; export const readPersistedCaseIntelligence=(owner)=>p.read(owner); export const getLocalPersistenceAdapter=()=>'memory'; export const clearPersistedCaseIntelligence=()=>p.clear(); export async function writePersistedCaseIntelligence(input){const assertCurrent=captureWorkspaceLease(input.ownerId); const saved=await p.write(input); assertCurrent(); return saved;}`,
      };
      builder.onResolve({ filter: /.*/ }, (args) => sources[args.path] ? { path: args.path, namespace: 'ports' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'ports' }, (args) => ({ contents: sources[args.path], loader: 'js', resolveDir: root }));
    } }],
  }).then(result => result.outputFiles[0].text);
}

function cloudValue(userId: string): Awaited<ReturnType<typeof Cloud.fetchCloudWorkspace>> {
  const snapshot = emptyCaseSnapshot();
  snapshot.cases = [{ id: caseId, user_id: userId, title: 'Restored synthetic case', is_active: true, created_at: now, updated_at: now, deleted_at: null } as FamilyBenchCase];
  return { snapshot, rows: { [`cases:${caseId}`]: snapshot.cases[0] }, versions: [], workspace: null };
}
const flush = () => new Promise<void>(done => setImmediate(done));
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

// Use the actual Zustand store and lease module. The lock manager deliberately
// holds a lock until its callback promise settles, reproducing the release /
// immediate-ifAvailable-request ordering without browser or live account I/O.
async function harness() {
  const savedGlobals = ['window', 'navigator'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  const held = new Set<string>();
  const requests: string[] = [];
  const events: string[] = [];
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { addEventListener() {}, removeEventListener() {} } });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: true, locks: {
    async request(name: string, _options: unknown, callback: (lock: object | null) => Promise<void>) {
      requests.push(name);
      if (held.has(name)) return callback(null);
      held.add(name);
      try { await callback({ name }); } finally { held.delete(name); events.push(`released:${name}`); }
    },
  } } });
  const listeners = new Set<(state: Auth) => void>();
  let auth: Auth = { session: sessionFor(owner), recovery: false };
  const writes: WriteInput[] = [];
  const ports: Ports = {
    auth: { getState: () => auth, subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener); }, setState: patch => { auth = { ...auth, ...patch }; listeners.forEach(listener => listener(auth)); } },
    read: async () => ({ document: null, adapter: 'memory' }),
    write: async input => { writes.push(structuredClone(input)); return { adapter: 'memory', savedAt: now }; },
    clear: async () => { events.push('clear-workspace'); },
    clearEvidence: async () => { events.push('clear-evidence'); },
    fetch: async id => cloudValue(id),
    hash: async value => createHash('sha256').update(value).digest('hex'),
  };
  globals.__cacheResetPorts = ports;
  const module = { exports: {} as typeof StoreModule & typeof LeaseModule };
  new Function('module', 'exports', 'require', await storeBundle())(module, module.exports, require);
  const loaded = module.exports;
  const store = loaded.useCaseIntelligenceStore;
  store.setState({ sync: async () => {} });
  const stop = loaded.initializeCaseWorkspace();
  await flush();
  assert.equal(store.getState().hasLoaded, true);
  assert.equal(store.getState().storageBlocked, false);
  // Start from an acknowledged workspace, as required by the real clear action.
  store.setState({ localRecords: Object.fromEntries(Object.entries(store.getState().localRecords).map(([key, meta]) => [key, { ...meta, sync_status: 'synced' as const }])) });
  return {
    loaded, store, ports, held, requests, events, writes,
    async close() {
      stop(); await flush();
      for (const [key, descriptor] of savedGlobals) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key);
      }
      delete globals.__cacheResetPorts;
    },
  };
}

test('same-account cache clearing retains its lock and restores cloud records without a self-lock gap', async () => {
  const h = await harness();
  try {
    await h.store.getState().clearLocalCaseData();
    assert.deepEqual(h.requests, [`family-bench.workspace.${owner}`], 'Clearing must not release/reacquire its own lock');
    assert.deepEqual(h.events, ['clear-evidence', 'clear-workspace']);
    assert.equal(h.held.size, 1);
    assert.equal(h.store.getState().storageBlocked, false);
    assert.equal(h.store.getState().loading, false);
    assert.equal(h.store.getState().snapshot.cases[0].title, 'Restored synthetic case');
    assert.equal(h.writes.at(-1)?.snapshot.cases[0].title, 'Restored synthetic case');
    await assert.rejects(h.loaded.acquireWorkspaceLease(owner), /another tab/, 'A second writer remains blocked throughout reset');
  } finally { await h.close(); }
});

for (const failure of ['read', 'fetch', 'write'] as const) {
  test(`cache clearing rejects a ${failure} failure during refresh instead of reporting success`, async () => {
    const h = await harness();
    try {
      const workingPort = h.ports[failure];
      h.ports[failure] = async () => { throw new Error(`Synthetic ${failure} failure`); };
      await assert.rejects(h.store.getState().clearLocalCaseData(), new RegExp(`Synthetic ${failure} failure`));
      assert.equal(h.store.getState().loading, false);
      assert.equal(h.requests.length, 1);
      assert.equal(h.held.size, 1, 'A failed refresh still owns its writer lease for a safe retry');
      if (failure === 'read') assert.equal(h.store.getState().storageBlocked, true);
      if (failure === 'fetch') {
        assert.match(h.store.getState().syncError!, /Synthetic fetch failure/);
        assert.equal(h.store.getState().storageBlocked, true, 'An unrefreshed empty cache must not appear as a ready account');
        const writesBeforeRetry = h.writes.length;
        await h.store.getState().load();
        assert.equal(h.store.getState().storageBlocked, true, 'A failed automatic reload keeps the cleared cache blocked');
        assert.equal(h.writes.length, writesBeforeRetry, 'A failed automatic reload must not save an empty replacement');
      }
      if (failure === 'write') assert.match(h.store.getState().persistence.error!, /Synthetic write failure/);
      Object.assign(h.ports, { [failure]: workingPort });
      await h.store.getState().retrySave();
      assert.equal(h.store.getState().storageBlocked, false);
      assert.equal(h.store.getState().hasLoaded, true);
      assert.equal(h.store.getState().snapshot.cases[0].title, 'Restored synthetic case');
      assert.equal(h.requests.length, 1, 'Retry uses the same retained owner lease');
    } finally { await h.close(); }
  });
}

test('retaining the cache-reset lease still invalidates an entry preparation started before reset', async () => {
  const h = await harness();
  try {
    const started = deferred<void>();
    const digest = deferred<string>();
    h.ports.hash = async () => { started.resolve(); return digest.promise; };
    const saving = h.store.getState().createEntry({ id: '33333333-3333-4333-8333-333333333333', entryType: 'journal', eventDate: '2026-09-05', body: 'Must not reappear after cache reset', isFlagged: false });
    await started.promise;
    await h.store.getState().clearLocalCaseData();
    digest.resolve('a'.repeat(64));
    await assert.rejects(saving, /Account or case changed/);
    assert.equal(h.store.getState().snapshot.entries.length, 0);
    assert.equal(h.writes.some(write => write.snapshot.entries.length > 0), false);
    assert.equal(h.requests.length, 1);
  } finally { await h.close(); }
});

for (const phase of ['clearEvidence', 'clear'] as const) {
  test(`entry preparation cannot save while ${phase} deletion is pending`, async () => {
    const h = await harness();
    const clearFinish = deferred<void>();
    let clearing: Promise<void> | undefined;
    try {
      const hashStarted = deferred<void>();
      const digest = deferred<string>();
      h.ports.hash = async () => { hashStarted.resolve(); return digest.promise; };
      const saving = h.store.getState().createEntry({ id: '33333333-3333-4333-8333-333333333333', entryType: 'journal', eventDate: '2026-09-05', body: 'Must not be acknowledged and then erased', isFlagged: false });
      await hashStarted.promise;
      const clearStarted = deferred<void>();
      h.ports[phase] = async () => { clearStarted.resolve(); await clearFinish.promise; };
      clearing = h.store.getState().clearLocalCaseData();
      await clearStarted.promise;
      digest.resolve('a'.repeat(64));
      await assert.rejects(saving, /Account or case changed/, 'Preparation must be cancelled before deletion, not only after reset');
      assert.equal(h.writes.some(write => write.snapshot.entries.length > 0), false);
      clearFinish.resolve();
      await clearing;
      assert.equal(h.store.getState().snapshot.entries.length, 0);
      assert.equal(h.requests.length, 1, 'Cancelling preparation must retain the existing owner lease');
    } finally {
      clearFinish.resolve();
      await clearing?.catch(() => {});
      await h.close();
    }
  });
}

test('an account change during evidence clearing cannot clear workspace records or reset the new account', async () => {
  const h = await harness();
  try {
    const started = deferred<void>();
    const finish = deferred<void>();
    h.ports.clearEvidence = async () => { started.resolve(); await finish.promise; };
    const clearing = h.store.getState().clearLocalCaseData();
    await started.promise;
    h.ports.auth.setState({ session: sessionFor(otherOwner) });
    await flush();
    finish.resolve();
    await assert.rejects(clearing, /Account changed while clearing/);
    assert.equal(h.events.includes('clear-workspace'), false);
    assert.equal(h.store.getState().ownerId, otherOwner);
    assert.equal(h.store.getState().snapshot.cases[0].user_id, otherOwner);
    assert.deepEqual([...h.held], [`family-bench.workspace.${otherOwner}`]);
  } finally { await h.close(); }
});

test('logout and owner changes continue to release the old account lease and invalidate old writers', async () => {
  const h = await harness();
  try {
    const assertOldLease = h.loaded.captureWorkspaceLease(owner);
    h.ports.auth.setState({ session: sessionFor(otherOwner) });
    await flush();
    assert.throws(assertOldLease, /no longer open/);
    assert.deepEqual([...h.held], [`family-bench.workspace.${otherOwner}`]);
    assert.equal(h.store.getState().ownerId, otherOwner);
    assert.equal(h.store.getState().snapshot.cases[0].user_id, otherOwner);
    const assertOtherLease = h.loaded.captureWorkspaceLease(otherOwner);
    h.ports.auth.setState({ session: null });
    await flush();
    assert.throws(assertOtherLease, /no longer open/);
    assert.equal(h.held.size, 0);
    assert.equal(h.store.getState().ownerId, null);
    assert.equal(h.store.getState().snapshot.cases.length, 0);
  } finally { await h.close(); }
});
