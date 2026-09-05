import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, webcrypto } from 'node:crypto';
import { localEncryptionAad, openWithNativeKey, packEnvelope, sealWithNativeKey, unpackEnvelope } from '../envelope';

const owner = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const plaintext = new TextEncoder().encode('Private case notes and original evidence');

test('AES-GCM local envelope round trips without plaintext disclosure', () => {
  const key = randomBytes(32);
  const encrypted = sealWithNativeKey(owner, plaintext, key, randomBytes(12));
  assert.deepEqual(openWithNativeKey(owner, encrypted, key), plaintext);
  assert.equal(Buffer.from(encrypted).includes(Buffer.from(plaintext)), false);
});

test('ciphertext, nonce, tag, key and account tampering all reject', () => {
  const key = randomBytes(32);
  const encrypted = sealWithNativeKey(owner, plaintext, key, randomBytes(12));
  for (const index of [6, 18, encrypted.length - 1]) {
    const tampered = encrypted.slice(); tampered[index] ^= 1;
    assert.throws(() => openWithNativeKey(owner, tampered, key), /authenticated/);
  }
  assert.throws(() => openWithNativeKey(other, encrypted, key), /authenticated/);
  assert.throws(() => openWithNativeKey(owner, encrypted, randomBytes(32)), /authenticated/);
  assert.throws(() => unpackEnvelope(plaintext), /Unrecognized/);
  assert.throws(() => unpackEnvelope(encrypted.slice(0, 20)), /Unrecognized/);
});

test('distinct nonces yield distinct ciphertext and unsupported envelope versions reject', () => {
  const key = randomBytes(32);
  const first = sealWithNativeKey(owner, plaintext, key, randomBytes(12));
  const second = sealWithNativeKey(owner, plaintext, key, randomBytes(12));
  assert.notDeepEqual(first, second);
  const unknown = first.slice(); unknown[5] = 2;
  assert.throws(() => openWithNativeKey(owner, unknown, key), /Unrecognized/);
});

test('native noble cipher and Web Crypto use interoperable AES-256-GCM bytes and AAD', async () => {
  const key = randomBytes(32);
  const webKey = await webcrypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt', 'decrypt']);
  const nativeEnvelope = sealWithNativeKey(owner, plaintext, key, randomBytes(12));
  const { nonce, ciphertext } = unpackEnvelope(nativeEnvelope);
  const decoded = await webcrypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(nonce), additionalData: new Uint8Array(localEncryptionAad(owner)), tagLength: 128 }, webKey, new Uint8Array(ciphertext));
  assert.deepEqual(new Uint8Array(decoded), plaintext);
  const webNonce = randomBytes(12);
  const webEncrypted = await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv: webNonce, additionalData: new Uint8Array(localEncryptionAad(owner)), tagLength: 128 }, webKey, plaintext);
  assert.deepEqual(openWithNativeKey(owner, packEnvelope(webNonce, new Uint8Array(webEncrypted)), key), plaintext);
});
