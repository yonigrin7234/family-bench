import type { CaseIntelligenceSnapshot, Entry, EvidenceAttachment, FilingPackageLocalState, ReportPreviewType } from '../case-intelligence/types';
import { isPrivateEntry } from '../export/model';

export const FILING_REPORT_TYPES: ReportPreviewType[] = ['timeline', 'flagged', 'communication', 'medical', 'custodyExchange', 'late', 'expense', 'benchBrief'];
export type FilingSelection = {
  entries: Entry[];
  entryIds: string[];
  attachments: EvidenceAttachment[];
  attachmentParentEntryIds: string[];
  /** IDs already linked to this package, with no displayable live source. */
  unavailableEntryIds: string[];
  unavailableAttachmentIds: string[];
  reportTypes: ReportPreviewType[];
  issues: string[];
};

/** A package exports complete reviewed entries, including all their live originals.
 * Explicit attachment links bring their parent entry into the review scope.
 * Any invalid link blocks the package output instead of silently broadening it.
 */
export function resolveFilingPackageSelection(input: {
  snapshot: CaseIntelligenceSnapshot;
  ownerId: string;
  caseId: string;
  packageId: string;
  packageState: FilingPackageLocalState | null | undefined;
}): FilingSelection {
  const { snapshot, ownerId, caseId, packageId, packageState } = input;
  const empty: FilingSelection = { entries: [], entryIds: [], attachments: [], attachmentParentEntryIds: [], unavailableEntryIds: [], unavailableAttachmentIds: [], reportTypes: [], issues: [] };
  if (!snapshot.cases.some((row) => row.id === caseId && row.user_id === ownerId && !row.deleted_at)
    || !snapshot.filingPackages.some((row) => row.id === packageId && row.user_id === ownerId && row.case_id === caseId && !row.deleted_at)) {
    return { ...empty, issues: ['This package is not available in the selected case.'] };
  }
  if (!packageState || packageState.packageId !== packageId || !Array.isArray(packageState.linkedEntryIds) || !packageState.linkedEntryIds.every((id) => typeof id === 'string') || !Array.isArray(packageState.linkedAttachmentIds) || !packageState.linkedAttachmentIds.every((id) => typeof id === 'string') || !Array.isArray(packageState.linkedReportTypes)) return { ...empty, issues: ['This package’s saved selections are unavailable. Review its working context in Settings.'] };
  const issues = new Set<string>(); const entryIds = new Set<string>(); const parentIds = new Set<string>();
  const unavailableEntryIds = new Set<string>(); const unavailableAttachmentIds = new Set<string>();
  const ownedEntry = (id: string) => snapshot.entries.find((row) => row.id === id && row.user_id === ownerId && row.case_id === caseId && !row.deleted_at);
  function includeEntry(id: string, parent = false) {
    const entry = ownedEntry(id);
    if (!entry) { if (!parent) unavailableEntryIds.add(id); issues.add('A linked entry is unavailable in this case. Remove the unavailable link before exporting.'); return; }
    if (isPrivateEntry(entry)) { issues.add('A linked entry is private. Unlink it, or review its visibility in the entry screen before exporting. Original CSV sources remain private.'); return; }
    entryIds.add(id); if (parent) parentIds.add(id);
  }
  for (const id of packageState.linkedEntryIds) includeEntry(id);
  for (const id of packageState.linkedAttachmentIds) {
    const attachment = snapshot.evidenceAttachments.find((row) => row.id === id && row.user_id === ownerId && row.case_id === caseId && !row.deleted_at);
    if (!attachment?.entry_id || !ownedEntry(attachment.entry_id)) { unavailableAttachmentIds.add(id); issues.add('A linked original or its parent entry is unavailable in this case. Remove the unavailable link before exporting.'); continue; }
    includeEntry(attachment.entry_id, true);
  }
  const entries = snapshot.entries.filter((row) => entryIds.has(row.id) && row.user_id === ownerId && row.case_id === caseId && !row.deleted_at)
    .sort((a, b) => `${a.event_date}T${a.event_time ?? ''}`.localeCompare(`${b.event_date}T${b.event_time ?? ''}`) || a.id.localeCompare(b.id));
  const attachments = snapshot.evidenceAttachments.filter((row) => !row.deleted_at && row.entry_id && entryIds.has(row.entry_id));
  if (attachments.some((row) => row.user_id !== ownerId || row.case_id !== caseId)) issues.add('An original has inconsistent case ownership. Resolve this record before exporting.');
  if (packageState.linkedReportTypes.some((type) => !FILING_REPORT_TYPES.includes(type))) issues.add('A linked report type is unsupported. Review the package selections.');
  return { entries, entryIds: entries.map((row) => row.id), attachments: attachments.filter((row) => row.user_id === ownerId && row.case_id === caseId), attachmentParentEntryIds: [...parentIds], unavailableEntryIds: [...unavailableEntryIds], unavailableAttachmentIds: [...unavailableAttachmentIds], reportTypes: [...new Set(packageState.linkedReportTypes.filter((type) => FILING_REPORT_TYPES.includes(type)))], issues: [...issues] };
}
