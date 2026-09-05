import { sanitizeCourtFormValues, type CourtFormDraft } from '../forms/model';
import type { PreservedWorkspaceContext } from '../case-intelligence/contextIntegrity';
import { strToU8, zip, type Zippable } from 'fflate';
import type { CaseIntelligenceSnapshot, CaseWorkspaceContext, EvidenceAttachment, SavedReportVersion } from '../case-intelligence/types';
import { assertSnapshotOwner, emptyCaseSnapshot } from '../case-intelligence/ownership';
import { cleanRemoteRow, type ResolvedSyncConflict, type SyncRow } from '../case-intelligence/syncModel';
import { attachmentIdentity, verifyEvidenceBytes, type EvidenceHasher } from '../evidence/core';
import type { TimelineArtifact } from './timeline';

// An in-memory export must fail explicitly before exhausting a phone's memory.
// Large accounts need a streaming/server archive path, not a partial download.
export const MAX_PRIVATE_ARCHIVE_BYTES = 128 * 1024 * 1024;

export type PrivateArchiveWorkspace = CaseWorkspaceContext & {
  ownerId: string;
  selectedCaseId: string | null;
  caseWorkspaceStates: Record<string, CaseWorkspaceContext>;
  savedReportVersions: SavedReportVersion[];
  conflictHistory: ResolvedSyncConflict[];
  courtFormDrafts?: CourtFormDraft[];
  contextRecovery?: PreservedWorkspaceContext[];
};

export type PrivateArchiveInput = {
  ownerId: string;
  snapshot: CaseIntelligenceSnapshot;
  workspace: PrivateArchiveWorkspace;
  generatedAt?: string;
};

export type PrivateArchivePorts = {
  getAttachmentBytes: (attachment: EvidenceAttachment) => Promise<Uint8Array>;
  sha256: EvidenceHasher;
  assertCurrentAccount: () => void;
  onProgress?: (completed: number, total: number) => void;
};

function pick<T, K extends keyof T>(value: T, keys: readonly K[]): Pick<T, K> {
  return Object.fromEntries(keys.map((key) => [key, value[key]])) as Pick<T, K>;
}

/** Deliberate field projection: never serialize the store/session object itself. */
function projectContext(value: CaseWorkspaceContext, ownerId: string): CaseWorkspaceContext {
  if (!value?.reportPreviewState || !value.advisorState || !Array.isArray(value.advisorState.messages) || !value.filingBuilderState || !value.patternReviewState) throw new Error('Saved working context is incomplete. No partial archive was created.');
  const claimedOwner = (value as CaseWorkspaceContext & { ownerId?: string }).ownerId;
  if (claimedOwner && claimedOwner !== ownerId) throw new Error('This saved working context belongs to a different account. No archive was created.');
  return {
    reportPreviewState: pick(value.reportPreviewState, ['reportType', 'typeFilter', 'flagFilter']),
    advisorState: { ...pick(value.advisorState, ['threadId', 'pinnedThreadId', 'updatedAt']), messages: value.advisorState.messages.map((message) => pick(message, ['id', 'role', 'body', 'createdAt', 'linkedEntryIds', 'prompt', 'localOnly'])) },
    filingBuilderState: { ...pick(value.filingBuilderState, ['selectedPackageId', 'updatedAt']), packageStates: Object.fromEntries(Object.entries(value.filingBuilderState.packageStates).map(([id, state]) => [id, {
      ...pick(state, ['packageId', 'linkedEntryIds', 'linkedAttachmentIds', 'linkedReportTypes', 'updatedAt']),
      checklist: pick(state.checklist, ['forms', 'exhibits', 'declarations', 'service']),
      exhibitGroups: state.exhibitGroups.map((group) => pick(group, ['id', 'label', 'entryIds', 'attachmentIds'])),
    }])) },
    patternReviewState: pick(value.patternReviewState, ['acknowledgedPatternIds', 'dismissedPatternIds', 'updatedAt']),
  };
}

function projectWorkspace(value: PrivateArchiveWorkspace, ownerId: string, depth = 0): PrivateArchiveWorkspace {
  if (value.ownerId !== ownerId) throw new Error('This saved working context belongs to a different account. No archive was created.');
  if (depth > 20) throw new Error('Conflict history nesting exceeds this device archive limit. No partial archive was created.');
  return {
    ownerId, selectedCaseId: value.selectedCaseId ?? null, ...projectContext(value, ownerId),
    caseWorkspaceStates: Object.fromEntries(Object.entries(value.caseWorkspaceStates ?? {}).map(([id, context]) => [id, projectContext(context, ownerId)])),
    savedReportVersions: value.savedReportVersions.map((version) => ({ ...pick(version, ['id', 'caseId', 'reportType', 'title', 'createdAt', 'updatedAt', 'includedEntryIds', 'linkedFilingPackageIds']), filters: pick(version.filters, ['typeFilter', 'flagFilter', 'childFilter', 'dateRangeLabel']) })),
    courtFormDrafts: (value.courtFormDrafts ?? []).map((draft) => {
      if (draft.userId !== ownerId) throw new Error('A form draft belongs to another account. No archive was created.');
      return { ...pick(draft, ['id', 'userId', 'caseId', 'formId', 'sourceEntryIds', 'createdAt', 'updatedAt']), values: sanitizeCourtFormValues(draft.formId, draft.values) };
    }),
    contextRecovery: (value.contextRecovery ?? []).map((copy) => {
      if (copy.ownerId !== ownerId) throw new Error('A preserved context copy belongs to another account. No archive was created.');
      return { ...pick(copy, ['id', 'ownerId', 'observedAt', 'source', 'resolvedAt', 'raw']), issues: copy.issues.map((issue) => pick(issue, ['path', 'code'])) };
    }),
    conflictHistory: (value.conflictHistory ?? []).map((conflict) => {
      function row(value: SyncRow | null): SyncRow | null {
        if (!value) return null;
        if (value.user_id !== ownerId) throw new Error('Conflict history contains another account’s record. No archive was created.');
        const clean = cleanRemoteRow(conflict.table, value);
        if (conflict.table === 'case_workspace_state') {
          const state = value.state as PrivateArchiveWorkspace;
          clean.state = projectWorkspace({ ...state, ownerId: typeof state.ownerId === 'string' ? state.ownerId : ownerId }, ownerId, depth + 1);
        }
        return clean;
      }
      return { ...pick(conflict, ['key', 'table', 'version', 'resolutionId', 'resolvedAt', 'choice']), local: row(conflict.local)!, remote: row(conflict.remote) };
    }),
  };
}

function assertContextLinks(snapshot: CaseIntelligenceSnapshot, workspace: PrivateArchiveWorkspace) {
  const cases = new Set(snapshot.cases.map((row) => row.id));
  function assertCase(id: string | null | undefined) {
    if (id && !cases.has(id)) throw new Error('Working context references a case outside this account workspace. No archive was created.');
  }
  function assertLinks(ids: string[], rows: Array<{ id: string; case_id: string | null }>, caseId?: string | null) {
    if (ids.some((id) => !rows.some((row) => row.id === id && (!caseId || row.case_id === caseId)))) throw new Error('Working context has a missing or cross-case record link. No archive was created.');
  }
  function context(value: CaseWorkspaceContext, caseId?: string | null) {
    for (const message of value.advisorState.messages) assertLinks(message.linkedEntryIds, snapshot.entries, caseId);
    if (value.filingBuilderState.selectedPackageId) assertLinks([value.filingBuilderState.selectedPackageId], snapshot.filingPackages, caseId);
    for (const [id, filing] of Object.entries(value.filingBuilderState.packageStates)) {
      if (id !== filing.packageId) throw new Error('A filing context identity is inconsistent. No archive was created.');
      assertLinks([id], snapshot.filingPackages, caseId);
      const filingCase = snapshot.filingPackages.find((row) => row.id === id)!.case_id;
      assertLinks(filing.linkedEntryIds, snapshot.entries, filingCase);
      assertLinks(filing.linkedAttachmentIds, snapshot.evidenceAttachments, filingCase);
      for (const group of filing.exhibitGroups) { assertLinks(group.entryIds, snapshot.entries, filingCase); assertLinks(group.attachmentIds, snapshot.evidenceAttachments, filingCase); }
    }
  }
  assertCase(workspace.selectedCaseId); assertCase(snapshot.selectedCaseId);
  if (workspace.selectedCaseId && !snapshot.cases.some((row) => row.id === workspace.selectedCaseId && !row.deleted_at)) throw new Error('The selected case is no longer active in this workspace. No archive was created.');
  if (snapshot.selectedCaseId && workspace.selectedCaseId !== snapshot.selectedCaseId) throw new Error('The selected case changed while preparing this archive.');
  context(workspace, workspace.selectedCaseId);
  for (const [id, value] of Object.entries(workspace.caseWorkspaceStates)) { assertCase(id); context(value, id); }
  for (const draft of workspace.courtFormDrafts ?? []) { assertCase(draft.caseId); assertLinks(draft.sourceEntryIds, snapshot.entries, draft.caseId); }
  for (const version of workspace.savedReportVersions) {
    assertCase(version.caseId);
    assertLinks(version.includedEntryIds, snapshot.entries, version.caseId);
    assertLinks(version.linkedFilingPackageIds, snapshot.filingPackages, version.caseId);
    if (version.filters.childFilter) assertLinks([version.filters.childFilter], snapshot.children, version.caseId);
  }
}

/** This is explicitly a private export. It must never be reused for court/shared reports. */
export async function createPrivateWorkspaceArchive(input: PrivateArchiveInput, ports: PrivateArchivePorts): Promise<TimelineArtifact> {
  ports.assertCurrentAccount();
  assertSnapshotOwner(input.snapshot, input.ownerId);
  // Clone before asynchronous reads so the archive has one consistent record snapshot.
  const snapshot = JSON.parse(JSON.stringify({ ...Object.fromEntries(Object.keys(emptyCaseSnapshot()).map((key) => [key, input.snapshot[key as keyof CaseIntelligenceSnapshot]])), selectedCaseId: input.snapshot.selectedCaseId ?? null })) as CaseIntelligenceSnapshot;
  const workspace = JSON.parse(JSON.stringify(projectWorkspace(input.workspace, input.ownerId))) as PrivateArchiveWorkspace;
  assertContextLinks(snapshot, workspace);
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(generatedAt))) throw new Error('The archive date is invalid.');
  const attachments = snapshot.evidenceAttachments.filter((item) => !item.deleted_at);
  const entries = new Map(snapshot.entries.map((entry) => [entry.id, entry]));
  const ids = new Set<string>();
  let sourceBytes = 0;
  for (const attachment of attachments) {
    attachmentIdentity(attachment, input.ownerId);
    const entry = entries.get(attachment.entry_id ?? '');
    if (!entry || entry.user_id !== input.ownerId || entry.case_id !== attachment.case_id || ids.has(attachment.id)) {
      throw new Error('An original file has an invalid record link. The archive was stopped.');
    }
    ids.add(attachment.id);
    if (!Number.isSafeInteger(attachment.file_size_bytes) || attachment.file_size_bytes! <= 0) {
      throw new Error('An original file has an invalid size. The archive was stopped.');
    }
    sourceBytes += attachment.file_size_bytes!;
  }
  const records = strToU8(JSON.stringify({
    format: 'family-bench-private-workspace-v1', generatedAt,
    privacy: 'PRIVATE: includes private entries, notes, captured text, metadata, saved conversations, working context, form drafts, preserved imported context, resolved conflict copies and original files.',
    scope: 'All loaded account case records, active and per-case working context, saved report selections, saved conversations, official-form drafts, preserved imported context, and locally preserved conflict resolutions. Includes verified original bytes for every nondeleted attachment. Deleted-attachment bytes, server-only audit history, authentication secrets, device keys, billing and external-provider data are excluded. This is not an automatic restore format.',
    snapshot, workspace,
  }, null, 2));
  if (sourceBytes + records.length > MAX_PRIVATE_ARCHIVE_BYTES) {
    throw new Error('This workspace exceeds the 128 MiB device archive limit. No partial archive was created. Export smaller evidence packets while a larger archive is arranged.');
  }
  const files: Zippable = { 'private-workspace.json': [records, { level: 6 }] };
  const manifest: Array<{ attachmentId: string; entryId: string; caseId: string; name: string; archivePath: string; bytes: number; sha256: string }> = [];
  ports.onProgress?.(0, attachments.length);
  for (const attachment of attachments) {
    ports.assertCurrentAccount();
    let bytes: Uint8Array;
    try {
      bytes = await ports.getAttachmentBytes(attachment);
      await verifyEvidenceBytes(bytes, attachment, ports.sha256);
    } catch {
      throw new Error(`Original file ${attachment.id} could not be read and verified. No partial archive was created.`);
    }
    ports.assertCurrentAccount();
    const archivePath = `originals/${attachment.id}/original`;
    files[archivePath] = [bytes, { level: 0 }];
    manifest.push({ attachmentId: attachment.id, entryId: attachment.entry_id!, caseId: attachment.case_id!,
      name: attachment.file_name, archivePath, bytes: bytes.byteLength, sha256: attachment.file_hash! });
    ports.onProgress?.(manifest.length, attachments.length);
  }
  files['originals-manifest.json'] = strToU8(JSON.stringify({ format: 'family-bench-private-originals-v1', generatedAt, files: manifest }, null, 2));
  files['README.txt'] = strToU8(
    'PRIVATE FAMILY BENCH WORKSPACE ARCHIVE\n\n' +
    'This ZIP is not encrypted. It includes private notes, private entries, source text, personal metadata, saved conversations, working context, form drafts, preserved imported context, resolved conflict copies and original files. Store it securely. Do not submit or share it as a court report.\n\n' +
    'private-workspace.json contains all loaded case records plus active/per-case working context, saved report selections, saved conversations, official-form drafts, preserved imported context and locally preserved conflict resolutions. Original bytes are listed in originals-manifest.json with their recorded names, sizes and SHA-256 hashes. Each original was checked against its saved hash before inclusion.\n\n' +
    'Deleted-attachment bytes, server-only audit history, authentication credentials, device keys, billing and external provider data are excluded, and is not an automatic restore format. Preserved imported context may contain unrecognized fields and sensitive text; it is included for recovery, not applied to the workspace. Use factual PDF/evidence export when preparing records to share.\n',
  );
  const bytes = await new Promise<Uint8Array>((resolve, reject) => zip(files, { level: 0 }, (error, data) => error ? reject(error) : resolve(data)));
  ports.assertCurrentAccount();
  return { bytes, name: `family-bench-PRIVATE-workspace-${generatedAt.slice(0, 10)}.zip`, mimeType: 'application/zip' };
}
