import type { AttachmentKind, EvidenceAttachment } from '../case-intelligence/types';
import type { Json } from '../supabase/database.types';

export const EVIDENCE_BUCKET = 'evidence-originals';
export const MAX_EVIDENCE_BYTES = 25 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/;

export type EvidenceSourceInput = {
  entryId: string;
  attachmentId?: string;
  kind: AttachmentKind;
  filename: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  durationMs?: number | null;
  localUri?: string | null;
  localReference?: string | null;
  sourceLabel?: string | null;
  capturedAt?: string | null;
  sourceMetadata?: Json | null;
};

export type EvidenceIdentity = {
  ownerId: string;
  caseId: string;
  entryId: string;
  attachmentId: string;
};

export type EvidenceLocalStore = {
  /** This must reject on quota, permissions, or transaction failure. Never overwrite. */
  write: (key: string, bytes: Uint8Array) => Promise<void>;
  read: (key: string) => Promise<Uint8Array | null>;
};

export type EvidenceHasher = (bytes: Uint8Array) => Promise<string>;

export function evidencePath(identity: EvidenceIdentity): string {
  const segments = [identity.ownerId, identity.caseId, identity.entryId, identity.attachmentId];
  if (segments.some((segment) => !UUID.test(segment))) {
    throw new Error('Evidence must belong to a signed-in account and a saved case and entry.');
  }
  return `${segments.join('/')}/original`;
}

export function validateEvidenceSize(size: number): void {
  if (!Number.isSafeInteger(size) || size <= 0) throw new Error('The selected file is empty or unreadable.');
  if (size > MAX_EVIDENCE_BYTES) throw new Error('This file exceeds the 25 MiB attachment limit. Select a smaller original.');
}

export function attachmentIdentity(attachment: EvidenceAttachment, ownerId: string): EvidenceIdentity {
  if (!ownerId || attachment.user_id !== ownerId) {
    throw new Error('This evidence belongs to a different account.');
  }
  const identity = {
    ownerId,
    caseId: attachment.case_id ?? '',
    entryId: attachment.entry_id ?? '',
    attachmentId: attachment.id,
  };
  const path = evidencePath(identity);
  if (attachment.storage_bucket !== EVIDENCE_BUCKET || attachment.storage_path !== path) {
    throw new Error('The original evidence is unavailable or has an invalid ownership path. Select the original file again.');
  }
  if (attachment.hash_algorithm !== 'sha256' || !SHA256.test(attachment.file_hash ?? '')) {
    throw new Error('This attachment has no verified original-file hash. Select the original file again.');
  }
  return identity;
}

export async function verifyEvidenceBytes(
  bytes: Uint8Array,
  attachment: Pick<EvidenceAttachment, 'file_size_bytes' | 'file_hash'>,
  hash: EvidenceHasher,
): Promise<void> {
  validateEvidenceSize(bytes.byteLength);
  if (bytes.byteLength !== attachment.file_size_bytes || await hash(bytes) !== attachment.file_hash) {
    throw new Error('Evidence integrity check failed. The original bytes do not match the saved SHA-256 and size.');
  }
}

export function evidenceMetadata(attachment: EvidenceAttachment): Record<string, unknown> {
  return attachment.exif && typeof attachment.exif === 'object' && !Array.isArray(attachment.exif)
    ? attachment.exif : {};
}

export async function preserveOriginal(
  options: {
    input: EvidenceSourceInput;
    entry: { id: string; case_id: string | null; user_id: string };
    ownerId: string;
    attachmentId: string;
    now: string;
  },
  dependencies: {
    readSource: (input: EvidenceSourceInput) => Promise<Uint8Array>;
    hash: EvidenceHasher;
    local: EvidenceLocalStore;
  },
): Promise<EvidenceAttachment> {
  const { input, entry, ownerId, attachmentId, now } = options;
  if (entry.user_id !== ownerId || input.entryId !== entry.id) {
    throw new Error('The selected entry does not belong to the current account.');
  }
  const key = evidencePath({ ownerId, caseId: entry.case_id ?? '', entryId: entry.id, attachmentId });
  if (input.fileSizeBytes != null) validateEvidenceSize(input.fileSizeBytes);
  if (!input.filename.trim()) throw new Error('The selected file has no name.');
  const bytes = await dependencies.readSource(input);
  validateEvidenceSize(bytes.byteLength);
  const digest = await dependencies.hash(bytes);
  if (!SHA256.test(digest)) throw new Error('Unable to compute a SHA-256 hash. The attachment was not saved.');
  // File names are display/export labels, never part of an object or filesystem path.
  const filename = input.filename.replace(/[\x00-\x1f\x7f/\\]/g, '_').slice(0, 255);
  const attachment: EvidenceAttachment = {
    id: attachmentId,
    user_id: ownerId,
    case_id: entry.case_id,
    entry_id: entry.id,
    file_name: filename,
    file_type: input.kind === 'voice_memo' ? 'audio' : input.kind === 'document' ? 'document' : 'image',
    mime_type: input.mimeType?.trim() || 'application/octet-stream',
    file_size_bytes: bytes.byteLength,
    storage_bucket: EVIDENCE_BUCKET,
    storage_path: key,
    thumbnail_path: null,
    description: 'Original file preserved without modification and verified with SHA-256.',
    is_receipt: false,
    file_hash: digest,
    hash_algorithm: 'sha256',
    captured_at: input.capturedAt && Number.isFinite(Date.parse(input.capturedAt)) ? new Date(input.capturedAt).toISOString() : null,
    source_device: input.sourceLabel?.trim() || 'File selection',
    exif: {
      attachment_kind: input.kind,
      source_label: input.sourceLabel?.trim() || 'File selection',
      selected_at: now,
      source_metadata: input.sourceMetadata ?? null,
      duration_ms: input.durationMs ?? null,
      local_evidence_key: key,
      storage_status: 'local_verified',
      hash_status: 'verified',
      original_evidence_preserved: true,
    },
    created_at: now,
    deleted_at: null,
  };
  const existing = await dependencies.local.read(key);
  if (existing) {
    await verifyEvidenceBytes(existing, attachment, dependencies.hash);
    return attachment;
  }
  try {
    await dependencies.local.write(key, bytes);
  } catch (error) {
    const concurrent = await dependencies.local.read(key);
    if (!concurrent) throw error;
    await verifyEvidenceBytes(concurrent, attachment, dependencies.hash);
  }
  const stored = await dependencies.local.read(key);
  if (!stored) throw new Error('The original could not be read after saving. The attachment was not accepted.');
  await verifyEvidenceBytes(stored, attachment, dependencies.hash);
  return attachment;
}

export type EvidenceRemoteStore = {
  upload: (path: string, bytes: Uint8Array, mimeType: string) => Promise<void>;
  download: (path: string) => Promise<Uint8Array>;
};

/** An ambiguous/retried upload is successful only when the server returns identical bytes. */
export async function uploadAndVerifyOriginal(
  attachment: EvidenceAttachment,
  ownerId: string,
  bytes: Uint8Array,
  hash: EvidenceHasher,
  remote: EvidenceRemoteStore,
): Promise<void> {
  attachmentIdentity(attachment, ownerId);
  await verifyEvidenceBytes(bytes, attachment, hash);
  let uploadError: unknown;
  try {
    await remote.upload(attachment.storage_path, bytes, attachment.mime_type || 'application/octet-stream');
  } catch (error) {
    uploadError = error;
  }
  let downloaded: Uint8Array;
  try {
    downloaded = await remote.download(attachment.storage_path);
  } catch (error) {
    throw uploadError ?? error;
  }
  await verifyEvidenceBytes(downloaded, attachment, hash);
}
