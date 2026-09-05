import test from 'node:test';
import assert from 'node:assert/strict';
import { assertSnapshotOwner, emptyCaseSnapshot, workspaceStorageKey } from '../lib/case-intelligence/ownership';
import { createWriteQueue } from '../lib/case-intelligence/writeQueue';
import { getSupabaseEnvironmentStatus } from '../lib/supabase/environment';
const a = '11111111-1111-4111-8111-111111111111';
const b = '22222222-2222-4222-8222-222222222222';

test('accounts use different storage namespaces and reject foreign records', () => {
  assert.notEqual(workspaceStorageKey(a), workspaceStorageKey(b));
  const snapshot = emptyCaseSnapshot();
  assert.doesNotThrow(() => assertSnapshotOwner(snapshot, a));
  snapshot.entries = [{ user_id: b }] as typeof snapshot.entries;
  assert.throws(() => assertSnapshotOwner(snapshot, a), /different account/);
});
test('environment refuses another Supabase project', () => {
  assert.equal(getSupabaseEnvironmentStatus({ EXPO_PUBLIC_SUPABASE_URL: 'https://lpjzyukzexngeknesxmw.supabase.co', EXPO_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_example' }), 'wrong_project');
  assert.equal(getSupabaseEnvironmentStatus({ EXPO_PUBLIC_SUPABASE_URL: 'https://aeeovmnhfxobeqpczjvt.supabase.co', EXPO_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_example' }), 'configured');
});
test('ordered saves do not overwrite newer state and queue recovers after failure', async () => {
  const enqueue = createWriteQueue();
  const events: number[] = [];
  let release!: () => void;
  const blocker = new Promise<void>((resolve) => { release = resolve; });
  const one = enqueue(a, async () => { await blocker; events.push(1); });
  const two = enqueue(a, async () => { events.push(2); throw new Error('disk full'); });
  const failed = assert.rejects(two, /disk full/);
  const three = enqueue(a, async () => { events.push(3); });
  await enqueue(b, async () => { events.push(4); });
  assert.deepEqual(events, [4]);
  release(); await Promise.all([one, failed, three]);
  assert.deepEqual(events, [4, 1, 2, 3]);
});
