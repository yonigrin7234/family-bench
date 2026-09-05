import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

async function withLeasePort(os: 'web' | 'ios' | 'android', run: (lease: typeof import('../lib/case-intelligence/workspaceLease')) => Promise<void>) {
  const directory = mkdtempSync(join(tmpdir(), 'family-bench-lease-'));
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  try {
    // React Native's setUpGlobals defines this alias on both iOS and Android.
    Object.defineProperty(globalThis, 'window', { configurable: true, value: globalThis });
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
    const result = await build({ entryPoints: ['lib/case-intelligence/workspaceLease.ts'], bundle: true, platform: 'node', format: 'cjs', write: false, plugins: [{ name: 'platform-port', setup(builder) {
      builder.onResolve({ filter: /^react-native$/ }, () => ({ path: 'platform', namespace: 'test' }));
      builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: `export const Platform = { OS: ${JSON.stringify(os)} };`, loader: 'js' }));
    } }] });
    const path = join(directory, 'lease.cjs'); writeFileSync(path, result.outputFiles![0].text);
    await run(createRequire(import.meta.url)(path));
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow); else Reflect.deleteProperty(globalThis, 'window');
    if (oldNavigator) Object.defineProperty(globalThis, 'navigator', oldNavigator); else Reflect.deleteProperty(globalThis, 'navigator');
    rmSync(directory, { recursive: true, force: true });
  }
}

test('a browser workspace holds its writer lock across saves, and old saves cannot use a reopened lease', async () => {
  await withLeasePort('web', async ({ acquireWorkspaceLease, captureWorkspaceLease, hasWorkspaceLease }) => {
    const locks = new Set<string>();
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: {
      async request(name: string, _options: unknown, callback: (lock: object | null) => Promise<void>) {
        if (locks.has(name)) return callback(null);
        locks.add(name);
        try { await callback({ name }); } finally { locks.delete(name); }
      },
    } } });
    const release = await acquireWorkspaceLease('owner');
    const assertOriginalLease = captureWorkspaceLease('owner');
    assert.equal(hasWorkspaceLease('owner'), true);
    await assert.rejects(acquireWorkspaceLease('owner'), /another tab/);
    assertOriginalLease();
    release();
    assert.throws(assertOriginalLease, /no longer open/);
    await new Promise<void>((resolve) => setImmediate(resolve));
    const releaseAgain = await acquireWorkspaceLease('owner');
    assert.throws(assertOriginalLease, /reopened/);
    releaseAgain();
  });
});

for (const os of ['ios', 'android'] as const) {
  test(`${os} opens and saves with React Native's window alias and no Web Locks`, async () => {
    await withLeasePort(os, async ({ acquireWorkspaceLease, captureWorkspaceLease, hasWorkspaceLease }) => {
      const release = await acquireWorkspaceLease('owner');
      assert.equal(hasWorkspaceLease('owner'), true);
      const assertLease = captureWorkspaceLease('owner');
      assertLease(); release(); assertLease();
    });
  });
}

test('a browser without Web Locks still refuses an unsafe second writer', async () => {
  await withLeasePort('web', async ({ acquireWorkspaceLease }) => {
    await assert.rejects(acquireWorkspaceLease('owner'), /Web Locks/);
    Reflect.deleteProperty(globalThis, 'navigator');
    await assert.rejects(acquireWorkspaceLease('owner'), /Web Locks/);
  });
});
