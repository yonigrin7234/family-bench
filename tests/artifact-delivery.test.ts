import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import type { TimelineArtifact } from '../lib/export/timeline';

type Ports = { available: () => Promise<boolean>; share: () => Promise<void>; register?: () => Promise<void>; discard?: () => Promise<void>; write?: () => void; events: string[] };
const globals = globalThis as typeof globalThis & { __artifactDeliveryPorts?: Ports };
let compiled: Promise<string> | undefined;
async function harness(ports: Ports) {
  compiled ??= build({ entryPoints: ['lib/export/download.ts'], bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
    plugins: [{ name: 'artifact-native-ports', setup(builder) {
      const sources: Record<string, string> = {
        'react-native': `export const Platform = { OS: 'ios' };`,
        'expo-asset': `export const Asset = {};`,
        'expo-crypto': `export const randomUUID = () => 'synthetic';`,
        'expo-sharing': `const p = globalThis.__artifactDeliveryPorts; export const isAvailableAsync = () => p.available(); export const shareAsync = () => p.share();`,
        'expo-file-system': `const p = globalThis.__artifactDeliveryPorts; export const Paths = {cache:'cache'}; export class File { uri='synthetic://file'; create(){p.events.push('create')} write(){p.events.push('write');p.write?.()} }`,
        '../evidence/sourceCleanup': `const p = globalThis.__artifactDeliveryPorts; export async function registerTemporarySource({localUri}) { if(localUri !== 'synthetic://file') throw new Error('Wrong cleanup URI'); p.events.push('register'); await p.register?.(); } export async function discardTemporarySource({localUri}) { if(localUri !== 'synthetic://file') throw new Error('Wrong cleanup URI'); p.events.push('discard'); await p.discard?.(); }`,
      };
      builder.onResolve({ filter: /.*/ }, (args) => sources[args.path] ? { path: args.path, namespace: 'ports' } : /\.ttf$/.test(args.path) ? { path: args.path, external: true } : undefined);
      builder.onLoad({ filter: /.*/, namespace: 'ports' }, (args) => ({ contents: sources[args.path], loader: 'js' }));
    } }],
  }).then((result) => result.outputFiles[0].text);
  globals.__artifactDeliveryPorts = ports;
  const module = { exports: {} as { downloadArtifact: (artifact: TimelineArtifact, guard: () => void) => Promise<void> } };
  new Function('module', 'exports', 'require', await compiled)(module, module.exports, createRequire(import.meta.url));
  return module.exports.downloadArtifact;
}
const artifact: TimelineArtifact = { name: 'synthetic.pdf', mimeType: 'application/pdf', bytes: new Uint8Array([1, 2, 3]) };

test('a session change while native sharing availability resolves prevents plaintext file creation', async () => {
  let resolve!: (value: boolean) => void;
  const available = new Promise<boolean>((yes) => { resolve = yes; });
  const events: string[] = [];
  const download = await harness({ events, available: () => available, share: async () => { events.push('share'); } });
  let current = true;
  const operation = download(artifact, () => { if (!current) throw new Error('Session changed'); });
  current = false; resolve(true);
  await assert.rejects(operation, /Session changed/);
  assert.deepEqual(events, []);
});

test('native artifacts are registered before writing and released through tracked cleanup after sharing succeeds or fails', async () => {
  for (const fail of [false, true]) {
    const events: string[] = [];
    const download = await harness({ events, available: async () => true, share: async () => { events.push('share'); if (fail) throw new Error('Share failed'); } });
    const operation = download(artifact, () => {});
    if (fail) await assert.rejects(operation, /Share failed/); else await operation;
    assert.deepEqual(events, ['register', 'create', 'write', 'share', 'discard']);
  }
});

test('a registration failure prevents plaintext creation and releases the cleanup claim', async () => {
  const events: string[] = [];
  const download = await harness({ events, available: async () => true, register: async () => { throw new Error('Cleanup registration failed'); }, share: async () => { events.push('share'); } });
  await assert.rejects(() => download(artifact, () => {}), /Cleanup registration failed/);
  assert.deepEqual(events, ['register', 'discard']);
});

test('a session change during asynchronous registration prevents plaintext creation or sharing', async () => {
  const events: string[] = []; let current = true;
  let registered!: () => void, finish!: () => void;
  const started = new Promise<void>((resolve) => { registered = resolve; });
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  const download = await harness({ events, available: async () => true, register: async () => { registered(); await pending; }, share: async () => { events.push('share'); } });
  const operation = download(artifact, () => { if (!current) throw new Error('Session changed'); });
  await started; current = false; finish();
  await assert.rejects(operation, /Session changed/);
  assert.deepEqual(events, ['register', 'discard']);
});

test('a partial native write still reaches cleanup without opening the share sheet', async () => {
  const events: string[] = [];
  const download = await harness({ events, available: async () => true, write: () => { throw new Error('Disk full'); }, share: async () => { events.push('share'); } });
  await assert.rejects(() => download(artifact, () => {}), /Disk full/);
  assert.deepEqual(events, ['register', 'create', 'write', 'discard']);
});

test('cleanup failure remains with the cleanup notice and does not mask the sharing result', async () => {
  for (const failShare of [false, true]) {
    const events: string[] = [];
    const download = await harness({ events, available: async () => true, share: async () => { if (failShare) throw new Error('Share failed'); }, discard: async () => { throw new Error('Cleanup retained for retry'); } });
    const operation = download(artifact, () => {});
    if (failShare) await assert.rejects(operation, /Share failed/); else await operation;
    assert.equal(events.at(-1), 'discard');
  }
});
