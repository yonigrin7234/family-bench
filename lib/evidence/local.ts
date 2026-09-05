import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import type { EvidenceLocalStore, EvidenceSourceInput } from './core';
import { MAX_EVIDENCE_BYTES, validateEvidenceSize } from './core';
import { decodeBase64, encodeBase64 } from './encoding';
import { sealLocalBytes, openLocalBytes } from '../security/localEncryption';
import { isAppCacheSource } from './cacheSource';

const DATABASE = 'family-bench-evidence-v1';
const OBJECT_STORE = 'originals';
let databasePromise: Promise<IDBDatabase> | undefined;
const nativeWrites = new Set<string>();

function openDatabase(): Promise<IDBDatabase> {
  if (!globalThis.indexedDB) return Promise.reject(new Error('This browser cannot store original evidence. Enable browser storage before attaching a file.'));
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(OBJECT_STORE);
      request.onerror = () => reject(new Error('Unable to open evidence storage. Check your browser storage permissions.'));
      request.onblocked = () => reject(new Error('Evidence storage is blocked by another tab. Close other Family Bench tabs and try again.'));
      request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); databasePromise = undefined; };
        resolve(request.result);
      };
    });
    databasePromise.catch(() => { databasePromise = undefined; });
  }
  return databasePromise;
}

export function nativeEvidenceUri(key: string): string {
  if (!FileSystem.documentDirectory) throw new Error('Device document storage is unavailable.');
  if (!/^[0-9a-f-]+\/[0-9a-f-]+\/[0-9a-f-]+\/[0-9a-f-]+\/original$/i.test(key)) {
    throw new Error('Invalid evidence storage key.');
  }
  return `${FileSystem.documentDirectory}family-bench/evidence/${key}`;
}

export const localEvidenceStore: EvidenceLocalStore = {
  async write(key, bytes) {
    const encrypted = await sealLocalBytes(key.split('/')[0], bytes);
    if (Platform.OS === 'web') {
      const database = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(OBJECT_STORE, 'readwrite');
        transaction.objectStore(OBJECT_STORE).add(new Uint8Array(encrypted).buffer, key);
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(new Error('The original file was not saved. Browser storage may be full, blocked, or the original already exists.'));
        transaction.onerror = () => { /* onabort reports the complete transaction failure. */ };
      });
      return;
    }
    const uri = nativeEvidenceUri(key);
    if (nativeWrites.has(key)) throw new Error('This original is already being saved.');
    nativeWrites.add(key);
    const temporary = `${uri}.pending`;
    try {
      const directory = uri.slice(0, uri.lastIndexOf('/') + 1);
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      const existing = await FileSystem.getInfoAsync(uri);
      if (existing.exists) throw new Error('This original already exists and cannot be overwritten.');
      await FileSystem.writeAsStringAsync(temporary, encodeBase64(encrypted), { encoding: FileSystem.EncodingType.Base64 });
      await FileSystem.moveAsync({ from: temporary, to: uri });
    } catch (error) {
      await FileSystem.deleteAsync(temporary, { idempotent: true }).catch(() => undefined);
      throw error;
    } finally { nativeWrites.delete(key); }
  },
  async read(key) {
    if (Platform.OS === 'web') {
      const database = await openDatabase();
      const encrypted = await new Promise<Uint8Array | null>((resolve, reject) => {
        const transaction = database.transaction(OBJECT_STORE, 'readonly');
        const request = transaction.objectStore(OBJECT_STORE).get(key);
        let result: Uint8Array | null = null;
        request.onsuccess = () => { result = request.result ? new Uint8Array(request.result) : null; };
        transaction.oncomplete = () => resolve(result);
        transaction.onabort = () => reject(new Error('Unable to read the stored original file.'));
        transaction.onerror = () => { /* handled by onabort */ };
      });
      return encrypted ? openLocalBytes(key.split('/')[0], encrypted) : null;
    }
    const uri = nativeEvidenceUri(key);
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return null;
    if ('size' in info && info.size > MAX_EVIDENCE_BYTES + 34) throw new Error('The encrypted original exceeds the attachment limit.');
    return openLocalBytes(key.split('/')[0], decodeBase64(await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })));
  },
};

export async function readEvidenceSource(input: EvidenceSourceInput): Promise<Uint8Array> {
  const uri = input.localUri;
  if (!uri) throw new Error('Select the original file before saving an attachment.');
  if (Platform.OS === 'web') {
    if (!uri.startsWith('blob:') && !uri.startsWith('data:')) throw new Error('Only files selected on this device can be attached.');
    if (uri.startsWith('data:') && uri.length > Math.ceil(MAX_EVIDENCE_BYTES * 4 / 3) + 1024) {
      throw new Error('This file exceeds the 25 MiB attachment limit.');
    }
    const response = await fetch(uri);
    if (!response.ok) throw new Error('The selected file is no longer available. Select it again.');
    const blob = await response.blob();
    validateEvidenceSize(blob.size);
    return new Uint8Array(await blob.arrayBuffer());
  }
  if (!/^(file|content|ph):/.test(uri)) throw new Error('Only files selected on this device can be attached.');
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) throw new Error('The selected file is no longer available. Select it again.');
  if ('size' in info) validateEvidenceSize(info.size);
  return decodeBase64(await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }));
}

export async function clearAccountEvidence(ownerId: string): Promise<void> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ownerId)) {
    throw new Error('A valid account is required to clear device evidence.');
  }
  if (Platform.OS === 'web') {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE, 'readwrite');
      transaction.objectStore(OBJECT_STORE).delete(IDBKeyRange.bound(`${ownerId}/`, `${ownerId}/\uffff`));
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(new Error('Device evidence could not be cleared.'));
      transaction.onerror = () => { /* handled after transaction abort */ };
    });
    return;
  }
  if (!FileSystem.documentDirectory) throw new Error('Device document storage is unavailable.');
  if (Array.from(nativeWrites).some((key) => key.startsWith(`${ownerId}/`))) {
    throw new Error('Wait for the current attachment to finish saving before clearing device data.');
  }
  await FileSystem.deleteAsync(`${FileSystem.documentDirectory}family-bench/evidence/${ownerId}/`, { idempotent: true });
}

/** Only delete app-generated cache copies. User gallery/provider originals are never removed. */
export async function cleanupEvidenceSource(input: { localUri?: string | null }): Promise<void> {
  if (Platform.OS === 'web' || !input.localUri || !FileSystem.cacheDirectory) return;
  if (!isAppCacheSource(input.localUri, FileSystem.cacheDirectory)) return;
  try {
    const info = await FileSystem.getInfoAsync(input.localUri);
    if (!info.exists || info.isDirectory) return;
    await FileSystem.deleteAsync(input.localUri, { idempotent: true });
  } catch { throw new Error('The temporary app-cache copy could not be removed. Retry cleanup before leaving this device.'); }
}
