import type { CaseIntelligenceSnapshot, CourtOrder, Entry, EvidenceAttachment, LocalRecordMeta } from '../case-intelligence/types';
import { getEntryMetadata } from '../case-intelligence/review';

export function buildBriefcaseModel(snapshot: CaseIntelligenceSnapshot, ownerId: string | null | undefined, caseId: string | null | undefined) {
  const activeCase = snapshot.cases.find((row) => row.id === caseId && row.user_id === ownerId && !row.deleted_at) ?? null;
  const belongs = (row: { user_id: string; case_id: string | null; deleted_at: string | null }) => Boolean(activeCase && row.user_id === ownerId && row.case_id === activeCase.id && !row.deleted_at);
  const entries = snapshot.entries.filter(belongs).sort((a, b) => `${b.event_date}${b.event_time || ''}`.localeCompare(`${a.event_date}${a.event_time || ''}`) || a.id.localeCompare(b.id));
  const entryIds = new Set(entries.map((row) => row.id));
  const caseAttachments = snapshot.evidenceAttachments.filter(belongs);
  const attachments = caseAttachments.filter((row) => row.entry_id && entryIds.has(row.entry_id));
  const orders = snapshot.courtOrders.filter(belongs).sort((a, b) => (b.order_date || '').localeCompare(a.order_date || '') || a.id.localeCompare(b.id));
  const orderIds = new Set(orders.map((row) => row.id));
  const provisions = snapshot.courtOrderProvisions.filter((row) => belongs(row) && orderIds.has(row.court_order_id));
  const hearings = snapshot.keyDates.filter((row) => belongs(row) && row.date_type === 'hearing').sort((a, b) => `${a.event_date}${a.event_time || ''}`.localeCompare(`${b.event_date}${b.event_time || ''}`) || a.id.localeCompare(b.id));
  return {
    activeCase, entries, attachments, orders, provisions, hearings,
    shareableEntries: entries.filter((entry) => getEntryMetadata(entry).review_visibility !== 'private'),
    privateEntryCount: entries.filter((entry) => getEntryMetadata(entry).review_visibility === 'private').length,
    unlinkedAttachmentCount: caseAttachments.length - attachments.length,
  };
}
export type BriefcaseModel = ReturnType<typeof buildBriefcaseModel>;

function searchText(value: string) { return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(); }
function matches(values: Array<string | null | undefined>, query: string) {
  const text = searchText(values.filter(Boolean).join(' '));
  return searchText(query).trim().split(/\s+/).every((term) => text.includes(term));
}

export function searchBriefcaseOrders(model: BriefcaseModel, query: string): CourtOrder[] {
  return model.orders.filter((order) => matches([
    order.order_title, order.order_date, order.order_type,
    ...model.provisions.filter((row) => row.court_order_id === order.id).flatMap((row) => [row.label, row.body, row.category]),
  ], query));
}

export function searchBriefcaseEntries(model: BriefcaseModel, query: string, selectedOrderId?: string | null, linkedOnly = false): Entry[] {
  const order = model.orders.find((row) => row.id === selectedOrderId);
  const provisionIds = new Set(model.provisions.filter((row) => row.court_order_id === order?.id).map((row) => row.id));
  const sourceEntryId = model.attachments.find((row) => row.id === order?.source_attachment_id)?.entry_id;
  return model.shareableEntries.filter((entry) => {
    const linkedProvisionId = getEntryMetadata(entry).linked_court_order_provision_id;
    const linkedProvision = typeof linkedProvisionId === 'string' && provisionIds.has(linkedProvisionId);
    if (linkedOnly && (!order || (entry.id !== sourceEntryId && !linkedProvision))) return false;
    return matches([entry.title, entry.body, entry.event_date, entry.entry_type.replace(/_/g, ' '), ...model.attachments.filter((row) => row.entry_id === entry.id).map((row) => row.file_name)], query);
  });
}

export function selectedBriefcaseEntries(model: BriefcaseModel, selectedIds: string[]): Entry[] {
  const ids = new Set(selectedIds);
  return model.shareableEntries.filter((entry) => ids.has(entry.id));
}

export function selectedBriefcaseAttachments(model: BriefcaseModel, selectedIds: string[]): EvidenceAttachment[] {
  const ids = new Set(selectedBriefcaseEntries(model, selectedIds).map((row) => row.id));
  return model.attachments.filter((row) => row.entry_id && ids.has(row.entry_id));
}

export function evidenceSelectionKey(attachments: EvidenceAttachment[]): string {
  return attachments.map((row) => [row.id, row.entry_id, row.file_hash, row.file_size_bytes, row.storage_path].join(':')).sort().join('|');
}

export function trustRecordCounts(model: BriefcaseModel, records: Record<string, LocalRecordMeta>) {
  // Sync is an account-level queue; do not imply these rows all belong to one case.
  const recordRows = Object.values(records);
  return {
    pendingRecords: recordRows.filter((row) => row.sync_status !== 'synced').length,
    filesWithRecordedHash: model.attachments.filter((row) => row.hash_algorithm.toLowerCase().replace('-', '') === 'sha256' && /^[a-f0-9]{64}$/i.test(row.file_hash || '')).length,
    originalFiles: model.attachments.length,
    entries: model.entries.length,
  };
}
