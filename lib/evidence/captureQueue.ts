import type { EvidenceSourceInput } from './core';

export type StagedAttachment = Omit<EvidenceSourceInput, 'entryId'> & { attachmentId: string };

/** Keep completed IDs across retries, so a later file failure cannot duplicate earlier originals. */
export async function savePendingCaptureAttachments({
  entryId, attachments, completedIds, save,
}: {
  entryId: string;
  attachments: readonly StagedAttachment[];
  completedIds: Set<string>;
  save: (input: EvidenceSourceInput & { attachmentId: string }) => Promise<unknown>;
}): Promise<void> {
  for (const attachment of attachments) {
    if (completedIds.has(attachment.attachmentId)) continue;
    await save({ ...attachment, entryId });
    completedIds.add(attachment.attachmentId);
  }
}
