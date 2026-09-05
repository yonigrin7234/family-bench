import { gcm } from '@noble/ciphers/aes.js';

const MAGIC = new Uint8Array([70, 66, 69, 78, 67, 1]); // FBENC + format version 1
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

export function localEncryptionAad(ownerId: string): Uint8Array {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ownerId)) {
    throw new Error('A valid signed-in account is required for encrypted storage.');
  }
  return new TextEncoder().encode(`family-bench/local/aes-256-gcm/v1/${ownerId}`);
}

export function packEnvelope(nonce: Uint8Array, ciphertext: Uint8Array): Uint8Array {
  if (nonce.length !== NONCE_BYTES || ciphertext.length < TAG_BYTES) throw new Error('Invalid encrypted storage envelope.');
  const envelope = new Uint8Array(MAGIC.length + nonce.length + ciphertext.length);
  envelope.set(MAGIC);
  envelope.set(nonce, MAGIC.length);
  envelope.set(ciphertext, MAGIC.length + nonce.length);
  return envelope;
}

export function unpackEnvelope(envelope: Uint8Array): { nonce: Uint8Array; ciphertext: Uint8Array } {
  if (envelope.length < MAGIC.length + NONCE_BYTES + TAG_BYTES || MAGIC.some((value, i) => envelope[i] !== value)) {
    throw new Error('Unrecognized encrypted data. Legacy plaintext cannot be opened as an account workspace.');
  }
  return { nonce: envelope.slice(MAGIC.length, MAGIC.length + NONCE_BYTES), ciphertext: envelope.slice(MAGIC.length + NONCE_BYTES) };
}

export function sealWithNativeKey(ownerId: string, plaintext: Uint8Array, key: Uint8Array, nonce: Uint8Array): Uint8Array {
  if (key.length !== 32) throw new Error('Invalid local encryption key.');
  return packEnvelope(nonce, gcm(key, nonce, localEncryptionAad(ownerId)).encrypt(plaintext));
}

export function openWithNativeKey(ownerId: string, envelope: Uint8Array, key: Uint8Array): Uint8Array {
  if (key.length !== 32) throw new Error('Invalid local encryption key.');
  const { nonce, ciphertext } = unpackEnvelope(envelope);
  try {
    return gcm(key, nonce, localEncryptionAad(ownerId)).decrypt(ciphertext);
  } catch {
    throw new Error('Encrypted data could not be authenticated. The account, key, or stored data does not match.');
  }
}
