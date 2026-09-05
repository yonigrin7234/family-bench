import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';
import type * as Files from '../lib/imports/files';

// Native file and cleanup ports are substituted; execute the real freeze lifecycle.
const directory = mkdtempSync(join(tmpdir(), 'family-bench-import-files-'));
after(() => rmSync(directory, { recursive: true, force: true }));
const root = resolve(import.meta.dirname, '..'), require = createRequire(import.meta.url);
type Ports = { register(uri: string): Promise<void>; discard(uri: string): Promise<void>; write(uri: string, value: string): Promise<void> };
const globals = globalThis as typeof globalThis & { __csvFileTest?: Ports };
let bundle: Promise<string> | undefined, number = 0;
function fileBundle() {
  return bundle ??= build({ absWorkingDir: root, entryPoints: ['lib/imports/files.ts'], platform: 'node', format: 'cjs', bundle: true, write: false, logLevel: 'silent',
    plugins: [{ name: 'native-csv-file-test', setup(builder) {
      const modules: Record<string, string> = {
        'react-native': `export const Platform = { OS: 'ios' };`,
        'expo-crypto': `export const randomUUID = () => '11111111-1111-4111-8111-111111111111';`,
        'expo-file-system/legacy': `const p = globalThis.__csvFileTest; export const cacheDirectory = 'file:///app/Library/Caches/'; export const EncodingType = { Base64: 'base64' }; export const writeAsStringAsync = (...args) => p.write(...args);`,
        '../evidence/local': `export const readEvidenceSource = () => { throw new Error('Unexpected picker read'); };`,
        '../evidence/picker': `export const discardPickedEvidence = () => { throw new Error('Frozen files must use the cleanup manager'); }; export const pickEvidenceFile = () => { throw new Error('Unexpected picker'); };`,
        '../evidence/sourceCleanup': `const p = globalThis.__csvFileTest; export const registerTemporarySource = ({localUri}) => p.register(localUri); export const discardTemporarySource = ({localUri}) => p.discard(localUri);`,
      };
      builder.onResolve({ filter: /.*/ }, (args) => Object.hasOwn(modules, args.path) ? { path: args.path, namespace: 'csv-file-ports' } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'csv-file-ports' }, (args) => ({ contents: modules[args.path], loader: 'js' }));
    } }],
  }).then((result) => result.outputFiles![0].text);
}
async function harness(ports: Ports) {
  globals.__csvFileTest = ports;
  const path = join(directory, `files-${number++}.cjs`); writeFileSync(path, await fileBundle());
  const files = require(path) as typeof Files; delete globals.__csvFileTest; return files;
}
const picked = { filename: 'synthetic.csv', kind: 'document' as const, localUri: 'file:///app/Library/Caches/picked.csv' };

test('native CSV freezes reviewed bytes before registration awaits, registers before plaintext write, and releases through retryable cleanup', async () => {
  const bytes = new TextEncoder().encode('reviewed bytes'), calls: string[] = []; let content = '', path = '';
  const files = await harness({ register: async (uri) => { path = uri; calls.push('register'); bytes.fill(0); }, write: async (uri, value) => { assert.equal(uri, path); calls.push('write'); content = value; }, discard: async (uri) => { assert.equal(uri, path); calls.push('discard'); } });
  const frozen = await files.frozenCsvSource(picked, bytes);
  assert.deepEqual(calls, ['register', 'write']); assert.equal(Buffer.from(content, 'base64').toString(), 'reviewed bytes');
  assert.notEqual(frozen.input.localUri, picked.localUri); assert.equal(frozen.input.mimeType, 'text/csv');
  await frozen.release(); assert.deepEqual(calls, ['register', 'write', 'discard']);
});

test('registration or native write failure attempts tracked deletion and never returns an importable source', async () => {
  for (const failing of ['register', 'write']) {
    const calls: string[] = [];
    const files = await harness({ register: async () => { calls.push('register'); if (failing === 'register') throw new Error('Registration failed'); }, write: async () => { calls.push('write'); throw new Error('Write failed'); }, discard: async () => { calls.push('discard'); throw new Error('Removal retained in recovery registry'); } });
    await assert.rejects(() => files.frozenCsvSource(picked, new Uint8Array([1])), failing === 'register' ? /Registration failed/ : /Write failed/);
    assert.deepEqual(calls, failing === 'register' ? ['register', 'discard'] : ['register', 'write', 'discard']);
  }
});
