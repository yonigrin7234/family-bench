import type { Entry, EvidenceAttachment } from '../case-intelligence/types';

export type TimelineSelection = {
  caseId: string;
  caseTitle: string;
  entries: Entry[];
  attachments: EvidenceAttachment[];
  includedEntryIds: string[];
  fromDate?: string;
  toDate?: string;
  generatedAt?: string;
};

/** Explicit sharing schema. Never spread a database row into an export. */
export type SharedTimelineEntry = {
  reference: string;
  sourceEntryId: string;
  date: string;
  time: string | null;
  type: string;
  title: string;
  text: string;
  recordedAt: string;
  updatedAt: string;
  attachments: Array<{ reference: string; name: string; mimeType: string | null }>;
};

export type SharedTimeline = {
  format: 'family-bench-timeline-v1';
  title: string;
  generatedAt: string;
  fromDate: string | null;
  toDate: string | null;
  entries: SharedTimelineEntry[];
};

export function isPrivateEntry(entry: Entry): boolean {
  const metadata = entry.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return false;
  const provenance = metadata.import_provenance;
  return metadata.review_visibility === 'private' || Boolean(provenance && typeof provenance === 'object'
    && !Array.isArray(provenance) && provenance.kind === 'csv_source');
}

export function validateDateRange(fromDate?: string, toDate?: string): void {
  for (const value of [fromDate, toDate]) {
    if (!value) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00Z`))
      || new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) {
      throw new Error('Use a valid date in YYYY-MM-DD format.');
    }
  }
  if (fromDate && toDate && fromDate > toDate) {
    throw new Error('The start date must be on or before the end date.');
  }
}

export function inDateRange(entry: Entry, fromDate?: string, toDate?: string): boolean {
  return (!fromDate || entry.event_date >= fromDate) && (!toDate || entry.event_date <= toDate);
}

/** Remove path components and controls, including Windows paths, before displaying source names. */
export function publicFileName(value: string): string {
  return value.split(/[?#]/)[0].split(/[\\/]/).pop()?.replace(/[\u0000-\u001f\u007f]/g, '').trim() || 'Attachment';
}

export function selectedEntries(input: TimelineSelection): Entry[] {
  validateDateRange(input.fromDate, input.toDate);
  const ids = new Set(input.includedEntryIds);
  if (!ids.size) throw new Error('Select at least one entry to export.');
  const entries = input.entries.filter((entry) => ids.has(entry.id));
  if (entries.length !== ids.size) throw new Error('A selected entry is no longer available. Review your selection.');
  for (const entry of entries) {
    if (entry.deleted_at || entry.case_id !== input.caseId) {
      throw new Error('A selected entry is no longer available in this case. Review your selection.');
    }
    if (isPrivateEntry(entry)) throw new Error('Private entries cannot be included in a shared report.');
    if (!inDateRange(entry, input.fromDate, input.toDate)) {
      throw new Error('A selected entry is outside the date range. Review your selection.');
    }
    if (!/^[\w-]{1,160}$/.test(entry.id)) throw new Error('A selected entry has an invalid source reference.');
  }
  return entries.sort((a, b) => `${a.event_date}T${a.event_time || ''}`.localeCompare(`${b.event_date}T${b.event_time || ''}`)
    || a.id.localeCompare(b.id));
}

export function attachmentsForEntry(input: TimelineSelection, entry: Entry): EvidenceAttachment[] {
  const attachments = input.attachments.filter((attachment) => !attachment.deleted_at && attachment.entry_id === entry.id);
  if (attachments.some((attachment) => attachment.user_id !== entry.user_id || attachment.case_id !== input.caseId)) {
    throw new Error('An attachment does not belong to the selected case. Export was stopped.');
  }
  return attachments.sort((a, b) => a.id.localeCompare(b.id));
}

export function createSharedTimeline(input: TimelineSelection): SharedTimeline {
  return {
    format: 'family-bench-timeline-v1',
    title: input.caseTitle.trim() || 'Case timeline',
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    fromDate: input.fromDate || null,
    toDate: input.toDate || null,
    entries: selectedEntries(input).map((entry, index) => {
      const reference = `E${String(index + 1).padStart(3, '0')}`;
      return {
        reference,
        sourceEntryId: entry.id,
        date: entry.event_date,
        time: entry.event_time,
        type: entry.entry_type.replace(/_/g, ' '),
        title: entry.title?.trim() || 'Untitled entry',
        text: entry.body?.trim() || 'No factual text recorded.',
        recordedAt: entry.created_at,
        updatedAt: entry.updated_at,
        attachments: attachmentsForEntry(input, entry).map((attachment, attachmentIndex) => ({
          reference: `${reference}-A${String(attachmentIndex + 1).padStart(3, '0')}`,
          name: publicFileName(attachment.file_name),
          mimeType: attachment.mime_type,
        })),
      };
    }),
  };
}
