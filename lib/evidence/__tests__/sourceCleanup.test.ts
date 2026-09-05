import test from 'node:test';
import assert from 'node:assert/strict';
import { createSourceCleanupQueue, type SourceCleanupPorts } from '../sourceCleanupCore';
import { isAppCacheSource } from '../cacheSource';

const cache = 'file:///app/cache/';
const file = `${cache}DocumentPicker/synthetic.pdf`;
function nativePorts(initial: string[] = []) {
  let registry = [...initial]; let failWrite = false; let failRemove = false;
  const removed: string[] = []; const events: string[] = [];
  const ports: SourceCleanupPorts = {
    allowed: (uri) => isAppCacheSource(uri, cache),
    async readRegistry() { return [...registry]; },
    async writeRegistry(uris) { events.push('persist'); if (failWrite) throw new Error('Secure storage unavailable'); registry = [...uris]; },
    async removeFile(uri) { events.push('remove'); if (failRemove) throw new Error('File busy'); removed.push(uri); },
  };
  return { ports, removed, events, registry: () => registry, failWrite: (value: boolean) => { failWrite = value; }, failRemove: (value: boolean) => { failRemove = value; } };
}

test('native selections are registered before use; retries preserve active sources and remove abandoned sources', async () => {
  const h = nativePorts(); const queue = createSourceCleanupQueue(h.ports);
  await queue.register(file);
  assert.deepEqual(h.registry(), [file]); assert.equal(queue.getSnapshot().activeCount, 1);
  await queue.retry(); assert.deepEqual(h.removed, []);
  await queue.discard(file);
  assert.deepEqual(h.removed, [file]); assert.deepEqual(h.registry(), []); assert.equal(queue.getSnapshot().pendingCount, 0);
  assert.deepEqual(h.events.slice(-3), ['persist', 'remove', 'persist']);
});

test('failed native removal remains durable and is retried on a cold process restart', async () => {
  const h = nativePorts(); const first = createSourceCleanupQueue(h.ports);
  await first.register(file); h.failRemove(true);
  await assert.rejects(first.discard(file), /recorded for cleanup/);
  assert.deepEqual(h.registry(), [file]); assert.equal(first.getSnapshot().pendingCount, 1);
  h.failRemove(false);
  const restarted = createSourceCleanupQueue(h.ports);
  await restarted.retry(); assert.deepEqual(h.removed, [file]); assert.deepEqual(h.registry(), []);
});

test('secure registry failure discards the new source; a simultaneous delete failure is visible and retained for retry', async () => {
  const h = nativePorts(); const queue = createSourceCleanupQueue(h.ports); h.failWrite(true);
  await assert.rejects(queue.register(file), /registered safely|Secure storage/);
  assert.deepEqual(h.removed, [file]); assert.equal(queue.getSnapshot().activeCount, 0);
  h.failRemove(true);
  await assert.rejects(queue.register(file), /restart recovery record could not be saved/);
  assert.equal(queue.getSnapshot().pendingCount, 1); assert.match(queue.getSnapshot().error!, /before closing/);
  h.failWrite(false); h.failRemove(false); await queue.retry();
  assert.equal(queue.getSnapshot().pendingCount, 0); assert.equal(queue.getSnapshot().error, null);
});

test('external originals, Documents, directories and encoded cache escapes are never removed', async () => {
  const h = nativePorts(); const queue = createSourceCleanupQueue(h.ports);
  for (const uri of ['file:///app/Documents/original.enc', 'file:///photos/user.jpg', `${cache}../Documents/original.enc`, `${cache}%2E%2E/secret`, cache, 'content://provider/file', 'ph://gallery/asset']) {
    await queue.register(uri); await queue.discard(uri);
  }
  await queue.retry(); assert.deepEqual(h.removed, []); assert.deepEqual(h.registry(), []);
});

test('late picker cancellation queued during registration removes the source and leaves no active claim', async () => {
  const h = nativePorts(); let complete!: () => void;
  const gate = new Promise<void>((resolve) => { complete = resolve; });
  const queue = createSourceCleanupQueue({ ...h.ports, readRegistry: async () => { await gate; return []; } });
  const registering = queue.register(file);
  const discarded = queue.discard(file); // Native picker completed while its screen was being removed.
  complete(); await registering; await discarded;
  assert.deepEqual(h.removed, [file]); assert.deepEqual(h.registry(), []); assert.equal(queue.getSnapshot().activeCount, 0);
});

test('a background retry queued before registration cannot erase the active selected source', async () => {
  const h = nativePorts([file]); let complete!: () => void;
  const gate = new Promise<void>((resolve) => { complete = resolve; });
  const queue = createSourceCleanupQueue({ ...h.ports, readRegistry: async () => { await gate; return [file]; } });
  const retry = queue.retry(); const registration = queue.register(file);
  complete(); await retry; await registration;
  assert.deepEqual(h.removed, []); assert.equal(queue.getSnapshot().activeCount, 1);
});
