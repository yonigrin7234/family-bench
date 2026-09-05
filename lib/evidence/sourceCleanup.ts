import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import { isAppCacheSource } from './cacheSource';
import { createSourceCleanupQueue } from './sourceCleanupCore';

const SLOT_COUNT = 128;
const MAX_SLOT_BYTES = 1800;
const slotKey = (slot: number) => `family-bench.temporary-source.v1.${slot}`;
const allowed = (uri: string) => Platform.OS !== 'web' && Boolean(FileSystem.cacheDirectory && isAppCacheSource(uri, FileSystem.cacheDirectory));

function nativeQueue() {
  const savedSlots = new Map<number, string>();
  return createSourceCleanupQueue({
    allowed,
    async readRegistry() {
      savedSlots.clear();
      const slots = await Promise.all(Array.from({ length: SLOT_COUNT }, (_, slot) => SecureStore.getItemAsync(slotKey(slot))));
      slots.forEach((value, slot) => {
        if (!value) return;
        if (new TextEncoder().encode(value).length > MAX_SLOT_BYTES || !allowed(value)) throw new Error('A temporary-file cleanup record is invalid. It has been preserved for review.');
        savedSlots.set(slot, value);
      });
      return [...new Set(savedSlots.values())];
    },
    async writeRegistry(uris) {
      if (uris.length > SLOT_COUNT) throw new Error('Finish saving or discarding existing temporary selections before selecting more files.');
      if (uris.some((uri) => !allowed(uri) || new TextEncoder().encode(uri).length > MAX_SLOT_BYTES)) throw new Error('The temporary file path exceeds this device’s secure cleanup record limit.');
      const wanted = new Set(uris);
      // Fixed independent slots avoid an index/file crash window and keep each SecureStore value below 2 KB.
      for (const [slot, uri] of savedSlots) if (!wanted.has(uri)) { await SecureStore.deleteItemAsync(slotKey(slot)); savedSlots.delete(slot); }
      for (const uri of uris) {
        if ([...savedSlots.values()].includes(uri)) continue;
        const slot = Array.from({ length: SLOT_COUNT }, (_, index) => index).find((index) => !savedSlots.has(index));
        if (slot === undefined) throw new Error('Temporary-file cleanup storage is full. Retry cleanup.');
        await SecureStore.setItemAsync(slotKey(slot), uri, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
        savedSlots.set(slot, uri);
      }
    },
    async removeFile(uri) {
      if (!allowed(uri)) throw new Error('Cleanup is restricted to individual app-cache files.');
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) return;
      if (info.isDirectory) throw new Error('Cleanup cannot remove directories.');
      await FileSystem.deleteAsync(uri, { idempotent: true });
    },
  });
}

// Preserve live claims across Fast Refresh. A cold process has no live selection owners.
const globals = globalThis as typeof globalThis & { __familyBenchSourceCleanupV1?: ReturnType<typeof nativeQueue>; __familyBenchSourceCleanupStartedV1?: boolean };
const queue = globals.__familyBenchSourceCleanupV1 ??= nativeQueue();
export function registerTemporarySource(input: { localUri?: string | null }): Promise<void> { return input.localUri ? queue.register(input.localUri) : Promise.resolve(); }
export async function discardTemporarySource(input: { localUri?: string | null }): Promise<void> {
  if (!input.localUri) return;
  if (Platform.OS === 'web') { if (input.localUri.startsWith('blob:')) URL.revokeObjectURL(input.localUri); return; }
  await queue.discard(input.localUri);
}
export function retryTemporarySourceCleanup(): Promise<void> { return Platform.OS === 'web' ? Promise.resolve() : queue.retry(); }
export function initializeTemporarySourceCleanup(): void {
  if (Platform.OS === 'web' || globals.__familyBenchSourceCleanupStartedV1) return;
  globals.__familyBenchSourceCleanupStartedV1 = true;
  void queue.retry().catch(() => { /* The persistent global notice exposes the failure and retry action. */ });
}
export function useTemporarySourceCleanup() { return useSyncExternalStore(queue.subscribe, queue.getSnapshot, queue.getSnapshot); }
