import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { decodeBase64, encodeBase64 } from '../evidence/encoding';
import { localEncryptionAad, openWithNativeKey, packEnvelope, sealWithNativeKey, unpackEnvelope } from './envelope';

const KEY_DATABASE = 'family-bench-device-keys-v1';
const KEY_STORE = 'account-keys';
const nativeKeyQueues = new Map<string, Promise<void>>();
let keyDatabasePromise: Promise<IDBDatabase> | undefined;

function keyDatabase(): Promise<IDBDatabase> {
  if (!globalThis.indexedDB || !globalThis.crypto?.subtle) {
    return Promise.reject(new Error('Encrypted storage requires a secure browser with IndexedDB and Web Crypto enabled.'));
  }
  if (!keyDatabasePromise) {
    keyDatabasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(KEY_DATABASE, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(KEY_STORE);
      request.onerror = () => reject(new Error('Unable to open the device encryption key store.'));
      request.onblocked = () => reject(new Error('The device key store is blocked by another tab.'));
      request.onsuccess = () => {
        request.result.onversionchange = () => { request.result.close(); keyDatabasePromise = undefined; };
        resolve(request.result);
      };
    });
    keyDatabasePromise.catch(() => { keyDatabasePromise = undefined; });
  }
  return keyDatabasePromise;
}

async function webKey(ownerId: string, create: boolean): Promise<CryptoKey> {
  const database = await keyDatabase();
  // Generate outside the transaction. The read/create transaction chooses one winner across tabs.
  const candidate = create ? await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']) : null;
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(KEY_STORE, create ? 'readwrite' : 'readonly');
    const store = transaction.objectStore(KEY_STORE);
    const request = store.get(ownerId);
    let key: CryptoKey | undefined;
    request.onsuccess = () => {
      key = request.result;
      if (!key && candidate) { key = candidate; store.add(candidate, ownerId); }
    };
    transaction.oncomplete = () => {
      if (!key) { reject(new Error('The device encryption key is missing. Recover your synced data on a trusted device; this copy cannot be decrypted.')); return; }
      if (key.type !== 'secret' || key.extractable || key.algorithm.name !== 'AES-GCM' || (key.algorithm as AesKeyAlgorithm).length !== 256) {
        reject(new Error('The device encryption key is invalid.')); return;
      }
      resolve(key);
    };
    transaction.onabort = () => reject(new Error('The device encryption key could not be saved or read.'));
    transaction.onerror = () => { /* onabort handles failures after the transaction settles. */ };
  });
}

async function nativeKey(ownerId: string, create: boolean): Promise<Uint8Array> {
  const previous = nativeKeyQueues.get(ownerId) ?? Promise.resolve();
  const operation = previous.then(async () => {
    const storageKey = `family-bench.local-key.v1.${ownerId}`;
    const saved = await SecureStore.getItemAsync(storageKey);
    if (saved) {
      const bytes = decodeBase64(saved);
      if (bytes.length !== 32) throw new Error('The device encryption key is invalid.');
      return bytes;
    }
    if (!create) throw new Error('The device encryption key is missing. This copy cannot be decrypted.');
    const bytes = await Crypto.getRandomBytesAsync(32);
    await SecureStore.setItemAsync(storageKey, encodeBase64(bytes), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    return bytes;
  });
  const tail = operation.then(() => undefined, () => undefined);
  nativeKeyQueues.set(ownerId, tail);
  try { return await operation; } finally { if (nativeKeyQueues.get(ownerId) === tail) nativeKeyQueues.delete(ownerId); }
}

/** AES-256-GCM, with the account identity authenticated and a fresh 96-bit nonce per write. */
export async function sealLocalBytes(ownerId: string, plaintext: Uint8Array): Promise<Uint8Array> {
  const aad = localEncryptionAad(ownerId);
  const nonce = await Crypto.getRandomBytesAsync(12);
  if (Platform.OS === 'web') {
    const key = await webKey(ownerId, true);
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: new Uint8Array(nonce), additionalData: new Uint8Array(aad), tagLength: 128 }, key, new Uint8Array(plaintext));
    return packEnvelope(nonce, new Uint8Array(ciphertext));
  }
  const key = await nativeKey(ownerId, true);
  try { return sealWithNativeKey(ownerId, plaintext, key, nonce); } finally { key.fill(0); }
}

/** Never creates a replacement key. Missing keys and tampered ciphertext are explicit errors. */
export async function openLocalBytes(ownerId: string, envelope: Uint8Array): Promise<Uint8Array> {
  const aad = localEncryptionAad(ownerId);
  const { nonce, ciphertext } = unpackEnvelope(envelope);
  if (Platform.OS === 'web') {
    const key = await webKey(ownerId, false);
    try {
      const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(nonce), additionalData: new Uint8Array(aad), tagLength: 128 }, key, new Uint8Array(ciphertext));
      return new Uint8Array(plaintext);
    } catch { throw new Error('Encrypted data could not be authenticated. The account, key, or stored data does not match.'); }
  }
  const key = await nativeKey(ownerId, false);
  try { return openWithNativeKey(ownerId, envelope, key); } finally { key.fill(0); }
}
