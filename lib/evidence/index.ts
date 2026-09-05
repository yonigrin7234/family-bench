import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { supabase } from '../supabase/client';
import { getWorkspaceOwnerId } from '../auth/session';
import type { EvidenceAttachment } from '../case-intelligence/types';
import {
  attachmentIdentity, EVIDENCE_BUCKET, evidenceMetadata, preserveOriginal,
  uploadAndVerifyOriginal, verifyEvidenceBytes,
  type EvidenceSourceInput, type EvidenceRemoteStore,
} from './core';
import { localEvidenceStore, readEvidenceSource, clearAccountEvidence } from './local';
import { decodeBase64, encodeBase64 } from './encoding';

export { MAX_EVIDENCE_BYTES, EVIDENCE_BUCKET } from './core';
export { cleanupEvidenceSource } from './local';
export type { EvidenceSourceInput } from './core';

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, new Uint8Array(bytes));
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
}

function currentOwner(expectedOwnerId?: string): string {
  const activeOwnerId = getWorkspaceOwnerId();
  if (expectedOwnerId && activeOwnerId !== expectedOwnerId) throw new Error('This evidence belongs to a different account.');
  return activeOwnerId;
}

async function authenticatedOwner(expectedOwnerId?: string): Promise<string> {
  const activeOwnerId = currentOwner(expectedOwnerId);
  if (!supabase) throw new Error('Sign in before accessing personal evidence.');
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new Error('Your session has ended. Sign in to access evidence.');
  if (session.user.id !== activeOwnerId || getWorkspaceOwnerId() !== activeOwnerId) throw new Error('Your account changed. Reopen the case before accessing its evidence.');
  return session.user.id;
}

async function bytesFromBlob(blob: Blob): Promise<Uint8Array> {
  if (typeof blob.arrayBuffer === 'function') return new Uint8Array(await blob.arrayBuffer());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The downloaded original could not be read.'));
    reader.onload = () => {
      try { resolve(decodeBase64(String(reader.result).split(',')[1] ?? '')); } catch (error) { reject(error); }
    };
    reader.readAsDataURL(blob);
  });
}

function remoteStore(): EvidenceRemoteStore {
  if (!supabase) throw new Error('Cloud evidence storage is unavailable.');
  const bucket = supabase.storage.from(EVIDENCE_BUCKET);
  return {
    async upload(path, bytes, mimeType) {
      // ArrayBuffer also works with React Native, where Blob/FormData uploads are unreliable.
      const { error } = await bucket.upload(path, new Uint8Array(bytes).buffer, { contentType: mimeType, upsert: false });
      if (error) throw new Error(`Original upload failed: ${error.message}`);
    },
    async download(path) {
      const { data, error } = await bucket.download(path);
      if (error || !data) throw new Error(`Original download failed: ${error?.message ?? 'file unavailable'}`);
      return bytesFromBlob(data);
    },
  };
}

export async function preserveEvidenceOriginal(options: {
  input: EvidenceSourceInput;
  entry: { id: string; case_id: string | null; user_id: string };
  ownerId: string;
  attachmentId?: string;
}): Promise<EvidenceAttachment> {
  currentOwner(options.ownerId);
  const attachment = await preserveOriginal({ ...options, attachmentId: options.attachmentId ?? options.input.attachmentId ?? Crypto.randomUUID(), now: new Date().toISOString() }, {
    readSource: readEvidenceSource,
    hash: sha256,
    local: localEvidenceStore,
  });
  currentOwner(options.ownerId);
  return attachment;
}

export async function uploadEvidenceOriginal(attachment: EvidenceAttachment, ownerId: string): Promise<EvidenceAttachment> {
  await authenticatedOwner(ownerId);
  attachmentIdentity(attachment, ownerId);
  if (attachment.deleted_at) throw new Error('Deleted evidence cannot be uploaded.');
  if (!supabase) throw new Error('Cloud evidence storage is unavailable.');
  // Refuse orphan/cross-case attachments before touching Storage; RLS remains the server boundary.
  const { data: entry, error } = await supabase.from('entries').select('id, case_id, user_id')
    .eq('id', attachment.entry_id!).eq('user_id', ownerId).eq('case_id', attachment.case_id!).is('deleted_at', null).maybeSingle();
  if (error || !entry) throw new Error('Save this entry to your account before uploading its evidence.');
  const bytes = await localEvidenceStore.read(attachment.storage_path);
  if (!bytes) throw new Error('The local original is missing. Select the original file again.');
  currentOwner(ownerId);
  await uploadAndVerifyOriginal(attachment, ownerId, bytes, sha256, remoteStore());
  await authenticatedOwner(ownerId);
  const metadata = evidenceMetadata(attachment);
  return {
    ...attachment,
    exif: {
      ...metadata,
      storage_status: 'remote_verified',
      remote_verified_at: typeof metadata.remote_verified_at === 'string' ? metadata.remote_verified_at : new Date().toISOString(),
    } as EvidenceAttachment['exif'],
  };
}

export async function getEvidenceBytes(attachment: EvidenceAttachment, expectedOwnerId?: string): Promise<Uint8Array> {
  const ownerId = currentOwner(expectedOwnerId);
  attachmentIdentity(attachment, ownerId);
  if (attachment.deleted_at) throw new Error('This evidence has been deleted.');
  const local = await localEvidenceStore.read(attachment.storage_path);
  if (local) {
    await verifyEvidenceBytes(local, attachment, sha256);
    currentOwner(ownerId);
    return local;
  }
  await authenticatedOwner(ownerId);
  const bytes = await remoteStore().download(attachment.storage_path);
  await verifyEvidenceBytes(bytes, attachment, sha256);
  currentOwner(ownerId);
  // Cache verified bytes for reopening offline. A failed cache write must remain visible.
  try {
    await localEvidenceStore.write(attachment.storage_path, bytes);
  } catch (error) {
    // Concurrent readers can race to cache the same immutable original. Accept only identical bytes.
    const concurrent = await localEvidenceStore.read(attachment.storage_path);
    if (!concurrent) throw error;
    await verifyEvidenceBytes(concurrent, attachment, sha256);
  }
  const cached = await localEvidenceStore.read(attachment.storage_path);
  if (!cached) throw new Error('The downloaded original could not be saved on this device.');
  await verifyEvidenceBytes(cached, attachment, sha256);
  currentOwner(ownerId);
  return bytes;
}

export const getEvidenceAttachmentBytes = getEvidenceBytes;

export async function clearLocalEvidence(ownerId: string): Promise<void> {
  currentOwner(ownerId);
  await clearAccountEvidence(ownerId);
}

export async function resolveEvidenceUri(attachment: EvidenceAttachment, ownerId?: string): Promise<{ uri: string; release: () => void }> {
  const bytes = await getEvidenceBytes(attachment, ownerId);
  if (Platform.OS !== 'web') return { uri: `data:${attachment.mime_type || 'application/octet-stream'};base64,${encodeBase64(bytes)}`, release: () => undefined };
  const uri = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: attachment.mime_type || 'application/octet-stream' }));
  return { uri, release: () => URL.revokeObjectURL(uri) };
}
