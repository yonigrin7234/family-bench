import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, mkdir, readFile, writeFile, stat, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { pathToFileURL, URL } from 'node:url';
import { emptyCaseSnapshot } from '../lib/case-intelligence/ownership';

const owner = '11111111-1111-4111-8111-111111111111';
const otherOwner = '33333333-3333-4333-8333-333333333333';
const caseId = '22222222-2222-4222-8222-222222222222';
type Persistence = typeof import('../lib/case-intelligence/persistence');
type WriteInput = Parameters<Persistence['writePersistedCaseIntelligence']>[0];

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

async function nativePersistence(run: (persistence: Persistence, ports: { beforeWrite: (uri: string, value: string) => Promise<void>; beforeDelete: (uri: string) => Promise<void> }) => Promise<void>) {
  const directory = await mkdtemp(join(tmpdir(), 'family-bench-persistence-native-'));
  const globals = globalThis as typeof globalThis & Record<string, unknown>;
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const hooks = { beforeWrite: async (_uri: string, _value: string) => {}, beforeDelete: async (_uri: string) => {} };
  globals.__nativeWorkspacePorts = {
    directory: pathToFileURL(`${directory}/Documents/`).href,
    info: async (uri: string) => { try { const info = await stat(new URL(uri)); return { exists: true, isDirectory: info.isDirectory() }; } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { exists: false }; throw error; } },
    mkdir: async (uri: string) => { await mkdir(new URL(uri), { recursive: true }); },
    read: (uri: string) => readFile(new URL(uri), 'utf8'),
    write: async (uri: string, value: string) => { await hooks.beforeWrite(uri, value); await writeFile(new URL(uri), value); },
    remove: async (uri: string) => { await hooks.beforeDelete(uri); await rm(new URL(uri), { force: true }); },
  };
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: globalThis });
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
    const modules: Record<string, string> = {
      'react-native': 'export const Platform = { OS: "ios" };',
      'expo-crypto': 'export { randomUUID } from "node:crypto";',
      'expo-file-system/legacy': 'const p=globalThis.__nativeWorkspacePorts; export const documentDirectory=p.directory, getInfoAsync=p.info, makeDirectoryAsync=p.mkdir, readAsStringAsync=p.read, writeAsStringAsync=p.write, deleteAsync=p.remove;',
      // The real parser, account queue and disk adapter run here. Encryption is
      // a separately tested boundary and deterministic in these concurrency tests.
      '@/lib/security/localEncryption': 'export const sealLocalBytes=async (_owner, bytes)=>bytes; export const openLocalBytes=async (_owner, bytes)=>bytes;',
    };
    const result = await build({ entryPoints: ['lib/case-intelligence/persistence.ts'], bundle: true, platform: 'node', format: 'cjs', write: false, plugins: [{ name: 'native-workspace-ports', setup(builder) {
      builder.onResolve({ filter: /.*/ }, (args) => Object.hasOwn(modules, args.path) ? { path: args.path, namespace: 'native' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'native' }, (args) => ({ contents: modules[args.path], loader: 'js' }));
    } }] });
    const path = join(directory, 'persistence.cjs'); await writeFile(path, result.outputFiles![0].text);
    await run(createRequire(import.meta.url)(path), hooks);
  } finally {
    delete globals.__nativeWorkspacePorts;
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else Reflect.deleteProperty(globalThis, 'window');
    if (oldNavigator) Object.defineProperty(globalThis, 'navigator', oldNavigator); else Reflect.deleteProperty(globalThis, 'navigator');
    await rm(directory, { recursive: true, force: true });
  }
}

function input(p: Persistence, title: string, ownerId = owner): WriteInput {
  const snapshot = emptyCaseSnapshot();
  snapshot.cases = [{ id: caseId, user_id: ownerId, title, created_at: '2026-09-05T00:00:00Z', updated_at: '2026-09-05T00:00:00Z', deleted_at: null }] as typeof snapshot.cases;
  return { ownerId, snapshot, reportPreviewState: p.DEFAULT_REPORT_PREVIEW_STATE, advisorState: p.DEFAULT_ADVISOR_STATE, filingBuilderState: p.DEFAULT_FILING_BUILDER_STATE, patternReviewState: p.DEFAULT_PATTERN_REVIEW_STATE, savedReportVersions: [], conflictHistory: [], localRecords: {}, contextRecovery: [] };
}

test('native same-account reopening waits for the pending save and cannot overwrite it with stale hydration', { timeout: 10_000 }, async () => {
  await nativePersistence(async (p, hooks) => {
    await p.writePersistedCaseIntelligence(input(p, 'Earlier case title'));
    const entered = deferred(); const release = deferred();
    hooks.beforeWrite = async () => { entered.resolve(); await release.promise; };
    const pendingSave = p.writePersistedCaseIntelligence(input(p, 'Latest offline edit'));
    await entered.promise;
    let hydrated = false;
    const reopened = p.readPersistedCaseIntelligence(owner).then((value) => { hydrated = true; return value; });
    try {
      // Another account stays usable while this account's save is blocked.
      assert.equal((await p.readPersistedCaseIntelligence(otherOwner)).document, null);
      await new Promise<void>((resolve) => setImmediate(resolve));
      assert.equal(hydrated, false, 'The new session must not read the earlier disk generation');
    } finally { release.resolve(); }
    await pendingSave;
    const loaded = await reopened;
    assert.equal(loaded.document?.snapshot.cases[0].title, 'Latest offline edit');
    assert.equal(loaded.document?.sequence, 2);
    await p.writePersistedCaseIntelligence({ ...input(p, ''), snapshot: loaded.document!.snapshot });
    const final = await p.readPersistedCaseIntelligence(owner);
    assert.equal(final.document?.snapshot.cases[0].title, 'Latest offline edit');
    assert.equal(final.document?.sequence, 3);
  });
});

test('native hydration recovers the previous slot after a failed queued save and a subsequent save succeeds', async () => {
  await nativePersistence(async (p, hooks) => {
    await p.writePersistedCaseIntelligence(input(p, 'Verified original'));
    hooks.beforeWrite = async (uri) => { await writeFile(new URL(uri), 'interrupted'); throw new Error('Disk write interrupted'); };
    const failed = p.writePersistedCaseIntelligence(input(p, 'Incomplete edit'));
    const failure = assert.rejects(failed, /Disk write interrupted/);
    const loaded = p.readPersistedCaseIntelligence(owner);
    await failure;
    const recovered = await loaded;
    assert.equal(recovered.document?.snapshot.cases[0].title, 'Verified original');
    assert.match(recovered.warning!, /interrupted save/);
    hooks.beforeWrite = async () => {};
    await p.writePersistedCaseIntelligence(input(p, 'Retried edit'));
    const final = await p.readPersistedCaseIntelligence(owner);
    assert.equal(final.document?.snapshot.cases[0].title, 'Retried edit');
    assert.equal(final.document?.sequence, 2);
    assert.equal(final.warning, undefined);
  });
});

test('native hydration waits for an account clear and preserves other accounts', { timeout: 10_000 }, async () => {
  await nativePersistence(async (p, hooks) => {
    await p.writePersistedCaseIntelligence(input(p, 'Account to clear'));
    await p.writePersistedCaseIntelligence(input(p, 'Other account', otherOwner));
    const entered = deferred(); const release = deferred();
    hooks.beforeDelete = async () => { entered.resolve(); await release.promise; };
    const clear = p.clearPersistedCaseIntelligence(owner);
    await entered.promise;
    let hydrated = false;
    const loaded = p.readPersistedCaseIntelligence(owner).then((value) => { hydrated = true; return value; });
    try {
      assert.equal((await p.readPersistedCaseIntelligence(otherOwner)).document?.snapshot.cases[0].title, 'Other account');
      assert.equal(hydrated, false);
    } finally { release.resolve(); }
    await clear;
    assert.equal((await loaded).document, null);
    await p.writePersistedCaseIntelligence(input(p, 'Fresh account snapshot'));
    assert.equal((await p.readPersistedCaseIntelligence(owner)).document?.sequence, 1);
  });
});
