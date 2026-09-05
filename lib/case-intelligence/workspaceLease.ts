import { Platform } from 'react-native';

// Hold one writer for an account for the entire lifetime of its open workspace.
// A per-write lock alone is insufficient: two tabs could serialize stale full
// snapshots and still overwrite each other's unsynced edits.
const held = new Map<string, symbol>();

export function hasWorkspaceLease(ownerId: string): boolean {
  return Platform.OS !== 'web' || typeof window === 'undefined' || held.has(ownerId);
}

export async function acquireWorkspaceLease(ownerId: string): Promise<() => void> {
  // React Native also defines window; only browsers use the Web Locks API.
  if (Platform.OS !== 'web' || typeof window === 'undefined') return () => {};
  if (typeof navigator === 'undefined' || !navigator.locks) throw new Error('This browser cannot safely coordinate saved case data. Open Family Bench in a browser that supports Web Locks.');
  return new Promise((resolve, reject) => {
    void navigator.locks.request(`family-bench.workspace.${ownerId}`, { mode: 'exclusive', ifAvailable: true }, async (lock) => {
      if (!lock) { reject(new Error('Your case is already open in another tab. Close that tab, then retry here to protect unsynced changes.')); return; }
      const token = Symbol(ownerId);
      held.set(ownerId, token);
      await new Promise<void>((release) => {
        resolve(() => {
          if (held.get(ownerId) === token) held.delete(ownerId);
          release();
        });
      });
    }).catch(reject);
  });
}

export function assertWorkspaceLease(ownerId: string): void {
  if (!hasWorkspaceLease(ownerId)) throw new Error('This workspace is no longer open for saving. Reopen your account and retry.');
}

export function captureWorkspaceLease(ownerId: string): () => void {
  assertWorkspaceLease(ownerId);
  const token = held.get(ownerId);
  return () => {
    assertWorkspaceLease(ownerId);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && held.get(ownerId) !== token) throw new Error('Your workspace was reopened while saving. Retry in the current session.');
  };
}
