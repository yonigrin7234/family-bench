import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

test('native adapter bounds secure values, preserves failed deletes across restart, and ignores non-cache files', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'family-bench-cleanup-native-'));
  const require = createRequire(import.meta.url);
  const values = new Map<string, string>(); const removed: string[] = []; let blockDelete = true;
  const globals = globalThis as typeof globalThis & Record<string, unknown>;
  globals.__cleanupNativeTest = {
    get: async (key: string) => values.get(key) ?? null,
    set: async (key: string, value: string) => { assert.ok(Buffer.byteLength(value) <= 1800); values.set(key, value); },
    removeKey: async (key: string) => { values.delete(key); },
    info: async () => ({ exists: true, isDirectory: false }),
    remove: async (uri: string) => { if (blockDelete) throw new Error('Native file is busy'); removed.push(uri); },
  };
  try {
    const result = await build({ entryPoints: ['lib/evidence/sourceCleanup.ts'], bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent', plugins: [{ name: 'native-ports', setup(builder) {
      const modules: Record<string, string> = {
        react: 'export const useSyncExternalStore = (_subscribe, get) => get();',
        'react-native': 'export const Platform = { OS: "ios" };',
        'expo-secure-store': 'const p = globalThis.__cleanupNativeTest; export const getItemAsync = p.get, setItemAsync = p.set, deleteItemAsync = p.removeKey, WHEN_UNLOCKED_THIS_DEVICE_ONLY = 1;',
        'expo-file-system/legacy': 'const p = globalThis.__cleanupNativeTest; export const cacheDirectory = "file:///app/cache/", getInfoAsync = p.info, deleteAsync = p.remove;',
      };
      builder.onResolve({ filter: /.*/ }, (args) => Object.hasOwn(modules, args.path) ? { path: args.path, namespace: 'native' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'native' }, (args) => ({ contents: modules[args.path], loader: 'js' }));
    } }] });
    const load = (id: number) => {
      delete globals.__familyBenchSourceCleanupV1; delete globals.__familyBenchSourceCleanupStartedV1;
      const path = join(directory, `${id}.cjs`); writeFileSync(path, result.outputFiles![0].text);
      return require(path) as typeof import('../sourceCleanup');
    };
    const first = load(1); const uri = 'file:///app/cache/DocumentPicker/private-test.pdf';
    await first.registerTemporarySource({ localUri: uri });
    assert.equal(values.size, 1);
    await first.retryTemporarySourceCleanup(); assert.deepEqual(removed, []);
    await assert.rejects(first.discardTemporarySource({ localUri: uri }), /recorded for cleanup/);
    assert.equal(values.size, 1);
    const restarted = load(2); blockDelete = false;
    await restarted.retryTemporarySourceCleanup(); assert.deepEqual(removed, [uri]); assert.equal(values.size, 0);
    await restarted.discardTemporarySource({ localUri: 'file:///app/Documents/encrypted-original' });
    await restarted.discardTemporarySource({ localUri: 'content://gallery/user-original' });
    assert.deepEqual(removed, [uri]);
    const oversized = `file:///app/cache/${'a'.repeat(1801)}.pdf`;
    await assert.rejects(restarted.registerTemporarySource({ localUri: oversized }), /secure cleanup record limit/);
    assert.ok((removed as string[]).includes(oversized), 'Untrackable cache selection must be discarded, never accepted silently');
    assert.equal(values.size, 0);
  } finally {
    delete globals.__cleanupNativeTest; delete globals.__familyBenchSourceCleanupV1; delete globals.__familyBenchSourceCleanupStartedV1;
    rmSync(directory, { recursive: true, force: true });
  }
});
