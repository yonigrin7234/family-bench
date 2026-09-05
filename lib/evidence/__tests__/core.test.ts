import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  MAX_EVIDENCE_BYTES, attachmentIdentity, evidencePath, preserveOriginal,
  uploadAndVerifyOriginal, verifyEvidenceBytes, type EvidenceLocalStore,
} from '../core';
import { decodeBase64, encodeBase64 } from '../encoding';

const ownerId = '11111111-1111-4111-8111-111111111111';
const caseId = '22222222-2222-4222-8222-222222222222';
const entryId = '33333333-3333-4333-8333-333333333333';
const attachmentId = '44444444-4444-4444-8444-444444444444';
const source = new Uint8Array([0, 1, 2, 127, 128, 254, 255]);
const hash = async (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');
const options = {
  input: { entryId, kind: 'document' as const, filename: 'original.pdf', mimeType: 'application/pdf', localUri: 'blob:temporary' },
  entry: { id: entryId, user_id: ownerId, case_id: caseId },
  ownerId, attachmentId, now: '2026-09-05T00:00:00.000Z',
};

function localStore(): EvidenceLocalStore {
  const rows = new Map<string, Uint8Array>();
  return {
    async write(key, bytes) { if (rows.has(key)) throw new Error('Already exists'); rows.set(key, bytes.slice()); },
    async read(key) { return rows.get(key)?.slice() ?? null; },
  };
}

async function preserved(local = localStore()) {
  return preserveOriginal(options, { readSource: async () => source, hash, local });
}

test('accepted attachment has persisted identical bytes, actual raw-byte SHA256, and stable identity', async () => {
  const local = localStore();
  const attachment = await preserved(local);
  assert.deepEqual(await local.read(attachment.storage_path), source);
  assert.equal(attachment.file_hash, await hash(source));
  assert.equal(attachment.hash_algorithm, 'sha256');
  assert.equal(attachment.file_size_bytes, source.length);
  assert.equal(attachment.storage_path, `${ownerId}/${caseId}/${entryId}/${attachmentId}/original`);
  assert.doesNotMatch(JSON.stringify(attachment), /blob:|sha256-placeholder|local_uri/);
});

test('failed durable writes reject the attachment save', async () => {
  await assert.rejects(preserved({ write: async () => { throw new Error('Quota exceeded'); }, read: async () => null }), /Quota exceeded/);
});

test('lost or corrupted readback rejects instead of marking evidence preserved', async () => {
  await assert.rejects(preserved({ write: async () => {}, read: async () => null }), /could not be read/);
  await assert.rejects(preserved({ write: async () => {}, read: async () => new Uint8Array([0, 2, 2, 127, 128, 254, 255]) }), /integrity check failed/);
});

test('hashing failure occurs before any durable write', async () => {
  let writes = 0;
  await assert.rejects(preserveOriginal(options, { readSource: async () => source, hash: async () => 'hash-unavailable', local: {
    write: async () => { writes++; }, read: async () => source,
  } }), /compute a SHA-256/);
  assert.equal(writes, 0);
});

test('empty and oversized originals are rejected, including false picker metadata', async () => {
  for (const bytes of [new Uint8Array(), new Uint8Array(MAX_EVIDENCE_BYTES + 1)]) {
    await assert.rejects(preserveOriginal({ ...options, input: { ...options.input, fileSizeBytes: 1 } }, {
      readSource: async () => bytes, hash, local: localStore(),
    }), /empty|25 MiB/);
  }
});

test('cross-owner, cross-entry and path traversal cannot enter evidence storage', async () => {
  await assert.rejects(preserveOriginal({ ...options, ownerId: caseId }, { readSource: async () => source, hash, local: localStore() }), /current account/);
  await assert.rejects(preserveOriginal({ ...options, input: { ...options.input, entryId: caseId } }, { readSource: async () => source, hash, local: localStore() }), /current account/);
  assert.throws(() => evidencePath({ ownerId, caseId, entryId, attachmentId: '../escape' }), /saved case/);
  const attachment = await preserved();
  assert.throws(() => attachmentIdentity(attachment, caseId), /different account/);
  assert.throws(() => attachmentIdentity({ ...attachment, storage_path: `${caseId}/${caseId}/${entryId}/${attachmentId}/original` }, ownerId), /ownership path/);
});

test('original files cannot be replaced, and retrying identical bytes reuses the same identity', async () => {
  const local = localStore();
  await preserved(local);
  assert.equal((await preserved(local)).id, attachmentId);
  await assert.rejects(preserveOriginal(options, { readSource: async () => new Uint8Array(source.length), hash, local }), /integrity check failed/);
});

test('upload requires identical authenticated download before reporting completion', async () => {
  const attachment = await preserved();
  const events: string[] = [];
  await uploadAndVerifyOriginal(attachment, ownerId, source, hash, {
    upload: async () => { events.push('upload'); },
    download: async () => { events.push('download'); return source.slice(); },
  });
  assert.deepEqual(events, ['upload', 'download']);
  await assert.rejects(uploadAndVerifyOriginal(attachment, ownerId, source, hash, {
    upload: async () => {}, download: async () => new Uint8Array([1]),
  }), /integrity check failed/);
});

test('ambiguous upload retry accepts an existing identical original without overwriting', async () => {
  const attachment = await preserved();
  await uploadAndVerifyOriginal(attachment, ownerId, source, hash, {
    upload: async () => { throw new Error('Already exists'); }, download: async () => source.slice(),
  });
  await assert.rejects(uploadAndVerifyOriginal(attachment, ownerId, source, hash, {
    upload: async () => { throw new Error('Network unavailable'); }, download: async () => { throw new Error('Missing'); },
  }), /Network unavailable/);
});

test('corrupted originals and legacy placeholder hashes never qualify for export', async () => {
  const attachment = await preserved();
  assert.throws(() => attachmentIdentity({ ...attachment, file_hash: 'placeholder:123' }, ownerId), /verified original-file hash/);
  await assert.rejects(verifyEvidenceBytes(new Uint8Array(source.length), attachment, hash), /integrity check failed/);
});

test('native byte encoding matches standard base64 across padding and chunk boundaries', () => {
  for (const size of [0, 1, 2, 3, 4, 32767, 32768, 32769, 100003]) {
    const bytes = Uint8Array.from({ length: size }, (_, i) => i % 256);
    const encoded = encodeBase64(bytes);
    assert.equal(encoded, Buffer.from(bytes).toString('base64'));
    assert.deepEqual(decodeBase64(encoded), bytes);
  }
  assert.throws(() => decodeBase64('%%%='), /Unreadable/);
});
