import type { Entry, EvidenceAttachment } from '../case-intelligence/types';
import type { CaptureEntryInput } from '../case-intelligence/useCaseIntelligence';
import type { EvidenceSourceInput } from '../evidence/core';
import { importProvenance, provenanceFor, sourceEntryInput, importedEntryInput, findImportedDuplicate, type CsvImportPlan, type ImportHasher } from './plan';

export type CsvImportProgress = { phase: 'source' | 'rows' | 'complete'; processed: number; created: number; existing: number; repeated: number; total: number; sourceEntrySaved: boolean; sourceOriginalSaved: boolean; lastEntryId: string | null };
export class CsvImportStopped extends Error {
  constructor(message: string, public progress: CsvImportProgress) { super(message); this.name = 'CsvImportStopped'; }
}
export type CsvImportPorts = {
  assertCurrent: () => void;
  entries: () => Entry[];
  attachments: () => EvidenceAttachment[];
  saveEntry: (input: CaptureEntryInput) => Promise<{ entry: Entry }>;
  saveAttachment: (input: EvidenceSourceInput) => Promise<{ attachment: EvidenceAttachment }>;
  flush: () => Promise<void>;
  readOriginal: (attachment: EvidenceAttachment) => Promise<Uint8Array>;
  /** A frozen copy of the reviewed bytes, not a mutable external provider URI. */
  source: EvidenceSourceInput;
  hash: ImportHasher;
  onProgress?: (progress: CsvImportProgress) => void;
};
export async function runCsvImport(plan: CsvImportPlan, ports: CsvImportPorts): Promise<CsvImportProgress> {
  const progress: CsvImportProgress = { phase: 'source', processed: 0, created: 0, existing: 0, repeated: 0, total: plan.rows.length, sourceEntrySaved: false, sourceOriginalSaved: false, lastEntryId: null };
  const notify = () => { ports.assertCurrent(); ports.onProgress?.({ ...progress }); };
  let durableEntries: Entry[] | null = null;
  const flush = async () => { ports.assertCurrent(); await ports.flush(); ports.assertCurrent(); durableEntries = ports.entries(); };
  try {
    ports.assertCurrent();
    // Preflight every identity before preserving any source record or importing data.
    for (const row of plan.rows) findImportedDuplicate(ports.entries(), plan, row);
    const oldSource = ports.entries().find((entry) => entry.id === plan.sourceEntryId);
    if (oldSource) {
      if (oldSource.user_id !== plan.scope.ownerId || oldSource.case_id !== plan.scope.caseId || oldSource.child_id !== plan.scope.childId || oldSource.deleted_at
        || JSON.stringify(importProvenance(oldSource)) !== JSON.stringify(provenanceFor(plan))) throw new Error('The existing CSV source does not match this import.');
      await flush();
    } else {
      await ports.saveEntry(sourceEntryInput(plan)); ports.assertCurrent(); durableEntries = ports.entries();
    }
    progress.sourceEntrySaved = true; notify();
    let attachment = ports.attachments().find((row) => row.id === plan.sourceAttachmentId);
    if (!attachment) {
      const saved = await ports.saveAttachment({ ...ports.source, entryId: plan.sourceEntryId, attachmentId: plan.sourceAttachmentId }); ports.assertCurrent();
      attachment = saved.attachment;
    } else await flush();
    if (attachment.user_id !== plan.scope.ownerId || attachment.case_id !== plan.scope.caseId || attachment.entry_id !== plan.sourceEntryId || attachment.deleted_at || attachment.file_hash !== plan.fileHash || attachment.file_size_bytes !== plan.byteLength) throw new Error('The preserved original does not match the reviewed CSV. Import stopped before adding rows.');
    const original = await ports.readOriginal(attachment); ports.assertCurrent();
    const digest = await ports.hash(original); ports.assertCurrent();
    if (digest !== plan.fileHash || original.length !== plan.byteLength) throw new Error('The CSV source bytes changed. Import stopped before adding rows.');
    progress.sourceOriginalSaved = true; progress.phase = 'rows'; notify();
    for (const row of plan.rows) {
      ports.assertCurrent();
      if (row.repeatedRow !== null) progress.repeated++;
      else {
        const duplicate = findImportedDuplicate(ports.entries(), plan, row);
        if (duplicate) {
          if (durableEntries !== ports.entries()) await flush();
          progress.existing++; progress.lastEntryId = duplicate.id;
        } else {
          const saved = await ports.saveEntry(importedEntryInput(plan, row)); ports.assertCurrent();
          durableEntries = ports.entries(); progress.created++; progress.lastEntryId = saved.entry.id;
        }
      }
      progress.processed++; notify();
    }
    progress.phase = 'complete'; notify(); return progress;
  } catch (failure) { throw new CsvImportStopped(failure instanceof Error ? failure.message : 'The CSV import stopped. Retry with the same file and scope.', { ...progress }); }
}
