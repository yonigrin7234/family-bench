import type { EvidenceAttachment } from '../case-intelligence/types';

export type EvidenceCheckResult = { attachmentId: string; entryId: string | null; fileName: string; status: 'verified' | 'failed'; message: string };
export type EvidenceCheckReport = { checkedAt: string; results: EvidenceCheckResult[] };

/** readVerifiedOriginal must verify the immutable file's hash and local readback. */
export async function checkBriefcaseOriginals(attachments: EvidenceAttachment[], options: {
  readVerifiedOriginal: (attachment: EvidenceAttachment) => Promise<Uint8Array>;
  isCurrent: () => boolean;
  onProgress?: (completed: number, total: number) => void;
  now?: () => string;
}): Promise<EvidenceCheckReport | null> {
  const unique = [...new Map(attachments.map((attachment) => [attachment.id, attachment])).values()];
  const results: EvidenceCheckResult[] = [];
  for (const attachment of unique) {
    if (!options.isCurrent()) return null;
    try {
      const bytes = await options.readVerifiedOriginal(attachment);
      if (!options.isCurrent()) return null;
      if (!bytes.byteLength || bytes.byteLength !== attachment.file_size_bytes) throw new Error('The saved file size does not match the original.');
      results.push({ attachmentId: attachment.id, entryId: attachment.entry_id, fileName: attachment.file_name, status: 'verified', message: 'Original bytes verified and read from this device.' });
    } catch (error) {
      if (!options.isCurrent()) return null;
      results.push({ attachmentId: attachment.id, entryId: attachment.entry_id, fileName: attachment.file_name, status: 'failed', message: error instanceof Error ? error.message : 'The original could not be checked. Open its entry and try again.' });
    }
    options.onProgress?.(results.length, unique.length);
  }
  return options.isCurrent() ? { checkedAt: (options.now || (() => new Date().toISOString()))(), results } : null;
}
