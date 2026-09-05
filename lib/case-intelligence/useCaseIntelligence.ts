import { FILING_REPORT_TYPES } from '../filings/model';
import { isPrivateEntry } from '../export/model';
import { validateImportProvenance, type ImportProvenance } from '../imports/model';
import { sanitizeCourtFormValues, type CourtFormDraft, type CourtFormId } from '../forms/model';
import { extractWorkspaceContext, inspectWorkspaceContext, safeContextInput, type PreservedWorkspaceContext } from './contextIntegrity';
import { validateCustodyInterval, type CustodyInterval } from '@/lib/calculations/custody';
import { validateTypedCaptureDetails, type TypedCaptureDetails } from '@/lib/reporting/capture';
import { useEffect, useMemo } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuthStore, getWorkspaceOwnerId, hasVerifiedSession } from '@/lib/auth/session';
import { emptyCaseSnapshot } from './ownership';
import { acquireWorkspaceLease } from './workspaceLease';
import { fetchCloudWorkspace, sendCloudChanges } from './cloud';
import { SYNC_TABLES, prepareSyncChanges, mergeSyncReceipts, findSyncConflicts, conflictRecordCopy, type ResolvedSyncConflict, type SyncChange, type SyncConflict, type SyncRow } from './syncModel';
import { preserveEvidenceOriginal, uploadEvidenceOriginal, clearLocalEvidence, cleanupEvidenceSource } from '@/lib/evidence';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import type { Json } from '@/lib/supabase/database.types';
import { normalizeOptionalDate as normalizeDate, normalizeOptionalTime as normalizeTime } from '@/lib/utils/dateInput';
import { hashString } from '@/lib/utils/hash';
import { getEntryTypeOption, type EntryTypeValue } from './entryTypes';
import {
  DEFAULT_ADVISOR_STATE,
  DEFAULT_FILING_BUILDER_STATE,
  DEFAULT_FILING_CHECKLIST_STATE,
  DEFAULT_PATTERN_REVIEW_STATE,
  DEFAULT_REPORT_PREVIEW_STATE,
  DEFAULT_SAVED_REPORT_VERSIONS,
  clearPersistedCaseIntelligence,
  createLocalRecordMeta,
  getLocalPersistenceAdapter,
  localRecordKey,
  readPersistedCaseIntelligence,
  withEvidenceAttachmentLocalMeta,
  withEntryLocalMeta,
  writePersistedCaseIntelligence,
  normalizeWorkspaceState,
} from './persistence';
import { buildDetectedCasePatterns } from './patterns';
import { getEntryMetadata } from './review';
import {
  getActiveCase,
  getFlaggedEntries,
  getNextStepForCase,
  getPatternsForCase,
  getRecentEntries,
  getUpcomingKeyDates,
} from './selectors';
import type {
  AdvisorConversationState,
  AdvisorMessage,
  Child,
  CaseIntelligenceSnapshot,
  CaseWorkspaceContext,
  CaseIntelligenceSource,
  CourtOrder,
  CourtOrderProvision,
  CourtOrderProvisionCategory,
  CourtOrderProvisionStatus,
  Entry,
  EvidenceAttachment,
  FamilyBenchCase,
  FilingBuilderState,
  FilingChecklistKey,
  FilingChecklistState,
  FilingPackage,
  FilingPackageLocalState,
  FilingPackageStatus,
  HomeCaseIntelligence,
  KeyDate,
  KeyDateCategory,
  LocalPersistenceDiagnostics,
  LocalRecordMeta,
  PatternReviewState,
  Person,
  ReportPreviewType,
  ReportPreviewState,
  SavedReportVersion,
  AttachmentKind,
} from './types';

export type CaptureEntryInput = {
  id?: string;
  childId?: string | null;
  custodyPeriod?: 'my_time' | 'their_time' | 'transition' | 'neutral' | null;
  typedDetails?: TypedCaptureDetails;
  reviewVisibility?: 'private' | 'court_ready';
  importProvenance?: ImportProvenance;
  custodyInterval?: CustodyInterval;
  entryType: EntryTypeValue;
  eventDate: string;
  eventTime?: string | null;
  title?: string | null;
  body?: string | null;
  locationName?: string | null;
  childMood?: string | null;
  isFlagged: boolean;
  flagSeverity?: string | null;
  privateNotes?: string | null;
  sourceCapturedText?: string | null;
  captureSource?: 'manual' | 'voice' | 'voice_placeholder';
  forceLocalOnly?: boolean;
};

type SaveEntryResult = {
  entry: Entry;
  source: CaseIntelligenceSource;
  warning?: string;
};

export type EntryReviewPatch = {
  body?: string | null;
  reviewed?: boolean;
  reviewVisibility?: 'court_ready' | 'private';
};

export type CourtOrderInput = {
  id?: string;
  sourceAttachmentId?: string | null;
  title: string;
  orderType?: string | null;
  orderDate?: string | null;
};

export type CourtOrderProvisionInput = {
  id?: string;
  courtOrderId: string;
  category: CourtOrderProvisionCategory;
  status: CourtOrderProvisionStatus;
  label: string;
  body: string;
  effectiveDate?: string | null;
  endDate?: string | null;
};

export type KeyDateInput = {
  id?: string;
  category: KeyDateCategory;
  title: string;
  eventDate: string;
  eventTime?: string | null;
  priority?: boolean;
  notes?: string | null;
  relatedFilingPackageId?: string | null;
};

export type CreatePlaceholderAttachmentInput = {
  entryId: string;
  kind: AttachmentKind;
  sourceLabel?: string | null;
};

export type CreateLocalAttachmentInput = {
  attachmentId?: string;
  entryId: string;
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

type SaveAttachmentResult = {
  attachment: EvidenceAttachment;
  source: 'local';
  warning: string;
};

export type SendAdvisorMessageInput = {
  prompt: string;
  caseTitle: string;
  upcomingHearingLabel?: string | null;
  flaggedEntriesCount: number;
  linkedEntryIds: string[];
};

export type CaseSetupUserRole = 'petitioner' | 'respondent' | 'other';

export type CaseSetupInput = {
  /** Stable draft ID is required by the setup UI for safe retries. */
  id?: string;
  mode?: 'create' | 'edit';
  caseName: string;
  caseNumber?: string | null;
  courtName?: string | null;
  county?: string | null;
  department?: string | null;
  judgeName?: string | null;
  userRole: CaseSetupUserRole;
  otherParentName: string;
  childName: string;
  children?: Array<{ id: string; name: string; dateOfBirth?: string | null }>;
  nextHearingDate?: string | null;
};

type SaveCaseSetupResult = {
  case: FamilyBenchCase;
  source: 'local';
};

export type CreateFilingPackageInput = {
  id?: string;
  title: string;
  filingType: string;
  status?: FilingPackageStatus;
  dueDate?: string | null;
};

type SaveFilingPackageResult = {
  filingPackage: FilingPackage;
  source: 'local';
};

type CaseIntelligenceState = {
  ownerId: string | null;
  storageBlocked: boolean;
  saving: number;
  syncing: boolean;
  syncError: string | null;
  conflicts: SyncConflict[];
  conflictHistory: ResolvedSyncConflict[];
  workspaceJSON: string;
  switchingCase: boolean;
  contextRecovery: PreservedWorkspaceContext[];
  contextError: string | null;
  resetAffectedViewSelections: () => Promise<void>;
  caseWorkspaceStates: Record<string, CaseWorkspaceContext>;
  switchCase: (caseId: string) => Promise<void>;
  sync: () => Promise<void>;
  retrySave: () => Promise<void>;
  resolveConflict: (key: string, keepLocal: boolean) => Promise<void>;
  snapshot: CaseIntelligenceSnapshot;
  source: CaseIntelligenceSource;
  reportPreviewState: ReportPreviewState;
  savedReportVersions: SavedReportVersion[];
  courtFormDrafts: CourtFormDraft[];
  saveCourtFormDraft: (input: { id: string; caseId: string; formId: CourtFormId; values: CourtFormDraft['values']; sourceEntryIds: string[] }) => Promise<CourtFormDraft>;
  advisorState: AdvisorConversationState;
  filingBuilderState: FilingBuilderState;
  patternReviewState: PatternReviewState;
  localRecords: Record<string, LocalRecordMeta>;
  persistence: LocalPersistenceDiagnostics;
  loading: boolean;
  hasLoaded: boolean;
  hasHydrated: boolean;
  hasPersistedSnapshot: boolean;
  error: string | null;
  load: () => Promise<void>;
  saveCaseSetup: (input: CaseSetupInput) => Promise<SaveCaseSetupResult>;
  createEntry: (input: CaptureEntryInput) => Promise<SaveEntryResult>;
  createPlaceholderAttachment: (
    input: CreatePlaceholderAttachmentInput,
  ) => Promise<SaveAttachmentResult>;
  createLocalAttachment: (input: CreateLocalAttachmentInput) => Promise<SaveAttachmentResult>;
  createFilingPackage: (input: CreateFilingPackageInput) => Promise<SaveFilingPackageResult>;
  selectFilingPackage: (packageId: string | null) => Promise<void>;
  updateFilingPackageStatus: (packageId: string, status: FilingPackageStatus) => Promise<void>;
  toggleFilingPackageEntry: (packageId: string, entryId: string) => Promise<void>;
  toggleFilingPackageAttachment: (packageId: string, attachmentId: string) => Promise<void>;
  toggleFilingPackageReport: (packageId: string, reportType: ReportPreviewType) => Promise<void>;
  toggleFilingPackageChecklist: (packageId: string, item: FilingChecklistKey) => Promise<void>;
  acknowledgePattern: (patternId: string) => void;
  dismissPattern: (patternId: string) => void;
  restorePattern: (patternId: string) => void;
  sendAdvisorMessage: (input: SendAdvisorMessageInput) => void;
  setReportPreviewState: (patch: Partial<ReportPreviewState>) => void;
  saveReportVersion: (input: {
    reportType: ReportPreviewType;
    title: string;
    includedEntryIds: string[];
    filters: SavedReportVersion['filters'];
  }) => Promise<SavedReportVersion>;
  createCourtOrder: (input: CourtOrderInput) => Promise<CourtOrder>;
  updateCourtOrder: (orderId: string, input: CourtOrderInput) => Promise<void>;
  createCourtOrderProvision: (input: CourtOrderProvisionInput) => Promise<CourtOrderProvision>;
  updateCourtOrderProvision: (provisionId: string, input: CourtOrderProvisionInput) => Promise<void>;
  linkEntryToCourtOrderProvision: (entryId: string, provisionId: string | null) => Promise<void>;
  createKeyDate: (input: KeyDateInput) => Promise<KeyDate>;
  updateKeyDate: (keyDateId: string, input: KeyDateInput) => Promise<void>;
  clearLocalCaseData: () => Promise<void>;
  updateEntryReview: (entryId: string, patch: EntryReviewPatch) => Promise<void>;
};

let workspaceEpoch = 0;
let releaseWorkspaceLease: (() => void) | null = null;
function isActiveWorkspace(ownerId: string, epoch: number): boolean {
  const auth = useAuthStore.getState();
  return workspaceEpoch === epoch && hasVerifiedSession(auth.session) && !auth.recovery && auth.session!.user.id === ownerId;
}

const isSupabaseWriteEnabled = true;

function getSyncMode(): LocalPersistenceDiagnostics['syncMode'] {
  if (isSupabaseWriteEnabled) return 'remote_write_enabled';
  return isSupabaseConfigured ? 'local_first' : 'disabled_demo';
}

function createPersistenceDiagnostics(
  overrides: Partial<LocalPersistenceDiagnostics> = {},
): LocalPersistenceDiagnostics {
  return {
    active: true,
    adapter: getLocalPersistenceAdapter(),
    hydrationCompleted: false,
    syncMode: getSyncMode(),
    error: null,
    ...overrides,
  };
}

function nullIfBlank(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeProvisionStatus(value?: string | null): CourtOrderProvisionStatus {
  return value === 'superseded' ? 'superseded' : 'active';
}

function provisionKeyFor(
  category: CourtOrderProvisionCategory,
  status: CourtOrderProvisionStatus,
) {
  return `local:${status}:${category}`;
}

export function getCourtOrderProvisionStatus(
  provision: CourtOrderProvision,
): CourtOrderProvisionStatus {
  if (provision.end_date) return 'superseded';
  return provision.provision_key?.includes(':superseded:') ? 'superseded' : 'active';
}

const KEY_DATE_PRIORITY_MARKER = '[family-bench-priority:true]';

function buildKeyDateDescription(notes?: string | null, priority = false) {
  const cleanNotes = nullIfBlank(notes);
  return [cleanNotes, priority ? KEY_DATE_PRIORITY_MARKER : null].filter(Boolean).join('\n\n') || null;
}

export function getKeyDateNotes(keyDate: KeyDate) {
  return keyDate.description?.replace(KEY_DATE_PRIORITY_MARKER, '').trim() || null;
}

export function isKeyDatePriority(keyDate: KeyDate) {
  return keyDate.description?.includes(KEY_DATE_PRIORITY_MARKER) ?? false;
}

export function normalizeKeyDateCategory(value?: string | null): KeyDateCategory {
  if (
    value === 'hearing' ||
    value === 'filing_deadline' ||
    value === 'service_deadline' ||
    value === 'mediation' ||
    value === 'appointment'
  ) {
    return value;
  }

  return 'other';
}

function isLiveRow(row: { deleted_at: string | null }) {
  return !row.deleted_at;
}

function isFallbackId(id: string) {
  return id.startsWith('fallback-');
}

function hasLocalTableRecord(
  table: string,
  id: string,
  localRecords: Record<string, LocalRecordMeta>,
) {
  const record = localRecords[localRecordKey(table, id)];
  return Boolean(record) || id.startsWith('local-');
}

function getLocalSetupCase(
  snapshot: CaseIntelligenceSnapshot,
  localRecords: Record<string, LocalRecordMeta>,
) {
  return (
    snapshot.cases
      .filter(isLiveRow)
      .find((caseRow) => hasLocalTableRecord('cases', caseRow.id, localRecords)) ?? null
  );
}

function hasLocalCaseSetup(
  snapshot: CaseIntelligenceSnapshot,
  localRecords: Record<string, LocalRecordMeta>,
) {
  return Boolean(getLocalSetupCase(snapshot, localRecords));
}

function hasUserCaseSetup(
  snapshot: CaseIntelligenceSnapshot,
  localRecords: Record<string, LocalRecordMeta>,
) {
  if (hasLocalCaseSetup(snapshot, localRecords)) return true;
  return snapshot.cases.filter(isLiveRow).some((caseRow) => !isFallbackId(caseRow.id));
}

function isDemoCase(
  snapshot: CaseIntelligenceSnapshot,
  localRecords: Record<string, LocalRecordMeta>,
) {
  const activeCase = getActiveCase(snapshot);
  return Boolean(activeCase && isFallbackId(activeCase.id) && !hasLocalCaseSetup(snapshot, localRecords));
}

async function buildEntry(
  input: CaptureEntryInput,
  snapshot: CaseIntelligenceSnapshot,
  userId: string,
): Promise<Entry> {
  const activeCase = getActiveCase(snapshot);
  if (!activeCase) {
    throw new Error('Set up a case before adding timeline entries.');
  }

  const eventDate = normalizeDate(input.eventDate);
  if (!eventDate) throw new Error('Enter the event date before saving.');
  const option = getEntryTypeOption(input.entryType);
  const now = new Date().toISOString();
  const body = nullIfBlank(input.body);
  const title = nullIfBlank(input.title) ?? option.defaultTitle;
  const childId = input.childId === undefined
    ? snapshot.children.find((child) => !child.deleted_at && child.case_id === activeCase.id)?.id ?? null
    : input.childId;
  if (childId && !snapshot.children.some((child) => child.id === childId && child.user_id === userId && !child.deleted_at && child.case_id === activeCase.id)) throw new Error('Choose a child from the selected case.');
  if (input.reviewVisibility !== undefined && !['private', 'court_ready'].includes(input.reviewVisibility)) throw new Error('Choose a valid entry visibility.');
  const custodyPeriod = input.custodyPeriod ?? null;
  if (custodyPeriod && !['my_time', 'their_time', 'transition', 'neutral'].includes(custodyPeriod)) throw new Error('Choose a valid custody period.');
  const importProvenance = input.importProvenance === undefined ? null : validateImportProvenance(input.importProvenance);
  if (importProvenance?.kind === 'csv_source') {
    if (input.reviewVisibility !== 'private' || input.id !== importProvenance.sourceEntryId) throw new Error('CSV source records must be private and use their original source identity.');
  } else if (importProvenance?.kind === 'csv_row') {
    const source = snapshot.entries.find((entry) => entry.id === importProvenance.sourceEntryId && entry.user_id === userId && entry.case_id === activeCase.id && !entry.deleted_at);
    const sourceProvenance = source ? getEntryMetadata(source).import_provenance : null;
    const attachment = snapshot.evidenceAttachments.find((row) => row.id === importProvenance.sourceAttachmentId && row.user_id === userId && row.case_id === activeCase.id && row.entry_id === source?.id && !row.deleted_at);
    if (!source || !attachment || attachment.file_hash !== importProvenance.fileHash) throw new Error('Preserve the original CSV in this case before importing its rows.');
    const origin = validateImportProvenance(sourceProvenance);
    if (source.child_id !== childId || origin.sourceEntryId !== source.id || origin.kind !== 'csv_source' || origin.scopeKey !== importProvenance.scopeKey || origin.fileHash !== importProvenance.fileHash || origin.sourceAttachmentId !== importProvenance.sourceAttachmentId) throw new Error('This imported row does not match its preserved CSV source.');
  }
  const custodyInterval = input.custodyInterval === undefined ? null : validateCustodyInterval(input.custodyInterval);
  const typedDetails = input.typedDetails === undefined ? null : validateTypedCaptureDetails(input.entryType, input.typedDetails);
  if (typedDetails?.kind === 'message' && typedDetails.replyToEntryId && !snapshot.entries.some((entry) => entry.id === typedDetails.replyToEntryId && entry.user_id === userId && entry.case_id === activeCase.id && !entry.deleted_at && entry.entry_type === 'message')) throw new Error('Link a message from the selected case.');
  const hashInput = [
    input.entryType,
    input.eventDate,
    normalizeTime(input.eventTime),
    title,
    body,
    nullIfBlank(input.sourceCapturedText),
    nullIfBlank(input.locationName),
    nullIfBlank(input.privateNotes),
    JSON.stringify({ caseId: activeCase.id, childId, custodyPeriod, typedDetails, custodyInterval, importProvenance, reviewVisibility: input.reviewVisibility ?? null, childMood: input.childMood ?? null, isFlagged: input.isFlagged, flagSeverity: input.flagSeverity ?? null }),
  ]
    .filter(Boolean)
    .join('\n');

  return {
    id: input.id ?? Crypto.randomUUID(),
    user_id: userId,
    case_id: activeCase.id,
    child_id: childId,
    entry_type: input.entryType,
    event_date: eventDate,
    event_time: normalizeTime(input.eventTime),
    event_end_time: null,
    custody_period: custodyPeriod,
    title,
    body,
    child_mood: input.childMood ?? null,
    is_flagged: input.isFlagged,
    flag_severity: input.isFlagged ? input.flagSeverity ?? 'review' : null,
    flag_category: input.isFlagged ? option.issueKey : null,
    issue_key: option.issueKey,
    location_name: nullIfBlank(input.locationName),
    location_lat: null,
    location_lng: null,
    metadata: {
      capture_version: 'authenticated_v1',
      ...(input.reviewVisibility ? { review_visibility: input.reviewVisibility } : {}),
      ...(importProvenance ? { import_provenance: importProvenance as unknown as Json } : {}),
      typed_capture: typedDetails as Json | null,
      custody_interval: custodyInterval as Json | null,
      entry_type_label: option.label,
      captured_body: nullIfBlank(input.sourceCapturedText) ?? body,
      source_mode: input.captureSource ?? 'manual',
      transcript_status: (input.captureSource === 'voice' || input.captureSource === 'voice_placeholder') ? 'manual_transcript' : null,
      ai_structured_interpretation_status:
        (input.captureSource === 'voice' || input.captureSource === 'voice_placeholder') ? 'not_generated' : null,
      reviewed_body_source:
        (input.captureSource === 'voice' || input.captureSource === 'voice_placeholder') ? 'manual_transcript_review' : null,
    },
    voice_transcript:
      (input.captureSource === 'voice' || input.captureSource === 'voice_placeholder') ? nullIfBlank(input.sourceCapturedText) : null,
    capture_method: input.captureSource === 'voice' ? 'voice_local' : 'manual',
    content_hash: await hashString(hashInput),
    is_edited: false,
    private_notes: nullIfBlank(input.privateNotes),
    court_ready_summary: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}

function buildCourtOrder(
  input: CourtOrderInput,
  snapshot: CaseIntelligenceSnapshot,
  userId: string,
): CourtOrder {
  const activeCase = getActiveCase(snapshot);
  if (!activeCase) {
    throw new Error('Set up a case before adding a court order shell.');
  }

  const now = new Date().toISOString();

  return {
    id: input.id ?? Crypto.randomUUID(),
    user_id: userId,
    case_id: activeCase.id,
    order_date: normalizeDate(input.orderDate),
    order_title: nullIfBlank(input.title) ?? 'Local court order shell',
    order_type: nullIfBlank(input.orderType) ?? 'manual',
    source_attachment_id: input.sourceAttachmentId ?? null,
    provisions: {
      source: 'local_manual',
      intake_status: 'manual_shell',
      document_intake_status: input.sourceAttachmentId ? 'original_linked' : 'not_provided',
    },
    created_at: snapshot.courtOrders.find((row) => row.id === input.id)?.created_at ?? now,
    updated_at: now,
    deleted_at: null,
  };
}

function buildCourtOrderProvision(
  input: CourtOrderProvisionInput,
  snapshot: CaseIntelligenceSnapshot,
  userId: string,
): CourtOrderProvision {
  const order = snapshot.courtOrders.find(
    (candidate) => candidate.id === input.courtOrderId && !candidate.deleted_at,
  );
  if (!order) {
    throw new Error('Create or select a court order before adding a provision.');
  }

  const now = new Date().toISOString();
  const status = normalizeProvisionStatus(input.status);

  return {
    id: input.id ?? Crypto.randomUUID(),
    user_id: userId,
    case_id: order.case_id,
    court_order_id: order.id,
    provision_key: provisionKeyFor(input.category, status),
    category: input.category,
    label: nullIfBlank(input.label) ?? 'Local provision',
    body: nullIfBlank(input.body) ?? 'Provision text not recorded yet.',
    effective_date: normalizeDate(input.effectiveDate),
    end_date: status === 'superseded' ? normalizeDate(input.endDate) : null,
    created_at: snapshot.courtOrderProvisions.find((row) => row.id === input.id)?.created_at ?? now,
    updated_at: now,
    deleted_at: null,
  };
}

function buildKeyDate(
  input: KeyDateInput,
  snapshot: CaseIntelligenceSnapshot,
  userId: string,
): KeyDate {
  const activeCase = getActiveCase(snapshot);
  if (!activeCase) {
    throw new Error('Set up a case before adding a key date.');
  }

  const eventDate = normalizeDate(input.eventDate);
  if (!eventDate) {
    throw new Error('Enter a key date in YYYY-MM-DD format.');
  }

  const now = new Date().toISOString();

  return {
    id: input.id ?? Crypto.randomUUID(),
    user_id: userId,
    case_id: activeCase.id,
    date_type: input.category,
    event_date: eventDate,
    event_time: normalizeTime(input.eventTime),
    title: nullIfBlank(input.title) ?? 'Local key date',
    description: buildKeyDateDescription(input.notes, input.priority),
    is_completed: false,
    related_filing_package_id: nullIfBlank(input.relatedFilingPackageId),
    related_court_order_id: null,
    created_at: snapshot.keyDates.find((row) => row.id === input.id)?.created_at ?? now,
    updated_at: now,
    deleted_at: null,
  };
}

function otherParentRole(userRole: CaseSetupUserRole) {
  if (userRole === 'petitioner') return 'respondent';
  if (userRole === 'respondent') return 'petitioner';
  return 'other_parent';
}

function localMetaForUpdate(
  table: string,
  id: string,
  localRecords: Record<string, LocalRecordMeta>,
  now: string,
) {
  return createLocalRecordMeta({
    table,
    id,
    now,
    previous: localRecords[localRecordKey(table, id)],
  });
}

function findLocalPerson(
  snapshot: CaseIntelligenceSnapshot,
  localRecords: Record<string, LocalRecordMeta>,
  caseId: string,
  predicate: (person: Person) => boolean,
) {
  return (
    snapshot.people
      .filter(isLiveRow)
      .filter((person) => person.case_id === caseId)
      .find(predicate) ??
    null
  );
}

function findLocalChild(
  snapshot: CaseIntelligenceSnapshot,
  localRecords: Record<string, LocalRecordMeta>,
  caseId: string,
) {
  return (
    snapshot.children
      .filter(isLiveRow)
      .filter((child) => child.case_id === caseId)
      .at(0) ?? null
  );
}

function findLocalSetupHearing(
  snapshot: CaseIntelligenceSnapshot,
  localRecords: Record<string, LocalRecordMeta>,
  caseId: string,
) {
  return (
    snapshot.keyDates
      .filter(isLiveRow)
      .filter((date) => date.case_id === caseId && date.date_type === 'hearing')
      .find((date) => date.description === 'Recorded during case setup.' && !date.is_completed) ?? null
  );
}

function buildCaseSetupSnapshot(
  input: CaseSetupInput,
  currentSnapshot: CaseIntelligenceSnapshot,
  currentLocalRecords: Record<string, LocalRecordMeta>,
): {
  snapshot: CaseIntelligenceSnapshot;
  localRecords: Record<string, LocalRecordMeta>;
  activeCase: FamilyBenchCase;
} {
  const now = new Date().toISOString();
  const editing = input.mode === 'edit';
  const requestedId = input.id ?? (editing ? getActiveCase(currentSnapshot)?.id : undefined);
  const existingLocalCase = requestedId ? currentSnapshot.cases.find((row) => row.id === requestedId && !row.deleted_at) : undefined;
  if (editing && (!existingLocalCase || existingLocalCase.id !== getActiveCase(currentSnapshot)?.id)) throw new Error('Open the case before editing its setup.');
  if (!editing && existingLocalCase) throw new Error('This case already exists. Open it to edit its details.');
  const caseId = requestedId ?? Crypto.randomUUID();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(caseId)) throw new Error('The case draft identity is invalid. Reopen case setup.');
  if (![input.caseName, input.childName, input.otherParentName].every((value) => value?.trim())) throw new Error('Add the case, child and other parent names.');
  const userId = getWorkspaceOwnerId();
  const hearingDate = normalizeDate(input.nextHearingDate);
  const caseName = nullIfBlank(input.caseName) ?? 'Local family case';
  const childName = nullIfBlank(input.childName) ?? 'Child';
  const otherName = nullIfBlank(input.otherParentName) ?? 'Other parent';
  const nextHearingAt = existingLocalCase?.next_hearing_at?.startsWith(hearingDate ?? 'never') ? existingLocalCase.next_hearing_at : null;
  const localRecordUpdates: Record<string, LocalRecordMeta> = {};

  const caseRecord = localMetaForUpdate('cases', caseId, currentLocalRecords, now);
  localRecordUpdates[localRecordKey('cases', caseId)] = caseRecord;

  const activeCase: FamilyBenchCase = {
    id: caseId,
    user_id: userId,
    title: caseName,
    case_number: nullIfBlank(input.caseNumber),
    court_name: nullIfBlank(input.courtName),
    department: nullIfBlank(input.department),
    judge_name: nullIfBlank(input.judgeName),
    case_type: existingLocalCase?.case_type ?? 'custody',
    status: existingLocalCase?.status ?? 'active',
    county: nullIfBlank(input.county),
    state: existingLocalCase?.state ?? null,
    is_active: existingLocalCase?.is_active ?? false,
    next_hearing_at: nextHearingAt,
    created_at: existingLocalCase?.created_at ?? now,
    updated_at: now,
    deleted_at: null,
  };

  const existingChild = findLocalChild(currentSnapshot, currentLocalRecords, caseId);
  const childInputs = input.children ?? [{ id: existingChild?.id ?? Crypto.randomUUID(), name: childName, dateOfBirth: existingChild?.date_of_birth }];
  if (!childInputs.length || new Set(childInputs.map((row) => row.id)).size !== childInputs.length) throw new Error('Add at least one child with a unique record.');
  const setupChildren: Child[] = childInputs.map((item) => {
    if (!item.name.trim() || !/^[0-9a-f-]{36}$/i.test(item.id)) throw new Error('Each child needs a name and valid identity.');
    const existing = currentSnapshot.children.find((row) => row.id === item.id);
    if (existing && (existing.case_id !== caseId || existing.user_id !== userId || existing.deleted_at)) throw new Error('A child record cannot be moved between cases.');
    localRecordUpdates[localRecordKey('children', item.id)] = localMetaForUpdate('children', item.id, currentLocalRecords, now);
    return { id: item.id, user_id: userId, case_id: caseId, name: item.name.trim(), date_of_birth: normalizeDate(item.dateOfBirth), created_at: existing?.created_at ?? now, updated_at: now, deleted_at: null };
  });

  const existingPrimaryPerson = findLocalPerson(
    currentSnapshot,
    currentLocalRecords,
    caseId,
    (person) => person.is_primary_client,
  );
  const primaryPersonId = existingPrimaryPerson?.id ?? Crypto.randomUUID();
  const primaryRecord = localMetaForUpdate('people', primaryPersonId, currentLocalRecords, now);
  localRecordUpdates[localRecordKey('people', primaryPersonId)] = primaryRecord;

  const primaryPerson: Person = {
    id: primaryPersonId,
    user_id: userId,
    case_id: caseId,
    display_name: existingPrimaryPerson?.display_name ?? 'You',
    role: input.userRole,
    relationship: 'parent',
    email: existingPrimaryPerson?.email ?? null,
    phone: existingPrimaryPerson?.phone ?? null,
    is_primary_client: true,
    notes: existingPrimaryPerson?.notes ?? null,
    created_at: existingPrimaryPerson?.created_at ?? now,
    updated_at: now,
    deleted_at: null,
  };

  const existingOtherParent = findLocalPerson(
    currentSnapshot,
    currentLocalRecords,
    caseId,
    (person) => !person.is_primary_client && person.relationship === 'parent',
  );
  const otherParentId = existingOtherParent?.id ?? Crypto.randomUUID();
  const otherParentRecord = localMetaForUpdate('people', otherParentId, currentLocalRecords, now);
  localRecordUpdates[localRecordKey('people', otherParentId)] = otherParentRecord;

  const otherParent: Person = {
    id: otherParentId,
    user_id: userId,
    case_id: caseId,
    display_name: otherName,
    role: otherParentRole(input.userRole),
    relationship: 'parent',
    email: existingOtherParent?.email ?? null,
    phone: existingOtherParent?.phone ?? null,
    is_primary_client: false,
    notes: existingOtherParent?.notes ?? null,
    created_at: existingOtherParent?.created_at ?? now,
    updated_at: now,
    deleted_at: null,
  };

  const existingHearing = findLocalSetupHearing(currentSnapshot, currentLocalRecords, caseId);
  const hearingId = existingHearing?.id ?? Crypto.randomUUID();
  const hearingRecord = (hearingDate || existingHearing)
    ? localMetaForUpdate('key_dates', hearingId, currentLocalRecords, now)
    : null;
  if (hearingRecord) {
    localRecordUpdates[localRecordKey('key_dates', hearingId)] = hearingRecord;
  }

  const hearing: KeyDate | null = hearingDate
    ? {
        id: hearingId,
        user_id: userId,
        case_id: caseId,
        date_type: 'hearing',
        event_date: hearingDate,
        event_time: existingHearing?.event_date === hearingDate ? existingHearing.event_time : null,
        title: existingHearing?.title ?? 'Next hearing',
        description: 'Recorded during case setup.',
        is_completed: false,
        related_filing_package_id: null,
        related_court_order_id: null,
        created_at: existingHearing?.created_at ?? now,
        updated_at: now,
        deleted_at: null,
      }
    : existingHearing ? { ...existingHearing, updated_at: now, deleted_at: now } : null;

  // Case setup never reparents entries or immutable evidence originals.
  const entries = currentSnapshot.entries;
  const evidenceAttachments = currentSnapshot.evidenceAttachments;
  const cases = [activeCase, ...currentSnapshot.cases.filter((row) => row.id !== caseId)];
  const children = [...setupChildren, ...currentSnapshot.children.filter((row) => !setupChildren.some((child) => child.id === row.id))];
  const people = [
    primaryPerson,
    otherParent,
    ...currentSnapshot.people.filter(
      (row) => row.id !== primaryPerson.id && row.id !== otherParent.id,
    ),
  ];
  const keyDates = [
    ...(hearing ? [hearing] : []),
    ...currentSnapshot.keyDates.filter((row) => !hearing || row.id !== hearingId),
  ];
  const localRecords = {
    ...currentLocalRecords,
    ...localRecordUpdates,
  };


  return {
    snapshot: {
      ...currentSnapshot,
      cases,
      children,
      people,
      entries,
      evidenceAttachments,
      keyDates,
    },
    localRecords,
    activeCase,
  };
}

function normalizeFilingStatus(status?: string | null): FilingPackageStatus {
  if (status === 'in_progress' || status === 'ready_for_review') return status;
  return 'draft';
}

function filingStatusLabel(status: FilingPackageStatus) {
  if (status === 'in_progress') return 'In progress';
  if (status === 'ready_for_review') return 'Ready for review';
  return 'Draft';
}

function calculateChecklistProgress(checklist: FilingChecklistState) {
  const values = Object.values(checklist);
  const completed = values.filter(Boolean).length;
  return Math.round((completed / values.length) * 100);
}

function createDefaultFilingPackageState(
  packageId: string,
  now = new Date().toISOString(),
): FilingPackageLocalState {
  return {
    packageId,
    linkedEntryIds: [],
    linkedAttachmentIds: [],
    linkedReportTypes: [],
    checklist: { ...DEFAULT_FILING_CHECKLIST_STATE },
    exhibitGroups: [
      {
        id: `${packageId}-exhibit-a`,
        label: 'Linked entries',
        entryIds: [],
        attachmentIds: [],
      },
      {
        id: `${packageId}-exhibit-b`,
        label: 'Explicit original links',
        entryIds: [],
        attachmentIds: [],
      },
    ],
    updatedAt: now,
  };
}

function syncExhibitGroups(localState: FilingPackageLocalState): FilingPackageLocalState {
  const [firstGroup, secondGroup, ...rest] =
    localState.exhibitGroups.length >= 2
      ? localState.exhibitGroups
      : createDefaultFilingPackageState(localState.packageId, localState.updatedAt).exhibitGroups;

  return {
    ...localState,
    exhibitGroups: [
      {
        ...firstGroup,
        entryIds: localState.linkedEntryIds,
        attachmentIds: [],
      },
      {
        ...secondGroup,
        entryIds: [],
        attachmentIds: localState.linkedAttachmentIds,
      },
      ...rest,
    ],
  };
}

function ensureFilingPackageState(
  filingBuilderState: FilingBuilderState,
  packageId: string,
  now = new Date().toISOString(),
) {
  return filingBuilderState.packageStates[packageId] ?? createDefaultFilingPackageState(packageId, now);
}

function updateFilingBuilderPackageState(
  filingBuilderState: FilingBuilderState,
  packageId: string,
  updater: (state: FilingPackageLocalState) => FilingPackageLocalState,
): FilingBuilderState {
  const now = new Date().toISOString();
  const current = ensureFilingPackageState(filingBuilderState, packageId, now);
  const nextPackageState = syncExhibitGroups({
    ...updater(current),
    packageId,
    updatedAt: now,
  });

  return {
    selectedPackageId: packageId,
    packageStates: {
      ...filingBuilderState.packageStates,
      [packageId]: nextPackageState,
    },
    updatedAt: now,
  };
}

function toggleString(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function updatePatternReviewState(
  patternReviewState: PatternReviewState,
  patternId: string,
  status: 'acknowledged' | 'dismissed' | 'new',
): PatternReviewState {
  const acknowledgedPatternIds = patternReviewState.acknowledgedPatternIds.filter((id) => id !== patternId);
  const dismissedPatternIds = patternReviewState.dismissedPatternIds.filter((id) => id !== patternId);

  return {
    acknowledgedPatternIds:
      status === 'acknowledged'
        ? uniqueStrings([...acknowledgedPatternIds, patternId])
        : acknowledgedPatternIds,
    dismissedPatternIds:
      status === 'dismissed' ? uniqueStrings([...dismissedPatternIds, patternId]) : dismissedPatternIds,
    updatedAt: new Date().toISOString(),
  };
}

function buildFilingPackage(
  input: CreateFilingPackageInput,
  snapshot: CaseIntelligenceSnapshot,
  userId: string,
): { filingPackage: FilingPackage; localState: FilingPackageLocalState } {
  const activeCase = getActiveCase(snapshot);
  if (!activeCase) {
    throw new Error('Set up a case before creating a filing package.');
  }

  const now = new Date().toISOString();
  const id = input.id ?? Crypto.randomUUID();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new Error('This package draft has an invalid identity. Reopen the builder.');
  if (input.status && !['draft', 'in_progress', 'ready_for_review'].includes(input.status)) throw new Error('Choose a valid preparation status.');
  const status = normalizeFilingStatus(input.status);
  const title = nullIfBlank(input.title) ?? `${filingStatusLabel(status)} filing package`;
  const localState = createDefaultFilingPackageState(id, now);

  return {
    filingPackage: {
      id,
      user_id: userId,
      case_id: activeCase.id,
      title,
      filing_type: nullIfBlank(input.filingType) ?? 'general_case_packet',
      status,
      due_date: normalizeDate(input.dueDate),
      completion_percent: calculateChecklistProgress(localState.checklist),
      court_ready_summary:
        'Preparation workspace for selected records, evidence exports and court-form review. Creating a package does not file or serve it.',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
    localState,
  };
}

function buildStaticAdvisorResponse(input: SendAdvisorMessageInput) {
  const normalized = input.prompt.toLowerCase();
  const hearing = input.upcomingHearingLabel
    ? `Upcoming hearing noted: ${input.upcomingHearingLabel}.`
    : 'No upcoming hearing date is recorded in the local case data.';
  const flagged =
    input.flaggedEntriesCount === 1
      ? 'There is 1 flagged entry available for review.'
      : `There are ${input.flaggedEntriesCount} flagged entries available for review.`;
  const contextLine = `Current case: ${input.caseTitle}. ${hearing} ${flagged}`;

  if (normalized.includes('denied visit')) {
    return `${contextLine}\n\nFor a denied-visit entry, the factual record usually benefits from the scheduled date and time, where the exchange was supposed to occur, what communication happened, who was present, and whether make-up time was offered or discussed. Keep the child-centered facts separate from conclusions about intent.\n\nThis is legal information, not legal advice.`;
  }

  if (normalized.includes('organize') || normalized.includes('court')) {
    return `${contextLine}\n\nA court-facing packet is easier to review when entries are grouped by date, issue type, and source. Start with the clearest facts, attach source references where available, and keep private notes separate from reviewed body text. The Reports preview can help identify the entries to include later.\n\nThis is legal information, not legal advice.`;
  }

  if (normalized.includes('document')) {
    return `${contextLine}\n\nUseful documentation is specific: date, time, location, people present, what was said or done, immediate impact on the child, and any follow-up communication. Link the original screenshots, documents, photos, or voice notes to the relevant entry. Check the sync status before relying on another device.\n\nThis is legal information, not legal advice.`;
  }

  if (normalized.includes('filing')) {
    return `${contextLine}\n\nFiling categories can vary by court and jurisdiction. In a custody record, people often organize facts around parenting-time enforcement, schedule changes, custody modification, support-related expenses, or response materials. Match any filing decision to local rules and qualified legal guidance.\n\nThis is legal information, not legal advice.`;
  }

  return `${contextLine}\n\nI can help organize the local record into factual questions, source entries, and next documentation steps. This placeholder does not analyze law, predict outcomes, or generate AI advice.\n\nThis is legal information, not legal advice.`;
}

function appendAdvisorExchange(
  advisorState: AdvisorConversationState,
  input: SendAdvisorMessageInput,
): AdvisorConversationState {
  const now = new Date().toISOString();
  const userMessage: AdvisorMessage = {
    id: Crypto.randomUUID(),
    role: 'user',
    body: input.prompt.trim(),
    createdAt: now,
    linkedEntryIds: [],
    prompt: input.prompt,
    localOnly: true,
  };
  const advisorMessage: AdvisorMessage = {
    id: Crypto.randomUUID(),
    role: 'advisor',
    body: buildStaticAdvisorResponse(input),
    createdAt: now,
    linkedEntryIds: input.linkedEntryIds.slice(0, 4),
    prompt: input.prompt,
    localOnly: true,
  };

  return {
    ...advisorState,
    messages: [...advisorState.messages, userMessage, advisorMessage],
    updatedAt: now,
  };
}

function appendEntry(snapshot: CaseIntelligenceSnapshot, entry: Entry): CaseIntelligenceSnapshot {
  return {
    ...snapshot,
    entries: [entry, ...snapshot.entries.filter((existing) => existing.id !== entry.id)],
  };
}

function appendAttachment(
  snapshot: CaseIntelligenceSnapshot,
  attachment: EvidenceAttachment,
): CaseIntelligenceSnapshot {
  return {
    ...snapshot,
    evidenceAttachments: [
      attachment,
      ...snapshot.evidenceAttachments.filter((existing) => existing.id !== attachment.id),
    ],
  };
}

function appendFilingPackage(
  snapshot: CaseIntelligenceSnapshot,
  filingPackage: FilingPackage,
): CaseIntelligenceSnapshot {
  return {
    ...snapshot,
    filingPackages: [
      filingPackage,
      ...snapshot.filingPackages.filter((existing) => existing.id !== filingPackage.id),
    ],
  };
}

function appendCourtOrder(
  snapshot: CaseIntelligenceSnapshot,
  courtOrder: CourtOrder,
): CaseIntelligenceSnapshot {
  return {
    ...snapshot,
    courtOrders: [
      courtOrder,
      ...snapshot.courtOrders.filter((existing) => existing.id !== courtOrder.id),
    ],
  };
}

function appendCourtOrderProvision(
  snapshot: CaseIntelligenceSnapshot,
  provision: CourtOrderProvision,
): CaseIntelligenceSnapshot {
  return {
    ...snapshot,
    courtOrderProvisions: [
      provision,
      ...snapshot.courtOrderProvisions.filter((existing) => existing.id !== provision.id),
    ],
  };
}

function updateCourtOrderRow(
  snapshot: CaseIntelligenceSnapshot,
  orderId: string,
  input: CourtOrderInput,
): CaseIntelligenceSnapshot {
  const now = new Date().toISOString();

  return {
    ...snapshot,
    courtOrders: snapshot.courtOrders.map((order) =>
      order.id === orderId
        ? {
            ...order,
            order_title: nullIfBlank(input.title) ?? order.order_title,
            source_attachment_id: input.sourceAttachmentId === undefined ? order.source_attachment_id : input.sourceAttachmentId,
            order_type: nullIfBlank(input.orderType) ?? order.order_type,
            order_date: normalizeDate(input.orderDate),
            updated_at: now,
          }
        : order,
    ),
  };
}

function updateCourtOrderProvisionRow(
  snapshot: CaseIntelligenceSnapshot,
  provisionId: string,
  input: CourtOrderProvisionInput,
): CaseIntelligenceSnapshot {
  const now = new Date().toISOString();
  const status = normalizeProvisionStatus(input.status);

  return {
    ...snapshot,
    courtOrderProvisions: snapshot.courtOrderProvisions.map((provision) =>
      provision.id === provisionId
        ? {
            ...provision,
            court_order_id: input.courtOrderId,
            provision_key: provisionKeyFor(input.category, status),
            category: input.category,
            label: nullIfBlank(input.label) ?? provision.label,
            body: nullIfBlank(input.body) ?? provision.body,
            effective_date: normalizeDate(input.effectiveDate),
            end_date:
              status === 'superseded' ? normalizeDate(input.endDate) : null,
            updated_at: now,
          }
        : provision,
    ),
  };
}

function appendKeyDate(snapshot: CaseIntelligenceSnapshot, keyDate: KeyDate): CaseIntelligenceSnapshot {
  return {
    ...snapshot,
    keyDates: [keyDate, ...snapshot.keyDates.filter((existing) => existing.id !== keyDate.id)],
  };
}

function updateKeyDateRow(
  snapshot: CaseIntelligenceSnapshot,
  keyDateId: string,
  input: KeyDateInput,
): CaseIntelligenceSnapshot {
  const eventDate = normalizeDate(input.eventDate);
  const now = new Date().toISOString();

  return {
    ...snapshot,
    keyDates: snapshot.keyDates.map((keyDate) =>
      keyDate.id === keyDateId
        ? {
            ...keyDate,
            date_type: input.category,
            event_date: eventDate ?? keyDate.event_date,
            event_time: normalizeTime(input.eventTime),
            title: nullIfBlank(input.title) ?? keyDate.title,
            description: buildKeyDateDescription(input.notes, input.priority),
            related_filing_package_id: nullIfBlank(input.relatedFilingPackageId),
            updated_at: now,
          }
        : keyDate,
    ),
  };
}

function updateFilingPackageRow(
  snapshot: CaseIntelligenceSnapshot,
  packageId: string,
  patch: Partial<FilingPackage>,
): CaseIntelligenceSnapshot {
  return {
    ...snapshot,
    filingPackages: snapshot.filingPackages.map((filingPackage) =>
      filingPackage.id === packageId
        ? {
            ...filingPackage,
            ...patch,
            updated_at: new Date().toISOString(),
          }
        : filingPackage,
    ),
  };
}

function updateEntryInSnapshot(
  snapshot: CaseIntelligenceSnapshot,
  entryId: string,
  patch: EntryReviewPatch,
  localMeta?: LocalRecordMeta,
): CaseIntelligenceSnapshot {
  const now = new Date().toISOString();

  return {
    ...snapshot,
    entries: snapshot.entries.map((entry) => {
      if (entry.id !== entryId) return entry;

      const currentMetadata = getEntryMetadata(entry);
      const hasBodyPatch = Object.prototype.hasOwnProperty.call(patch, 'body');
      const body = hasBodyPatch ? patch.body ?? null : entry.body;
      const reviewedAt = patch.reviewed
        ? currentMetadata.reviewed_at ?? now
        : patch.reviewed === false
          ? null
          : currentMetadata.reviewed_at ?? null;

      const updatedEntry: Entry = {
        ...entry,
        body,
        is_edited: hasBodyPatch ? true : entry.is_edited,
        updated_at: now,
        metadata: {
          ...currentMetadata,
          captured_body: Object.prototype.hasOwnProperty.call(currentMetadata, 'captured_body') ? currentMetadata.captured_body : entry.body,
          client_review_revisions: [...(Array.isArray(currentMetadata.client_review_revisions) ? currentMetadata.client_review_revisions : []), {
            body: entry.body, reviewed_at: currentMetadata.reviewed_at ?? null,
            review_visibility: currentMetadata.review_visibility ?? null,
            replaced_at: now,
          }],
          reviewed_at: reviewedAt,
          reviewed_body_updated_at: hasBodyPatch ? now : currentMetadata.reviewed_body_updated_at,
          review_visibility: patch.reviewVisibility ?? currentMetadata.review_visibility,
        },
      };

      return localMeta ? withEntryLocalMeta(updatedEntry, localMeta) : updatedEntry;
    }),
  };
}

function updateEntryProvisionLinkInSnapshot(
  snapshot: CaseIntelligenceSnapshot,
  entryId: string,
  provisionId: string | null,
  localMeta?: LocalRecordMeta,
): CaseIntelligenceSnapshot {
  const now = new Date().toISOString();
  const provision = provisionId
    ? snapshot.courtOrderProvisions.find(
        (candidate) => candidate.id === provisionId && !candidate.deleted_at,
      ) ?? null
    : null;

  return {
    ...snapshot,
    entries: snapshot.entries.map((entry) => {
      if (entry.id !== entryId) return entry;

      const currentMetadata = getEntryMetadata(entry);
      const updatedEntry: Entry = {
        ...entry,
        updated_at: now,
        metadata: {
          ...currentMetadata,
          linked_court_order_provision_id: provision?.id ?? null,
          linked_court_order_provision_label: provision?.label ?? null,
          linked_court_order_provision_status: provision
            ? getCourtOrderProvisionStatus(provision)
            : null,
          linked_court_order_provision_relevance: provision ? 'local_manual' : null,
          linked_court_order_provision_updated_at: now,
          provision_compliance_status: provision ? 'placeholder_not_assessed' : null,
        },
      };

      return localMeta ? withEntryLocalMeta(updatedEntry, localMeta) : updatedEntry;
    }),
  };
}

function workspaceFromDocument(value: unknown) {
  const { selectedCaseId: _selectedCaseId, ...workspace } = normalizeWorkspaceState(value);
  return workspace;
}
function currentCaseContext(state: CaseIntelligenceState): CaseWorkspaceContext {
  return { reportPreviewState: state.reportPreviewState, advisorState: state.advisorState, filingBuilderState: state.filingBuilderState, patternReviewState: state.patternReviewState };
}
function emptyCaseContext(): CaseWorkspaceContext {
  return { reportPreviewState: { ...DEFAULT_REPORT_PREVIEW_STATE }, advisorState: { ...DEFAULT_ADVISOR_STATE, messages: [] }, filingBuilderState: { ...DEFAULT_FILING_BUILDER_STATE, packageStates: {} }, patternReviewState: { ...DEFAULT_PATTERN_REVIEW_STATE, acknowledgedPatternIds: [], dismissedPatternIds: [] } };
}

function quarantineWorkspaceContext(value: unknown, snapshot: CaseIntelligenceSnapshot, source: PreservedWorkspaceContext['source'], set: (patch: Partial<CaseIntelligenceState>) => void, get: () => CaseIntelligenceState): boolean {
  const ownerId = get().ownerId!;
  const issues = inspectWorkspaceContext(value, snapshot, ownerId);
  if (!issues.length) return false;
  const raw = JSON.parse(JSON.stringify(value ?? {})) as Json;
  const existing = get().contextRecovery.find((copy) => copy.ownerId === ownerId && JSON.stringify(copy.raw) === JSON.stringify(raw));
  const copy: PreservedWorkspaceContext = { id: existing?.id ?? Crypto.randomUUID(), ownerId, observedAt: existing?.observedAt ?? new Date().toISOString(), source, resolvedAt: null, issues, raw };
  let safe;
  try { safe = normalizeWorkspaceState(safeContextInput(value, issues)); } catch { safe = normalizeWorkspaceState({}); }
  const displaySnapshot = source === 'switch' ? get().snapshot : snapshot;
  const selectedCaseId = source === 'switch' ? getActiveCase(displaySnapshot)?.id ?? null : getActiveCase({ ...snapshot, selectedCaseId: safe.selectedCaseId })?.id ?? null;
  if (source === 'switch') Object.assign(safe, safe.caseWorkspaceStates[selectedCaseId ?? ''] ?? emptyCaseContext());
  set({ ...safe, snapshot: { ...displaySnapshot, selectedCaseId }, contextRecovery: [...get().contextRecovery.filter((item) => item.id !== copy.id), copy], contextError: 'Saved view selections contain invalid case links or unsupported fields. The original context is preserved on this device; affected conversations, reports and filing selections are hidden. Case records remain available.', workspaceJSON: JSON.stringify(value ?? {}) });
  return true;
}

async function commitSelectedCase(snapshot: CaseIntelligenceSnapshot, records: Record<string, LocalRecordMeta>, caseId: string, set: (patch: Partial<CaseIntelligenceState>) => void, get: () => CaseIntelligenceState) {
  const before = get();
  const owner = requireReadyWorkspace(before);
  const epoch = workspaceEpoch;
  if (before.saving || before.syncing) throw new Error('Wait for saving and sync to finish before changing cases.');
  const oldCaseId = getActiveCase(before.snapshot)?.id;
  const contexts = { ...before.caseWorkspaceStates, ...(oldCaseId ? { [oldCaseId]: currentCaseContext(before) } : {}) };
  const context = oldCaseId === caseId ? currentCaseContext(before) : contexts[caseId] ?? emptyCaseContext();
  const next = { ...before, ...context, snapshot: { ...snapshot, selectedCaseId: caseId }, caseWorkspaceStates: contexts };
  const workspace = workspaceState(next);
  if (quarantineWorkspaceContext(workspace, next.snapshot, 'switch', set, get)) {
    await persistStateSnapshot(get().snapshot, get().reportPreviewState, get().advisorState, get().localRecords, set, get, true);
    throw new Error('Working context needs review before switching. Its original copy has been preserved.');
  }
  const key = localRecordKey('case_workspace_state', owner);
  const localRecords = before.contextError ? records : { ...records, [key]: createLocalRecordMeta({ table: 'case_workspace_state', id: owner, previous: records[key] }) };
  set({ switchingCase: true, saving: before.saving + 1 });
  try {
    const result = await writePersistedCaseIntelligence({ ownerId: owner, snapshot: next.snapshot, ...workspace, localRecords, contextRecovery: before.contextRecovery, contextError: before.contextError });
    if (!isActiveWorkspace(owner, epoch)) throw new Error('Account changed while saving the case.');
    set({ ...context, snapshot: next.snapshot, caseWorkspaceStates: workspace.caseWorkspaceStates, localRecords, workspaceJSON: JSON.stringify(workspace), hasPersistedSnapshot: true, source: 'local', persistence: { ...get().persistence, adapter: result.adapter, lastPersistedAt: result.savedAt, error: null } });
  } catch (error) {
    if (isActiveWorkspace(owner, epoch)) set({ persistence: { ...get().persistence, error: error instanceof Error ? error.message : 'Unable to save the selected case.' } });
    throw error;
  } finally {
    if (isActiveWorkspace(owner, epoch)) set({ switchingCase: false, saving: Math.max(0, get().saving - 1) });
  }
  queueMicrotask(() => { if (isActiveWorkspace(owner, epoch)) void get().sync(); });
}

/** Publish a filing mutation only after storage accepts it, so retrying a toggle
 * after failure cannot reverse an unsaved optimistic change. */
async function commitFilingState(snapshot: CaseIntelligenceSnapshot, filingBuilderState: FilingBuilderState, changedPackageId: string | null, set: (patch: Partial<CaseIntelligenceState>) => void, get: () => CaseIntelligenceState) {
  const before = get(); const owner = requireReadyWorkspace(before); const epoch = workspaceEpoch;
  if (before.saving || before.syncing) throw new Error('Wait for the current save and sync to finish, then try again.');
  if (before.contextError) throw new Error('Review the preserved working-context issue in Settings before changing filing selections.');
  const workspace = workspaceState({ ...before, snapshot, filingBuilderState });
  if (inspectWorkspaceContext(workspace, snapshot, owner).length) throw new Error('This package contains unavailable case links. Review the working context in Settings.');
  const records = { ...before.localRecords };
  if (changedPackageId) { const key = localRecordKey('filing_packages', changedPackageId); records[key] = createLocalRecordMeta({ table: 'filing_packages', id: changedPackageId, previous: records[key] }); }
  const workspaceKey = localRecordKey('case_workspace_state', owner);
  records[workspaceKey] = createLocalRecordMeta({ table: 'case_workspace_state', id: owner, previous: records[workspaceKey] });
  set({ saving: before.saving + 1, switchingCase: true });
  try {
    const result = await writePersistedCaseIntelligence({ ownerId: owner, snapshot, ...workspace, localRecords: records, contextRecovery: before.contextRecovery, contextError: before.contextError });
    if (!isActiveWorkspace(owner, epoch)) throw new Error('The account changed while saving this package. Reopen the current case.');
    set({ snapshot, filingBuilderState, caseWorkspaceStates: workspace.caseWorkspaceStates, localRecords: records, workspaceJSON: JSON.stringify(workspace), source: 'local', hasPersistedSnapshot: true, persistence: { ...get().persistence, adapter: result.adapter, lastPersistedAt: result.savedAt, error: null } });
  } catch (error) {
    if (isActiveWorkspace(owner, epoch)) set({ persistence: { ...get().persistence, error: error instanceof Error ? error.message : 'Unable to save this package.' } });
    throw error;
  } finally { if (isActiveWorkspace(owner, epoch)) set({ saving: Math.max(0, get().saving - 1), switchingCase: false }); }
  queueMicrotask(() => { if (isActiveWorkspace(owner, epoch)) void get().sync(); });
}

function applyWorkspaceState(value: unknown, set: (patch: Partial<CaseIntelligenceState>) => void, get: () => CaseIntelligenceState, source: PreservedWorkspaceContext['source'] = 'cloud', snapshot = get().snapshot) {
  if (quarantineWorkspaceContext(value, snapshot, source, set, get)) return;
  const { selectedCaseId, ...workspace } = normalizeWorkspaceState(value);
  set({ ...workspace, snapshot: { ...snapshot, selectedCaseId: selectedCaseId ?? getActiveCase(snapshot)?.id ?? null }, contextError: null });
  set({ workspaceJSON: JSON.stringify(workspaceState(get())) });
}

function applyCloudWorkspace(cloud: Awaited<ReturnType<typeof fetchCloudWorkspace>>, set: (patch: Partial<CaseIntelligenceState>) => void, get: () => CaseIntelligenceState) {
  const current = get();
  const snapshot = emptyCaseSnapshot();
  const records = { ...current.localRecords };
  const versions = new Map(cloud.versions.map((v) => [`${v.table_name}:${v.record_id}`, v]));
  for (const [table, collection] of SYNC_TABLES) {
    const local = new Map((current.snapshot[collection] as unknown as SyncRow[]).map((row) => [row.id, row]));
    const result: SyncRow[] = [];
    for (const row of cloud.snapshot[collection]) {
      const key = localRecordKey(table, row.id);
      const meta = records[key];
      const version = versions.get(key);
      const pending = meta && meta.sync_status !== 'synced' && meta.mutation_id !== version?.mutation_id;
      const localRow = local.get(row.id);
      if (pending && localRow) result.push(localRow);
      else {
        let next: SyncRow = row;
        if (table === 'attachments' && localRow && localRow.file_hash === (row as EvidenceAttachment).file_hash) {
          const exif = localRow.exif as Record<string, unknown> | null;
          next = { ...row, exif: { ...((row as EvidenceAttachment).exif as object), ...(exif?.local_evidence_key ? { local_evidence_key: exif.local_evidence_key } : {}) } };
        }
        result.push(next);
        records[key] = { table, id: row.id, local_created_at: meta?.local_created_at ?? row.created_at, local_updated_at: 'updated_at' in row ? row.updated_at : row.created_at, sync_status: 'synced', server_version: version?.version ?? 0, mutation_id: version?.mutation_id, error: null };
      }
      local.delete(row.id);
    }
    for (const row of local.values()) {
      const meta = records[localRecordKey(table, row.id)];
      if (meta && meta.sync_status !== 'synced') result.push(row);
    }
    (snapshot[collection] as unknown as SyncRow[]) = result;
  }
  const owner = current.ownerId!;
  const key = localRecordKey('case_workspace_state', owner);
  const meta = records[key];
  const version = versions.get(key);
  if (cloud.workspace && (!meta || meta.sync_status === 'synced' || meta.mutation_id === version?.mutation_id)) {
    applyWorkspaceState(cloud.workspace, set, get, 'cloud', snapshot);
    records[key] = { table: 'case_workspace_state', id: owner, local_created_at: meta?.local_created_at ?? new Date().toISOString(), local_updated_at: new Date().toISOString(), sync_status: 'synced', server_version: version?.version ?? 0, mutation_id: version?.mutation_id };
  }
  snapshot.selectedCaseId = get().snapshot.selectedCaseId;
  const selected = getActiveCase(snapshot)?.id ?? null;
  if (snapshot.selectedCaseId && selected !== snapshot.selectedCaseId) set(get().caseWorkspaceStates[selected ?? ''] ?? emptyCaseContext());
  snapshot.selectedCaseId = selected;
  set({ snapshot, localRecords: records, source: Object.values(records).some((r) => r.sync_status !== 'synced') ? 'local' : 'supabase' });
  if (!get().contextError) quarantineWorkspaceContext(workspaceState(get()), snapshot, 'cloud', set, get);
}

function workspaceState(state: CaseIntelligenceState) {
  const selectedCaseId = getActiveCase(state.snapshot)?.id ?? null;
  return {
    selectedCaseId,
    caseWorkspaceStates: { ...state.caseWorkspaceStates, ...(selectedCaseId ? { [selectedCaseId]: currentCaseContext(state) } : {}) },
    reportPreviewState: state.reportPreviewState, savedReportVersions: state.savedReportVersions, courtFormDrafts: state.courtFormDrafts,
    advisorState: state.advisorState, filingBuilderState: state.filingBuilderState,
    patternReviewState: state.patternReviewState, conflictHistory: state.conflictHistory,
  };
}

async function persistStateSnapshot(
  snapshot: CaseIntelligenceSnapshot,
  reportPreviewState: ReportPreviewState,
  advisorState: AdvisorConversationState,
  localRecords: Record<string, LocalRecordMeta>,
  set: (patch: Partial<CaseIntelligenceState>) => void,
  get: () => CaseIntelligenceState,
  required = false,
): Promise<boolean> {
  const ownerId = get().ownerId;
  const epoch = workspaceEpoch;
  if (!ownerId || !isActiveWorkspace(ownerId, epoch) || get().storageBlocked) {
    if (required) throw new Error('Open your account workspace before saving.');
    return false;
  }
  if (!get().contextError && quarantineWorkspaceContext(workspaceState(get()), snapshot, 'save', set, get)) { snapshot = get().snapshot; reportPreviewState = get().reportPreviewState; advisorState = get().advisorState; }
  const state = get();
  const json = JSON.stringify(workspaceState(state));
  const workspaceKey = localRecordKey('case_workspace_state', ownerId);
  if (!state.contextError && (state.workspaceJSON !== json || !localRecords[workspaceKey]) && snapshot.cases.length) {
    localRecords = { ...localRecords, [workspaceKey]: createLocalRecordMeta({ table: 'case_workspace_state', id: ownerId, previous: localRecords[workspaceKey] }) };
    set({ localRecords, workspaceJSON: json });
  }
  set({ saving: get().saving + 1 });
  try {
    const { adapter, savedAt } = await writePersistedCaseIntelligence({
      ownerId, snapshot, reportPreviewState, advisorState, localRecords,
      selectedCaseId: snapshot.selectedCaseId, caseWorkspaceStates: workspaceState(state).caseWorkspaceStates,
      contextRecovery: state.contextRecovery, contextError: state.contextError,
      savedReportVersions: state.savedReportVersions, courtFormDrafts: state.courtFormDrafts,
      filingBuilderState: state.filingBuilderState,
      patternReviewState: state.patternReviewState, conflictHistory: state.conflictHistory,
    });
    if (!isActiveWorkspace(ownerId, epoch)) throw new Error('Account changed while saving. Your original account’s data remains separate.');
    set({ hasPersistedSnapshot: true, persistence: { ...get().persistence, adapter, hydrationCompleted: true, lastPersistedAt: savedAt, error: null } });
    if (!get().syncing) queueMicrotask(() => { if (isActiveWorkspace(ownerId, epoch)) void get().sync(); });
    return true;
  } catch (err) {
    if (isActiveWorkspace(ownerId, epoch)) set({ persistence: { ...get().persistence, error: err instanceof Error ? err.message : 'Unable to save your changes on this device.' } });
    if (required) throw err;
    return false;
  } finally {
    if (isActiveWorkspace(ownerId, epoch)) set({ saving: Math.max(0, get().saving - 1) });
  }
}

function requireSelectedCaseRow(state: CaseIntelligenceState, collection: 'entries' | 'evidenceAttachments' | 'courtOrders' | 'courtOrderProvisions' | 'filingPackages' | 'keyDates', id: string) {
  const owner = requireReadyWorkspace(state);
  const row = state.snapshot[collection].find((item) => item.id === id);
  if (!row || row.deleted_at || row.user_id !== owner || row.case_id !== getActiveCase(state.snapshot)?.id) throw new Error('Choose a record from the selected case.');
  return row;
}
function guardNewRecordId(state: CaseIntelligenceState, collection: 'courtOrders' | 'courtOrderProvisions' | 'keyDates', id?: string) {
  if (id && state.snapshot[collection].some((row) => row.id === id)) requireSelectedCaseRow(state, collection, id);
}

function requireReadyWorkspace(state: CaseIntelligenceState): string {
  const owner = getWorkspaceOwnerId();
  if (state.ownerId !== owner || state.loading || !state.hasLoaded || state.storageBlocked || state.switchingCase) throw new Error('Your workspace is not ready. Wait for it to load or resolve the storage error.');
  return owner;
}

export const useCaseIntelligenceStore = create<CaseIntelligenceState>((set, get) => ({
  ownerId: null, storageBlocked: false, saving: 0, switchingCase: false, caseWorkspaceStates: {}, contextRecovery: [], contextError: null, syncing: false, syncError: null, conflicts: [], conflictHistory: [], workspaceJSON: '',
  resetAffectedViewSelections: async () => {
    const owner = requireReadyWorkspace(get());
    const epoch = workspaceEpoch;
    const before = get();
    if (!before.contextError) return;
    if (before.saving || before.syncing) throw new Error('Wait for the current save or sync to finish.');
    const contextRecovery = before.contextRecovery.map((copy) => ({ ...copy, resolvedAt: copy.resolvedAt ?? new Date().toISOString() }));
    const workspace = workspaceState(before);
    const key = localRecordKey('case_workspace_state', owner);
    const localRecords = { ...before.localRecords, [key]: createLocalRecordMeta({ table: 'case_workspace_state', id: owner, previous: before.localRecords[key] }) };
    set({ switchingCase: true, saving: before.saving + 1 });
    try {
      const result = await writePersistedCaseIntelligence({ ownerId: owner, snapshot: before.snapshot, ...workspace, localRecords, contextRecovery, contextError: null });
      if (!isActiveWorkspace(owner, epoch)) throw new Error('Account changed while saving repaired view selections.');
      set({ contextRecovery, contextError: null, localRecords, workspaceJSON: JSON.stringify(workspace), persistence: { ...get().persistence, adapter: result.adapter, lastPersistedAt: result.savedAt, error: null } });
    } finally { if (isActiveWorkspace(owner, epoch)) set({ switchingCase: false, saving: Math.max(0, get().saving - 1) }); }
    queueMicrotask(() => { if (isActiveWorkspace(owner, epoch)) void get().sync(); });
  },
  retrySave: async () => {
    if (get().storageBlocked) { await get().load(); return; }
    await persistStateSnapshot(get().snapshot, get().reportPreviewState, get().advisorState, get().localRecords, set, get, true);
    await get().sync();
  },
  resolveConflict: async (key, keepLocal) => {
    const owner = requireReadyWorkspace(get());
    const epoch = workspaceEpoch;
    const conflict = get().conflicts.find((item) => item.key === key);
    if (!conflict) return;
    const history = get().conflictHistory;
    const resolution: ResolvedSyncConflict = { ...conflict, local: conflictRecordCopy(conflict.local)!, remote: conflictRecordCopy(conflict.remote), resolutionId: Crypto.randomUUID(), resolvedAt: new Date().toISOString(), choice: keepLocal ? 'device' : 'cloud' };
    const records = { ...get().localRecords };
    const existing = records[key];
    if (!existing) throw new Error('This conflict is no longer available. Refresh your workspace.');
    if (keepLocal) {
      records[key] = { ...createLocalRecordMeta({ table: conflict.table, id: existing.id, previous: existing }), server_version: conflict.version };
    } else {
      if (!conflict.remote) throw new Error('The cloud record is unavailable. Keep your local copy and contact support.');
      const collection = SYNC_TABLES.find(([table]) => table === conflict.table)?.[1];
      if (collection) {
        const snapshot = { ...get().snapshot };
        (snapshot[collection] as unknown as SyncRow[]) = (snapshot[collection] as unknown as SyncRow[]).map((row) => row.id === existing.id ? conflict.remote! : row);
        set({ snapshot });
      } else if (conflict.table === 'case_workspace_state') {
        applyWorkspaceState(conflict.remote.state, set, get, 'conflict');
      }
      records[key] = { ...existing, server_version: conflict.version, sync_status: 'synced', error: null };
    }
    const mergedHistory = new Map([...history, ...get().conflictHistory, resolution].map((item) => [item.resolutionId, item]));
    set({ conflictHistory: [...mergedHistory.values()], localRecords: records, conflicts: get().conflicts.filter((item) => item.key !== key), syncError: null });
    if (getWorkspaceOwnerId() !== owner) return;
    await persistStateSnapshot(get().snapshot, get().reportPreviewState, get().advisorState, records, set, get, true);
  },
  sync: async () => {
    const owner = get().ownerId;
    const epoch = workspaceEpoch;
    if (!owner || get().syncing || get().loading || get().storageBlocked || get().saving || get().persistence.error || get().conflicts.length) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine) { set({ syncError: 'Offline. Verified local changes are waiting to sync.' }); return; }
    set({ syncing: true, syncError: null });
    let submitted: SyncChange[] = [];
    try {
      requireReadyWorkspace(get());
      const submit = async (changes: SyncChange[]) => {
        for (let i = 0; i < changes.length; i += 100) {
          submitted = changes.slice(i, i + 100);
          const receipts = await sendCloudChanges(owner, submitted);
          if (!isActiveWorkspace(owner, epoch)) throw new Error('Account changed during sync.');
          set({ localRecords: mergeSyncReceipts(get().localRecords, receipts) });
          await persistStateSnapshot(get().snapshot, get().reportPreviewState, get().advisorState, get().localRecords, set, get, true);
        }
      };
      // Observe foreign-key order, including original uploads before orders
      // that reference those attachments. Capture each table's current edits.
      for (const [table] of SYNC_TABLES) {
        if (table === 'attachments') {
          for (const attachment of [...get().snapshot.evidenceAttachments]) {
            const meta = get().localRecords[localRecordKey('attachments', attachment.id)];
            if (!meta || meta.sync_status === 'synced') continue;
            const verified = await uploadEvidenceOriginal(attachment, owner);
            if (!isActiveWorkspace(owner, epoch)) return;
            set({ snapshot: appendAttachment(get().snapshot, verified) });
            // Persist verification metadata before submitting, so an ambiguous
            // response can replay the exact same mutation payload after restart.
            await persistStateSnapshot(get().snapshot, get().reportPreviewState, get().advisorState, get().localRecords, set, get, true);
            await submit(prepareSyncChanges(get().snapshot, get().localRecords, owner, true).filter((c) => c.table_name === table && c.row.id === attachment.id));
          }
        } else await submit(prepareSyncChanges(get().snapshot, get().localRecords, owner).filter((c) => c.table_name === table));
      }
      const workspaceKey = localRecordKey('case_workspace_state', owner);
      const workspaceMeta = get().localRecords[workspaceKey];
      if (!get().contextError && workspaceMeta && workspaceMeta.sync_status !== 'synced') {
        await submit([{ table_name: 'case_workspace_state', row: { id: owner, user_id: owner, state: workspaceState(get()), created_at: workspaceMeta.local_created_at, updated_at: workspaceMeta.local_updated_at }, expected_version: workspaceMeta.server_version ?? 0, mutation_id: workspaceMeta.mutation_id! }]);
      }
      const cloud = await fetchCloudWorkspace(owner);
      if (!isActiveWorkspace(owner, epoch)) return;
      applyCloudWorkspace(cloud, set, get);
      await persistStateSnapshot(get().snapshot, get().reportPreviewState, get().advisorState, get().localRecords, set, get, true);
    } catch (err) {
      if (!isActiveWorkspace(owner, epoch)) return;
      const message = err instanceof Error ? err.message : 'Sync could not finish. Your saved changes remain on this device.';
      if (message.includes('SYNC_CONFLICT')) {
        try {
          const cloud = await fetchCloudWorkspace(owner);
          if (!isActiveWorkspace(owner, epoch)) return;
          const conflicts = findSyncConflicts(submitted, cloud.rows, cloud.versions);
          set({ conflicts, syncError: 'Changes from another device need review. Both copies are preserved until you choose.' });
        } catch { set({ syncError: 'Unable to load conflicting changes. Your local records are preserved. Retry when online.' }); }
      } else set({ syncError: message });
    } finally { if (isActiveWorkspace(owner, epoch)) set({ syncing: false }); }
  },
  snapshot: emptyCaseSnapshot(),
  source: 'fallback',
  reportPreviewState: DEFAULT_REPORT_PREVIEW_STATE,
  savedReportVersions: DEFAULT_SAVED_REPORT_VERSIONS,
  courtFormDrafts: [],
  advisorState: DEFAULT_ADVISOR_STATE,
  filingBuilderState: DEFAULT_FILING_BUILDER_STATE,
  patternReviewState: DEFAULT_PATTERN_REVIEW_STATE,
  localRecords: {},
  persistence: createPersistenceDiagnostics(),
  loading: false,
  hasLoaded: false,
  hasHydrated: false,
  hasPersistedSnapshot: false,
  error: null,
  load: async () => {
    const owner = getWorkspaceOwnerId();
    const epoch = workspaceEpoch;
    if (get().loading || !isActiveWorkspace(owner, epoch)) return;
    set({ loading: true, storageBlocked: false, error: null });
    try {
      if (!releaseWorkspaceLease) {
        const release = await acquireWorkspaceLease(owner);
        if (!isActiveWorkspace(owner, epoch)) { release(); return; }
        releaseWorkspaceLease = release;
      }
      const local = await readPersistedCaseIntelligence(owner);
      if (!isActiveWorkspace(owner, epoch)) return;
      if (local.document) {
        const document = local.document;
        if ((document.contextRecovery ?? []).some((copy) => copy.ownerId !== owner)) throw new Error('Saved context recovery copies belong to another account. The original document has not been changed.');
        set({ snapshot: { ...document.snapshot, selectedCaseId: document.selectedCaseId ?? document.snapshot.selectedCaseId }, localRecords: document.localRecords, contextRecovery: document.contextRecovery ?? [], contextError: document.contextError ?? null, source: 'local', hasPersistedSnapshot: true });
        applyWorkspaceState(document.unvalidatedWorkspaceState ?? extractWorkspaceContext(document as unknown as Record<string, unknown>), set, get, 'local');
        if (document.contextError) set({ contextError: 'Saved view selections need review. Original context copies are preserved on this device. Case records remain available.' });
      }
      set({ hasHydrated: true, persistence: createPersistenceDiagnostics({ adapter: local.adapter, hydrationCompleted: true, lastHydratedAt: new Date().toISOString(), lastPersistedAt: local.document?.savedAt, error: local.warning ?? null }) });
      set({ workspaceJSON: JSON.stringify(workspaceState(get())) });
    } catch (err) {
      if (!isActiveWorkspace(owner, epoch)) return;
      set({ loading: false, hasLoaded: true, hasHydrated: true, storageBlocked: true, error: err instanceof Error ? err.message : 'Unable to open saved data. It has not been overwritten.' });
      return;
    }
    try {
      const cloud = await fetchCloudWorkspace(owner);
      if (!isActiveWorkspace(owner, epoch)) return;
      applyCloudWorkspace(cloud, set, get);
    } catch (err) {
      if (!isActiveWorkspace(owner, epoch)) return;
      set({ syncError: err instanceof Error ? err.message : 'Cloud is unavailable. Working from this device.' });
    }
    if (!isActiveWorkspace(owner, epoch)) return;
    set({ loading: false, hasLoaded: true });
    await persistStateSnapshot(get().snapshot, get().reportPreviewState, get().advisorState, get().localRecords, set, get);
  },
  clearLocalCaseData: async () => {
    const owner = requireReadyWorkspace(get());
    const epoch = workspaceEpoch;
    if (get().contextRecovery.length) throw new Error('This device has preserved context recovery copies that are not synced to the cloud. Keep its private archive before arranging removal of this cache.');
    if (Object.values(get().localRecords).some((r) => r.sync_status !== 'synced')) throw new Error('Sync your pending changes before clearing this device.');
    if (get().saving || get().syncing) throw new Error('Wait for saving and sync to finish first.');
    set({ loading: true });
    try {
      await clearLocalEvidence(owner);
      await clearPersistedCaseIntelligence(owner);
      if (!isActiveWorkspace(owner, epoch)) return;
      resetWorkspace(owner);
      await get().load();
    } finally { if (isActiveWorkspace(owner, epoch)) set({ loading: false }); }
  },
  switchCase: async (caseId) => {
    const owner = requireReadyWorkspace(get());
    const current = get();
    if (!current.snapshot.cases.some((row) => row.id === caseId && row.user_id === owner && !row.deleted_at)) throw new Error('This case is not available in your account.');
    if (getActiveCase(current.snapshot)?.id === caseId) return;
    await commitSelectedCase(current.snapshot, current.localRecords, caseId, set, get);
  },
  saveCaseSetup: async (input) => {
    requireReadyWorkspace(get());
    const current = get();
    const built = buildCaseSetupSnapshot(input, current.snapshot, current.localRecords);
    await commitSelectedCase(built.snapshot, built.localRecords, built.activeCase.id, set, get);
    return { case: built.activeCase, source: 'local' };
  },
  createEntry: async (input) => {
    const owner = requireReadyWorkspace(get());
    const epoch = workspaceEpoch;
    const entry = await buildEntry(input, get().snapshot, owner);
    if (!isActiveWorkspace(owner, epoch) || get().switchingCase || getActiveCase(get().snapshot)?.id !== entry.case_id) throw new Error('Account or case changed while preparing the entry.');
    const existing = get().snapshot.entries.find((row) => row.id === entry.id);
    if (existing) {
      if (existing.user_id !== owner || existing.case_id !== entry.case_id || existing.deleted_at || existing.content_hash !== entry.content_hash) throw new Error('This draft already has an entry. Open that entry to edit its saved text.');
      await persistStateSnapshot(get().snapshot, get().reportPreviewState, get().advisorState, get().localRecords, set, get, true);
      return { entry: existing, source: 'local', warning: 'Entry saved. Any pending evidence can now be retried.' };
    }
    const meta = createLocalRecordMeta({ table: 'entries', id: entry.id });
    const localEntry = withEntryLocalMeta(entry, meta);
    set({ snapshot: appendEntry(get().snapshot, localEntry), source: 'local', localRecords: { ...get().localRecords, [localRecordKey('entries', entry.id)]: meta } });
    await persistStateSnapshot(get().snapshot, get().reportPreviewState, get().advisorState, get().localRecords, set, get, true);
    return { entry: localEntry, source: 'local', warning: 'Saved on this device. Sync status is shown above your case.' };
  },
  createPlaceholderAttachment: async () => { throw new Error('Select an original file to attach evidence.'); },
  createLocalAttachment: async (input) => {
    const owner = requireReadyWorkspace(get());
    const epoch = workspaceEpoch;
    const entry = get().snapshot.entries.find((row) => row.id === input.entryId && !row.deleted_at);
    if (!entry || entry.user_id !== owner || entry.case_id !== getActiveCase(get().snapshot)?.id) throw new Error('The entry is not available in the selected case.');
    set({ saving: get().saving + 1 });
    try {
    const attachment = await preserveEvidenceOriginal({ input, entry, ownerId: owner });
    const importedSource = getEntryMetadata(entry).import_provenance;
    if (importedSource && typeof importedSource === 'object' && !Array.isArray(importedSource) && importedSource.kind === 'csv_source' && attachment.id === importedSource.sourceAttachmentId && attachment.file_hash !== importedSource.fileHash) throw new Error('The CSV changed after import review. Select it again to start an import from its current original bytes.');
    if (!isActiveWorkspace(owner, epoch) || getActiveCase(get().snapshot)?.id !== entry.case_id) throw new Error('Account or case changed while saving evidence. The preserved original can be retried in its case.');
    const existing = get().snapshot.evidenceAttachments.find((row) => row.id === attachment.id);
    if (existing) {
      if (existing.file_hash !== attachment.file_hash || existing.storage_path !== attachment.storage_path) throw new Error('This attachment identity already belongs to a different original.');
      await persistStateSnapshot(get().snapshot, get().reportPreviewState, get().advisorState, get().localRecords, set, get, true);
      let warning = 'The original and its entry link are saved.';
      try { await cleanupEvidenceSource(input); } catch { warning += ' Its temporary source could not be removed from the app cache.'; }
      return { attachment: existing, source: 'local', warning };
    }
    const meta = createLocalRecordMeta({ table: 'attachments', id: attachment.id });
    const verified = withEvidenceAttachmentLocalMeta(attachment, meta);
    set({ snapshot: appendAttachment(get().snapshot, verified), source: 'local', localRecords: { ...get().localRecords, [localRecordKey('attachments', attachment.id)]: meta } });
    await persistStateSnapshot(get().snapshot, get().reportPreviewState, get().advisorState, get().localRecords, set, get, true);
    let warning = 'Original saved and verified on this device. Cloud sync will retry automatically.';
    try { await cleanupEvidenceSource(input); }
    catch { warning += ' Its temporary source could not be removed from the app cache.'; }
    return { attachment: verified, source: 'local', warning };
    } finally {
      if (isActiveWorkspace(owner, epoch)) {
        set({ saving: Math.max(0, get().saving - 1) });
        queueMicrotask(() => { if (isActiveWorkspace(owner, epoch)) void get().sync(); });
      }
    }
  },
  createCourtOrder: async (input) => {
    requireReadyWorkspace(get());
    guardNewRecordId(get(), 'courtOrders', input.id);
    if (input.sourceAttachmentId) requireSelectedCaseRow(get(), 'evidenceAttachments', input.sourceAttachmentId);
    const current = get();
    const activeCase = getActiveCase(current.snapshot);
    const userId = activeCase?.user_id || '';
    const courtOrder = buildCourtOrder(input, current.snapshot, userId);
    const key = localRecordKey('court_orders', courtOrder.id);
    const localRecord = createLocalRecordMeta({
      table: 'court_orders',
      id: courtOrder.id,
      status: 'local_pending',
      previous: current.localRecords[key],
    });

    set((state) => ({
      snapshot: appendCourtOrder(state.snapshot, courtOrder),
      source: 'local',
      hasPersistedSnapshot: true,
      localRecords: {
        ...state.localRecords,
        [key]: localRecord,
      },
    }));
    await persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
      true,
    );

    return courtOrder;
  },
  updateCourtOrder: async (orderId, input) => {
    requireReadyWorkspace(get());
    requireSelectedCaseRow(get(), 'courtOrders', orderId);
    if (input.sourceAttachmentId) requireSelectedCaseRow(get(), 'evidenceAttachments', input.sourceAttachmentId);
    const key = localRecordKey('court_orders', orderId);
    const localRecord = createLocalRecordMeta({
      table: 'court_orders',
      id: orderId,
      status: 'local_pending',
      previous: get().localRecords[key],
    });

    set((state) => ({
      snapshot: updateCourtOrderRow(state.snapshot, orderId, input),
      source: 'local',
      hasPersistedSnapshot: true,
      localRecords: {
        ...state.localRecords,
        [key]: localRecord,
      },
    }));
    await persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
      true,
    );
  },
  createCourtOrderProvision: async (input) => {
    requireReadyWorkspace(get());
    guardNewRecordId(get(), 'courtOrderProvisions', input.id);
    requireSelectedCaseRow(get(), 'courtOrders', input.courtOrderId);
    const current = get();
    const activeCase = getActiveCase(current.snapshot);
    const userId = activeCase?.user_id || '';
    const provision = buildCourtOrderProvision(input, current.snapshot, userId);
    const key = localRecordKey('court_order_provisions', provision.id);
    const localRecord = createLocalRecordMeta({
      table: 'court_order_provisions',
      id: provision.id,
      status: 'local_pending',
      previous: current.localRecords[key],
    });

    set((state) => ({
      snapshot: appendCourtOrderProvision(state.snapshot, provision),
      source: 'local',
      hasPersistedSnapshot: true,
      localRecords: {
        ...state.localRecords,
        [key]: localRecord,
      },
    }));
    await persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
      true,
    );

    return provision;
  },
  updateCourtOrderProvision: async (provisionId, input) => {
    requireReadyWorkspace(get());
    requireSelectedCaseRow(get(), 'courtOrderProvisions', provisionId);
    requireSelectedCaseRow(get(), 'courtOrders', input.courtOrderId);
    const key = localRecordKey('court_order_provisions', provisionId);
    const localRecord = createLocalRecordMeta({
      table: 'court_order_provisions',
      id: provisionId,
      status: 'local_pending',
      previous: get().localRecords[key],
    });

    set((state) => ({
      snapshot: updateCourtOrderProvisionRow(state.snapshot, provisionId, input),
      source: 'local',
      hasPersistedSnapshot: true,
      localRecords: {
        ...state.localRecords,
        [key]: localRecord,
      },
    }));
    await persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
      true,
    );
  },
  linkEntryToCourtOrderProvision: async (entryId, provisionId) => {
    requireReadyWorkspace(get());
    requireSelectedCaseRow(get(), 'entries', entryId);
    if (provisionId) requireSelectedCaseRow(get(), 'courtOrderProvisions', provisionId);
    if (!get().snapshot.entries.some((entry) => entry.id === entryId && !entry.deleted_at)) throw new Error('This entry is no longer available.');
    const key = localRecordKey('entries', entryId);
    const localRecord = createLocalRecordMeta({
      table: 'entries',
      id: entryId,
      status: 'local_pending',
      previous: get().localRecords[key],
    });

    set((state) => ({
      snapshot: updateEntryProvisionLinkInSnapshot(
        state.snapshot,
        entryId,
        provisionId,
        localRecord,
      ),
      source: 'local',
      hasPersistedSnapshot: true,
      localRecords: {
        ...state.localRecords,
        [key]: localRecord,
      },
    }));
    await persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
      true,
    );
  },
  createKeyDate: async (input) => {
    requireReadyWorkspace(get());
    guardNewRecordId(get(), 'keyDates', input.id);
    if (input.relatedFilingPackageId) requireSelectedCaseRow(get(), 'filingPackages', input.relatedFilingPackageId);
    const current = get();
    const activeCase = getActiveCase(current.snapshot);
    const userId = activeCase?.user_id || '';
    const keyDate = buildKeyDate(input, current.snapshot, userId);
    const key = localRecordKey('key_dates', keyDate.id);
    const localRecord = createLocalRecordMeta({
      table: 'key_dates',
      id: keyDate.id,
      status: 'local_pending',
      previous: current.localRecords[key],
    });

    set((state) => ({
      snapshot: appendKeyDate(state.snapshot, keyDate),
      source: 'local',
      hasPersistedSnapshot: true,
      localRecords: {
        ...state.localRecords,
        [key]: localRecord,
      },
    }));
    await persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
      true,
    );

    return keyDate;
  },
  updateKeyDate: async (keyDateId, input) => {
    requireReadyWorkspace(get());
    requireSelectedCaseRow(get(), 'keyDates', keyDateId);
    if (input.relatedFilingPackageId) requireSelectedCaseRow(get(), 'filingPackages', input.relatedFilingPackageId);
    const key = localRecordKey('key_dates', keyDateId);
    const localRecord = createLocalRecordMeta({
      table: 'key_dates',
      id: keyDateId,
      status: 'local_pending',
      previous: get().localRecords[key],
    });

    set((state) => ({
      snapshot: updateKeyDateRow(state.snapshot, keyDateId, input),
      source: 'local',
      hasPersistedSnapshot: true,
      localRecords: {
        ...state.localRecords,
        [key]: localRecord,
      },
    }));
    await persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
      true,
    );
  },
  createFilingPackage: async (input) => {
    const current = get(); const owner = requireReadyWorkspace(current);
    const built = buildFilingPackage(input, current.snapshot, owner);
    const existing = current.snapshot.filingPackages.find((row) => row.id === built.filingPackage.id);
    if (existing) {
      requireSelectedCaseRow(current, 'filingPackages', existing.id);
      if (existing.title !== built.filingPackage.title || existing.filing_type !== built.filingPackage.filing_type || existing.due_date !== built.filingPackage.due_date) throw new Error('This identity already belongs to a different package. Start a new draft.');
      await commitFilingState(current.snapshot, current.filingBuilderState, null, set, get);
      return { filingPackage: existing, source: 'local' };
    }
    await commitFilingState(appendFilingPackage(current.snapshot, built.filingPackage), {
      selectedPackageId: built.filingPackage.id,
      packageStates: { ...current.filingBuilderState.packageStates, [built.filingPackage.id]: built.localState },
      updatedAt: new Date().toISOString(),
    }, built.filingPackage.id, set, get);
    return { filingPackage: built.filingPackage, source: 'local' };
  },
  selectFilingPackage: async (packageId) => {
    const current = get(); requireReadyWorkspace(current);
    if (packageId) requireSelectedCaseRow(current, 'filingPackages', packageId);
    if (current.filingBuilderState.selectedPackageId === packageId) return;
    await commitFilingState(current.snapshot, { ...current.filingBuilderState, selectedPackageId: packageId, updatedAt: new Date().toISOString() }, null, set, get);
  },
  updateFilingPackageStatus: async (packageId, status) => {
    const current = get(); requireSelectedCaseRow(current, 'filingPackages', packageId);
    if (!['draft', 'in_progress', 'ready_for_review'].includes(status)) throw new Error('Choose a valid preparation status.');
    await commitFilingState(updateFilingPackageRow(current.snapshot, packageId, { status }), { ...current.filingBuilderState, selectedPackageId: packageId, updatedAt: new Date().toISOString() }, packageId, set, get);
  },
  toggleFilingPackageEntry: async (packageId, entryId) => {
    const current = get(); requireSelectedCaseRow(current, 'filingPackages', packageId);
    const linked = current.filingBuilderState.packageStates[packageId]?.linkedEntryIds.includes(entryId);
    if (!linked) {
      const entry = requireSelectedCaseRow(current, 'entries', entryId) as Entry;
      if (isPrivateEntry(entry)) throw new Error('Private entries cannot be added to a shared filing package. Review visibility in the entry screen.');
    }
    const next = updateFilingBuilderPackageState(current.filingBuilderState, packageId, (state) => ({ ...state, linkedEntryIds: toggleString(state.linkedEntryIds, entryId) }));
    await commitFilingState(updateFilingPackageRow(current.snapshot, packageId, {}), next, packageId, set, get);
  },
  toggleFilingPackageAttachment: async (packageId, attachmentId) => {
    const current = get(); requireSelectedCaseRow(current, 'filingPackages', packageId);
    const linked = current.filingBuilderState.packageStates[packageId]?.linkedAttachmentIds.includes(attachmentId);
    if (!linked) {
      const attachment = requireSelectedCaseRow(current, 'evidenceAttachments', attachmentId) as EvidenceAttachment;
      if (!attachment.entry_id) throw new Error('Choose an original with a live source entry.');
      const entry = requireSelectedCaseRow(current, 'entries', attachment.entry_id) as Entry;
      if (isPrivateEntry(entry)) throw new Error('Originals belonging to private entries cannot be added to a shared filing package.');
    }
    const next = updateFilingBuilderPackageState(current.filingBuilderState, packageId, (state) => ({ ...state, linkedAttachmentIds: toggleString(state.linkedAttachmentIds, attachmentId) }));
    await commitFilingState(updateFilingPackageRow(current.snapshot, packageId, {}), next, packageId, set, get);
  },
  toggleFilingPackageReport: async (packageId, reportType) => {
    const current = get(); requireSelectedCaseRow(current, 'filingPackages', packageId);
    if (!FILING_REPORT_TYPES.includes(reportType)) throw new Error('Choose a supported report type.');
    const next = updateFilingBuilderPackageState(current.filingBuilderState, packageId, (state) => ({ ...state, linkedReportTypes: state.linkedReportTypes.includes(reportType) ? state.linkedReportTypes.filter((type) => type !== reportType) : [...state.linkedReportTypes, reportType] }));
    await commitFilingState(updateFilingPackageRow(current.snapshot, packageId, {}), next, packageId, set, get);
  },
  toggleFilingPackageChecklist: async (packageId, item) => {
    const current = get(); requireSelectedCaseRow(current, 'filingPackages', packageId);
    if (!['forms', 'exhibits', 'declarations', 'service'].includes(item)) throw new Error('Choose a valid preparation checklist item.');
    const next = updateFilingBuilderPackageState(current.filingBuilderState, packageId, (state) => ({ ...state, checklist: { ...state.checklist, [item]: !state.checklist[item] } }));
    const completion_percent = calculateChecklistProgress(next.packageStates[packageId].checklist);
    await commitFilingState(updateFilingPackageRow(current.snapshot, packageId, { completion_percent }), next, packageId, set, get);
  },
  acknowledgePattern: (patternId) => {
    requireReadyWorkspace(get());
    set((state) => ({
      patternReviewState: updatePatternReviewState(
        state.patternReviewState,
        patternId,
        'acknowledged',
      ),
      hasPersistedSnapshot: true,
    }));
    persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
    );
  },
  dismissPattern: (patternId) => {
    requireReadyWorkspace(get());
    set((state) => ({
      patternReviewState: updatePatternReviewState(state.patternReviewState, patternId, 'dismissed'),
      hasPersistedSnapshot: true,
    }));
    persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
    );
  },
  restorePattern: (patternId) => {
    requireReadyWorkspace(get());
    set((state) => ({
      patternReviewState: updatePatternReviewState(state.patternReviewState, patternId, 'new'),
      hasPersistedSnapshot: true,
    }));
    persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
    );
  },
  sendAdvisorMessage: (input) => {
    requireReadyWorkspace(get());
    input.linkedEntryIds.forEach((id) => requireSelectedCaseRow(get(), 'entries', id));
    const prompt = input.prompt.trim();
    if (!prompt) return;

    set((state) => ({
      advisorState: appendAdvisorExchange(state.advisorState, {
        ...input,
        prompt,
      }),
      hasPersistedSnapshot: true,
    }));
    persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
    );
  },
  setReportPreviewState: (patch) => {
    requireReadyWorkspace(get());
    set((state) => ({
      reportPreviewState: {
        ...state.reportPreviewState,
        ...patch,
      },
      hasPersistedSnapshot: true,
    }));
    persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
    );
  },
  saveCourtFormDraft: async (input) => {
    const owner = requireReadyWorkspace(get());
    if (input.caseId !== getActiveCase(get().snapshot)?.id) throw new Error('Open the case before editing its form draft.');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id)) throw new Error('The form draft identity is invalid.');
    input.sourceEntryIds.forEach((id) => requireSelectedCaseRow(get(), 'entries', id));
    const existing = get().courtFormDrafts.find((row) => row.id === input.id);
    if (existing && (existing.userId !== owner || existing.caseId !== input.caseId || existing.formId !== input.formId)) throw new Error('This form draft identity belongs to another case or form.');
    const now = new Date().toISOString();
    const draft: CourtFormDraft = { id: input.id, userId: owner, caseId: input.caseId, formId: input.formId, values: sanitizeCourtFormValues(input.formId, input.values), sourceEntryIds: [...new Set(input.sourceEntryIds)], createdAt: existing?.createdAt ?? now, updatedAt: now };
    set({ courtFormDrafts: [draft, ...get().courtFormDrafts.filter((row) => row.id !== draft.id)] });
    await persistStateSnapshot(get().snapshot, get().reportPreviewState, get().advisorState, get().localRecords, set, get, true);
    return draft;
  },
  saveReportVersion: async (input) => {
    requireReadyWorkspace(get());
    if (!getActiveCase(get().snapshot)) throw new Error('Select a case before saving a report.');
    input.includedEntryIds.forEach((id) => requireSelectedCaseRow(get(), 'entries', id));
    const now = new Date().toISOString();
    const version: SavedReportVersion = {
      id: Crypto.randomUUID(),
      caseId: getActiveCase(get().snapshot)?.id,
      reportType: input.reportType,
      title: input.title,
      createdAt: now,
      updatedAt: now,
      includedEntryIds: input.includedEntryIds,
      filters: input.filters,
      linkedFilingPackageIds: [],
    };

    set((state) => ({
      savedReportVersions: [version, ...state.savedReportVersions],
      hasPersistedSnapshot: true,
    }));
    await persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
      true,
    );

    return version;
  },
  updateEntryReview: async (entryId, patch) => {
    requireReadyWorkspace(get());
    requireSelectedCaseRow(get(), 'entries', entryId);
    const original = get().snapshot.entries.find((entry) => entry.id === entryId)!;
    const imported = getEntryMetadata(original).import_provenance;
    if (patch.reviewVisibility === 'court_ready' && imported && typeof imported === 'object' && !Array.isArray(imported) && imported.kind === 'csv_source') throw new Error('Original CSV source records remain private. Export reviewed imported rows instead.');
    if (!get().snapshot.entries.some((entry) => entry.id === entryId && !entry.deleted_at)) throw new Error('This entry is no longer available.');
    const key = localRecordKey('entries', entryId);
    const localRecord = createLocalRecordMeta({
      table: 'entries',
      id: entryId,
      previous: get().localRecords[key],
    });

    set((state) => ({
      snapshot: updateEntryInSnapshot(state.snapshot, entryId, patch, localRecord),
      source: 'local',
      hasPersistedSnapshot: true,
      localRecords: {
        ...state.localRecords,
        [key]: localRecord,
      },
    }));
    await persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
      true,
    );
  },
}));

function resetWorkspace(ownerId: string | null) {
  workspaceEpoch += 1;
  releaseWorkspaceLease?.();
  releaseWorkspaceLease = null;
  useCaseIntelligenceStore.setState({
    ownerId, snapshot: emptyCaseSnapshot(), source: 'local', storageBlocked: false,
    saving: 0, switchingCase: false, caseWorkspaceStates: {}, contextRecovery: [], contextError: null, syncing: false, syncError: null, conflicts: [], conflictHistory: [], workspaceJSON: '',
    reportPreviewState: { ...DEFAULT_REPORT_PREVIEW_STATE }, savedReportVersions: [], courtFormDrafts: [],
    advisorState: { ...DEFAULT_ADVISOR_STATE, messages: [] },
    filingBuilderState: { ...DEFAULT_FILING_BUILDER_STATE, packageStates: {} },
    patternReviewState: { acknowledgedPatternIds: [], dismissedPatternIds: [], updatedAt: null },
    localRecords: {}, persistence: createPersistenceDiagnostics(), loading: false,
    hasLoaded: false, hasHydrated: false, hasPersistedSnapshot: false, error: null,
  });
}

export function initializeCaseWorkspace(): () => void {
  let active = true;
  const refresh = () => {
    const state = useCaseIntelligenceStore.getState();
    if (!active || !state.ownerId) return;
    if (Platform.OS === 'web' && typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    if (!state.hasLoaded) void state.load(); else void state.sync();
  };
  const unsubscribe = useAuthStore.subscribe((state) => {
    const ownerId = hasVerifiedSession(state.session) && !state.recovery ? state.session!.user.id : null;
    if (useCaseIntelligenceStore.getState().ownerId !== ownerId) {
      // Clear decrypted case memory in the same call stack as account changes.
      // Older async reads/writes are owner-scoped and cannot repopulate it.
      resetWorkspace(ownerId);
      if (ownerId) queueMicrotask(refresh);
    }
  });
  const auth = useAuthStore.getState();
  if (hasVerifiedSession(auth.session) && !auth.recovery) { resetWorkspace(auth.session!.user.id); queueMicrotask(refresh); }
  const timer = setInterval(refresh, 30_000);
  const appState = AppState.addEventListener('change', (state) => { if (state === 'active') refresh(); });
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('online', refresh); window.addEventListener('focus', refresh);
  }
  return () => {
    active = false; unsubscribe(); clearInterval(timer); appState.remove();
    if (Platform.OS === 'web' && typeof window !== 'undefined') { window.removeEventListener('online', refresh); window.removeEventListener('focus', refresh); }
    resetWorkspace(null);
  };
}

function createHomeModel(
  snapshot: CaseIntelligenceSnapshot,
  source: CaseIntelligenceSource,
): HomeCaseIntelligence {
  const activeCase = getActiveCase(snapshot);
  const primaryPerson =
    activeCase
      ? snapshot.people.find(
          (person) =>
            !person.deleted_at &&
            person.case_id === activeCase.id &&
            (person.is_primary_client || person.role === 'petitioner' || person.role === 'client'),
        ) ?? null
      : null;

  return {
    source,
    activeCase,
    primaryPerson,
    upcomingKeyDates: getUpcomingKeyDates(snapshot, activeCase?.id),
    recentEntries: getRecentEntries(snapshot, activeCase?.id),
    flaggedEntries: getFlaggedEntries(snapshot, activeCase?.id),
    patterns: getPatternsForCase(snapshot, activeCase?.id),
    nextStep: getNextStepForCase(snapshot, activeCase?.id),
  };
}

function getFilingEntryLinkCounts(filingBuilderState: FilingBuilderState) {
  return Object.values(filingBuilderState.packageStates).reduce<Record<string, number>>(
    (counts, packageState) => {
      packageState.linkedEntryIds.forEach((entryId) => {
        counts[entryId] = (counts[entryId] ?? 0) + 1;
      });
      return counts;
    },
    {},
  );
}

function getFilingReportLinkCounts(filingBuilderState: FilingBuilderState) {
  return Object.values(filingBuilderState.packageStates).reduce<Record<ReportPreviewType, number>>(
    (counts, packageState) => {
      packageState.linkedReportTypes.forEach((reportType) => {
        counts[reportType] = (counts[reportType] ?? 0) + 1;
      });
      return counts;
    },
    {} as Record<ReportPreviewType, number>,
  );
}

export function useCaseIntelligenceHome() {
  const snapshot = useCaseIntelligenceStore((state) => state.snapshot);
  const source = useCaseIntelligenceStore((state) => state.source);
  const filingBuilderState = useCaseIntelligenceStore((state) => state.filingBuilderState);
  const localRecords = useCaseIntelligenceStore((state) => state.localRecords);
  const loading = useCaseIntelligenceStore((state) => state.loading);
  const error = useCaseIntelligenceStore((state) => state.error);
  const hasLoaded = useCaseIntelligenceStore((state) => state.hasLoaded);
  const hasHydrated = useCaseIntelligenceStore((state) => state.hasHydrated);
  const persistence = useCaseIntelligenceStore((state) => state.persistence);
  const load = useCaseIntelligenceStore((state) => state.load);

  useEffect(() => {
    if (!hasLoaded && !loading) {
      load();
    }
  }, [hasLoaded, load, loading]);

  const home = useMemo(() => createHomeModel(snapshot, source), [snapshot, source]);
  const localCaseSetupExists = useMemo(
    () => hasLocalCaseSetup(snapshot, localRecords),
    [snapshot, localRecords],
  );
  const userCaseSetupExists = useMemo(
    () => hasUserCaseSetup(snapshot, localRecords),
    [snapshot, localRecords],
  );
  const demoCase = useMemo(() => isDemoCase(snapshot, localRecords), [snapshot, localRecords]);
  const filingEntryLinkCounts = useMemo(
    () => getFilingEntryLinkCounts(filingBuilderState),
    [filingBuilderState],
  );
  const filingReportLinkCounts = useMemo(
    () => getFilingReportLinkCounts(filingBuilderState),
    [filingBuilderState],
  );

  return {
    snapshot,
    home,
    filingBuilderState,
    filingEntryLinkCounts,
    filingReportLinkCounts,
    loading,
    error,
    hasHydrated,
    hasLocalCaseSetup: localCaseSetupExists,
    hasUserCaseSetup: userCaseSetupExists,
    isDemoCase: demoCase,
    persistence,
  };
}

export function useCaseSetup() {
  const {
    snapshot,
    home,
    loading,
    error,
    hasHydrated,
    hasLocalCaseSetup: localCaseSetupExists,
    hasUserCaseSetup: userCaseSetupExists,
    isDemoCase: demoCase,
    persistence,
  } = useCaseIntelligenceHome();
  const localRecords = useCaseIntelligenceStore((state) => state.localRecords);
  const saveCaseSetup = useCaseIntelligenceStore((state) => state.saveCaseSetup);
  const activeCase = home.activeCase;
  const caseId = activeCase?.id;
  const children = caseId
    ? snapshot.children.filter((child) => !child.deleted_at && child.case_id === caseId)
    : [];
  const people = caseId
    ? snapshot.people.filter((person) => !person.deleted_at && person.case_id === caseId)
    : [];
  const hearing =
    caseId
      ? snapshot.keyDates
          .filter((date) => !date.deleted_at && date.case_id === caseId && date.date_type === 'hearing' && date.description === 'Recorded during case setup.' && !date.is_completed)
          .sort((a, b) => `${a.event_date}T${a.event_time ?? ''}`.localeCompare(`${b.event_date}T${b.event_time ?? ''}`))[0] ??
        null
      : null;

  return {
    snapshot,
    source: home.source,
    activeCase,
    localCase: getLocalSetupCase(snapshot, localRecords),
    primaryPerson:
      people.find((person) => person.is_primary_client || person.role === 'petitioner') ?? null,
    otherParent: people.find((person) => !person.is_primary_client && person.relationship === 'parent') ?? null,
    child: children[0] ?? null,
    children,
    hearing,
    hasLocalCaseSetup: localCaseSetupExists,
    hasUserCaseSetup: userCaseSetupExists,
    isDemoCase: demoCase,
    saveCaseSetup,
    loading,
    error,
    hasHydrated,
    persistence,
  };
}

export function useCaseIntelligenceTimeline() {
  const {
    snapshot,
    home,
    filingEntryLinkCounts,
    loading,
    error,
    hasHydrated,
    persistence,
  } = useCaseIntelligenceHome();

  return {
    snapshot,
    source: home.source,
    activeCase: home.activeCase,
    entries: getRecentEntries(snapshot, home.activeCase?.id, 100),
    flaggedEntries: getFlaggedEntries(snapshot, home.activeCase?.id),
    filingEntryLinkCounts,
    loading,
    error,
    hasHydrated,
    persistence,
  };
}

export function useCaseEvidence() {
  const {
    snapshot,
    home,
    filingEntryLinkCounts,
    loading,
    error,
    hasHydrated,
    persistence,
  } = useCaseIntelligenceHome();
  const caseId = home.activeCase?.id;
  const entries = useMemo(() => {
    if (!caseId) return [];

    return snapshot.entries
      .filter((entry) => !entry.deleted_at && entry.case_id === caseId)
      .sort((a, b) =>
        `${b.event_date}T${b.event_time ?? '00:00:00'}`.localeCompare(
          `${a.event_date}T${a.event_time ?? '00:00:00'}`,
        ),
      );
  }, [caseId, snapshot.entries]);
  const entryIds = useMemo(() => new Set(entries.map((entry) => entry.id)), [entries]);
  const attachments = useMemo(() => {
    if (!caseId) return [];

    return snapshot.evidenceAttachments
      .filter((attachment) => !attachment.deleted_at)
      .filter(
        (attachment) =>
          attachment.case_id === caseId || Boolean(attachment.entry_id && entryIds.has(attachment.entry_id)),
      )
      .sort((a, b) =>
        (b.captured_at ?? b.created_at).localeCompare(a.captured_at ?? a.created_at),
      );
  }, [caseId, entryIds, snapshot.evidenceAttachments]);
  const children = useMemo(() => {
    if (!caseId) return [];

    return snapshot.children
      .filter((child) => !child.deleted_at && child.case_id === caseId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [caseId, snapshot.children]);

  return {
    snapshot,
    source: home.source,
    activeCase: home.activeCase,
    entries,
    attachments,
    children,
    filingEntryLinkCounts,
    loading,
    error,
    hasHydrated,
    persistence,
  };
}

export function useCasePatterns() {
  const {
    snapshot,
    home,
    filingBuilderState,
    loading,
    error,
    hasHydrated,
    persistence,
  } = useCaseIntelligenceHome();
  const patternReviewState = useCaseIntelligenceStore((state) => state.patternReviewState);
  const acknowledgePattern = useCaseIntelligenceStore((state) => state.acknowledgePattern);
  const dismissPattern = useCaseIntelligenceStore((state) => state.dismissPattern);
  const restorePattern = useCaseIntelligenceStore((state) => state.restorePattern);
  const patterns = useMemo(
    () =>
      buildDetectedCasePatterns({
        snapshot,
        caseId: home.activeCase?.id,
        filingBuilderState,
        patternReviewState,
      }),
    [filingBuilderState, home.activeCase?.id, patternReviewState, snapshot],
  );

  return {
    snapshot,
    source: home.source,
    activeCase: home.activeCase,
    patterns,
    activePatterns: patterns.filter((pattern) => pattern.status !== 'dismissed'),
    dismissedPatterns: patterns.filter((pattern) => pattern.status === 'dismissed'),
    patternReviewState,
    acknowledgePattern,
    dismissPattern,
    restorePattern,
    loading,
    error,
    hasHydrated,
    persistence,
  };
}

export function useAdvisorConversation() {
  const { snapshot, home, loading, error, hasHydrated, persistence } = useCaseIntelligenceHome();

  return {
    snapshot,
    advisorState: useCaseIntelligenceStore((state) => state.advisorState),
    sendAdvisorMessage: useCaseIntelligenceStore((state) => state.sendAdvisorMessage),
    activeCase: home.activeCase,
    upcomingHearing: home.upcomingKeyDates[0] ?? null,
    flaggedEntries: getFlaggedEntries(snapshot, home.activeCase?.id),
    loading,
    error,
    hasHydrated,
    persistence,
  };
}

export function useCaseMap() {
  const {
    snapshot,
    home,
    filingBuilderState,
    loading,
    error,
    hasHydrated,
    hasLocalCaseSetup: localCaseSetupExists,
    hasUserCaseSetup: userCaseSetupExists,
    isDemoCase: demoCase,
    persistence,
  } = useCaseIntelligenceHome();
  const caseId = home.activeCase?.id;
  const filingPackageLinkedEntryCounts = useMemo(
    () =>
      Object.values(filingBuilderState.packageStates).reduce<Record<string, number>>(
        (counts, packageState) => {
          counts[packageState.packageId] = packageState.linkedEntryIds.length;
          return counts;
        },
        {},
      ),
    [filingBuilderState],
  );

  return {
    snapshot,
    source: home.source,
    activeCase: home.activeCase,
    hasLocalCaseSetup: localCaseSetupExists,
    hasUserCaseSetup: userCaseSetupExists,
    isDemoCase: demoCase,
    children: caseId
      ? snapshot.children.filter((child) => !child.deleted_at && child.case_id === caseId)
      : [],
    people: caseId
      ? snapshot.people.filter((person) => !person.deleted_at && person.case_id === caseId)
      : [],
    courtOrders: caseId
      ? snapshot.courtOrders
          .filter((order) => !order.deleted_at && order.case_id === caseId)
          .sort((a, b) => (b.order_date ?? '').localeCompare(a.order_date ?? ''))
      : [],
    courtOrderProvisions: caseId
      ? snapshot.courtOrderProvisions.filter(
          (provision) => !provision.deleted_at && provision.case_id === caseId,
        )
      : [],
    keyDates: caseId
      ? snapshot.keyDates
          .filter((date) => !date.deleted_at && date.case_id === caseId)
          .sort((a, b) => `${a.event_date}T${a.event_time ?? ''}`.localeCompare(`${b.event_date}T${b.event_time ?? ''}`))
      : [],
    filingPackages: caseId
      ? snapshot.filingPackages
          .filter((pkg) => !pkg.deleted_at && pkg.case_id === caseId)
          .sort((a, b) => (a.due_date ?? '9999-12-31').localeCompare(b.due_date ?? '9999-12-31'))
      : [],
    filingPackageLinkedEntryCounts,
    createCourtOrder: useCaseIntelligenceStore((state) => state.createCourtOrder),
    updateCourtOrder: useCaseIntelligenceStore((state) => state.updateCourtOrder),
    createCourtOrderProvision: useCaseIntelligenceStore((state) => state.createCourtOrderProvision),
    updateCourtOrderProvision: useCaseIntelligenceStore((state) => state.updateCourtOrderProvision),
    createKeyDate: useCaseIntelligenceStore((state) => state.createKeyDate),
    updateKeyDate: useCaseIntelligenceStore((state) => state.updateKeyDate),
    loading,
    error,
    hasHydrated,
    persistence,
  };
}

export function useCaptureEntry() {
  return useCaseIntelligenceStore((state) => state.createEntry);
}

export function useUpdateEntryReview() {
  return useCaseIntelligenceStore((state) => state.updateEntryReview);
}

export function useCreatePlaceholderAttachment() {
  return useCaseIntelligenceStore((state) => state.createPlaceholderAttachment);
}

export function useCreateLocalAttachment() {
  return useCaseIntelligenceStore((state) => state.createLocalAttachment);
}

export function useFilingBuilder() {
  const {
    snapshot,
    home,
    filingBuilderState,
    filingEntryLinkCounts,
    filingReportLinkCounts,
    loading,
    error,
    hasHydrated,
    persistence,
  } = useCaseIntelligenceHome();
  const caseId = home.activeCase?.id;
  const filingPackages = useMemo(() => {
    if (!caseId) return [];

    return snapshot.filingPackages
      .filter((filingPackage) => !filingPackage.deleted_at && filingPackage.case_id === caseId && filingPackage.user_id === home.activeCase?.user_id)
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  }, [caseId, snapshot.filingPackages]);
  const selectedPackageId =
    filingBuilderState.selectedPackageId && filingPackages.some((pkg) => pkg.id === filingBuilderState.selectedPackageId)
      ? filingBuilderState.selectedPackageId
      : filingPackages[0]?.id ?? null;
  const selectedPackage =
    filingPackages.find((filingPackage) => filingPackage.id === selectedPackageId) ?? null;
  const selectedPackageState = selectedPackage
    ? ensureFilingPackageState(filingBuilderState, selectedPackage.id)
    : null;
  const entries = caseId
    ? snapshot.entries
        .filter((entry) => !entry.deleted_at && entry.case_id === caseId && entry.user_id === home.activeCase?.user_id)
        .sort((a, b) =>
          `${b.event_date}T${b.event_time ?? '00:00:00'}`.localeCompare(
            `${a.event_date}T${a.event_time ?? '00:00:00'}`,
          ),
        )
    : [];
  const entryIds = new Set(entries.map((entry) => entry.id));
  const attachments = caseId
    ? snapshot.evidenceAttachments
        .filter((attachment) => !attachment.deleted_at)
        .filter(
          (attachment) =>
            attachment.case_id === caseId && attachment.user_id === home.activeCase?.user_id && Boolean(attachment.entry_id && entryIds.has(attachment.entry_id)),
        )
        .sort((a, b) =>
          (b.captured_at ?? b.created_at).localeCompare(a.captured_at ?? a.created_at),
        )
    : [];
  const keyDates = caseId
    ? snapshot.keyDates
        .filter((keyDate) => !keyDate.deleted_at && keyDate.case_id === caseId && keyDate.user_id === home.activeCase?.user_id)
        .sort((a, b) =>
          `${a.event_date}T${a.event_time ?? ''}`.localeCompare(`${b.event_date}T${b.event_time ?? ''}`),
        )
    : [];

  return {
    snapshot,
    source: home.source,
    activeCase: home.activeCase,
    filingPackages,
    selectedPackage,
    selectedPackageState,
    filingBuilderState,
    filingEntryLinkCounts,
    filingReportLinkCounts,
    entries,
    attachments,
    keyDates,
    createFilingPackage: useCaseIntelligenceStore((state) => state.createFilingPackage),
    selectFilingPackage: useCaseIntelligenceStore((state) => state.selectFilingPackage),
    updateFilingPackageStatus: useCaseIntelligenceStore((state) => state.updateFilingPackageStatus),
    toggleFilingPackageEntry: useCaseIntelligenceStore((state) => state.toggleFilingPackageEntry),
    toggleFilingPackageAttachment: useCaseIntelligenceStore((state) => state.toggleFilingPackageAttachment),
    toggleFilingPackageReport: useCaseIntelligenceStore((state) => state.toggleFilingPackageReport),
    toggleFilingPackageChecklist: useCaseIntelligenceStore((state) => state.toggleFilingPackageChecklist),
    loading,
    error,
    hasHydrated,
    persistence,
  };
}

function reportBelongsToCase(version: SavedReportVersion, snapshot: CaseIntelligenceSnapshot, caseId?: string) {
  if (!caseId) return false;
  if (version.caseId) return version.caseId === caseId;
  return version.includedEntryIds.length > 0 && version.includedEntryIds.every((id) => snapshot.entries.some((entry) => entry.id === id && entry.case_id === caseId));
}

export function useReportPreviewState() {
  const filingBuilderState = useCaseIntelligenceStore((state) => state.filingBuilderState);
  const snapshot = useCaseIntelligenceStore((state) => state.snapshot);
  const activeCase = getActiveCase(snapshot);

  return {
    reportPreviewState: useCaseIntelligenceStore((state) => state.reportPreviewState),
    savedReportVersions: useCaseIntelligenceStore((state) => state.savedReportVersions).filter((version) => reportBelongsToCase(version, snapshot, activeCase?.id)),
    filingPackages: activeCase
      ? snapshot.filingPackages
          .filter((filingPackage) => !filingPackage.deleted_at && filingPackage.case_id === activeCase.id)
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      : [],
    setReportPreviewState: useCaseIntelligenceStore((state) => state.setReportPreviewState),
    saveReportVersion: useCaseIntelligenceStore((state) => state.saveReportVersion),
    toggleFilingPackageReport: useCaseIntelligenceStore((state) => state.toggleFilingPackageReport),
    filingReportLinkCounts: getFilingReportLinkCounts(filingBuilderState),
  };
}

export function useLocalPersistenceDiagnostics() {
  return useCaseIntelligenceStore((state) => state.persistence);
}

export function useSettingsMemoryIndex() {
  const {
    snapshot,
    home,
    filingBuilderState,
    filingEntryLinkCounts,
    filingReportLinkCounts,
    loading,
    error,
    hasHydrated,
    persistence,
  } = useCaseIntelligenceHome();
  const savedReportVersions = useCaseIntelligenceStore((state) => state.savedReportVersions);
  const advisorState = useCaseIntelligenceStore((state) => state.advisorState);
  const patternReviewState = useCaseIntelligenceStore((state) => state.patternReviewState);
  const clearLocalCaseData = useCaseIntelligenceStore((state) => state.clearLocalCaseData);
  const caseId = home.activeCase?.id;
  const entries = caseId
    ? snapshot.entries.filter((entry) => !entry.deleted_at && entry.case_id === caseId)
    : [];
  const attachments = snapshot.evidenceAttachments.filter((attachment) => !attachment.deleted_at && attachment.case_id === caseId);
  const audioMemos = attachments.filter((attachment) => attachment.file_type === 'voice_memo');
  const activePatterns = buildDetectedCasePatterns({
    snapshot,
    caseId,
    filingBuilderState,
    patternReviewState,
  }).filter((pattern) => pattern.status !== 'dismissed');

  return {
    snapshot,
    activeCase: home.activeCase,
    entries,
    attachments,
    audioMemos,
    savedReportVersions: savedReportVersions.filter((version) => reportBelongsToCase(version, snapshot, caseId)),
    advisorState,
    filingBuilderState,
    filingEntryLinkCounts,
    filingReportLinkCounts,
    activePatterns,
    clearLocalCaseData,
    loading,
    error,
    hasHydrated,
    persistence,
  };
}

export function useEntryDetail(entryId?: string) {
  const { snapshot, home, filingEntryLinkCounts, loading, error, hasHydrated, persistence } =
    useCaseIntelligenceHome();
  const entry = snapshot.entries.find((candidate) => candidate.id === entryId && !candidate.deleted_at && candidate.case_id === home.activeCase?.id) ?? null;
  const child = entry
    ? snapshot.children.find((candidate) => candidate.id === entry.child_id && candidate.case_id === entry.case_id && candidate.user_id === entry.user_id && !candidate.deleted_at) ?? null
    : null;
  const attachments = entry
    ? snapshot.evidenceAttachments
        .filter((attachment) => attachment.entry_id === entry.id && attachment.case_id === entry.case_id && attachment.user_id === entry.user_id)
        .filter((attachment) => !attachment.deleted_at)
        .sort((a, b) =>
          (b.captured_at ?? b.created_at).localeCompare(a.captured_at ?? a.created_at),
        )
    : [];
  const entryMetadata = entry ? getEntryMetadata(entry) : {};
  const linkedProvisionId =
    typeof entryMetadata.linked_court_order_provision_id === 'string'
      ? entryMetadata.linked_court_order_provision_id
      : null;
  const linkedCourtOrderProvision = linkedProvisionId
    ? snapshot.courtOrderProvisions.find(
        (provision) => provision.id === linkedProvisionId && !provision.deleted_at && provision.case_id === entry?.case_id && provision.user_id === entry.user_id,
      ) ?? null
    : null;
  const linkedCourtOrder = linkedCourtOrderProvision
    ? snapshot.courtOrders.find(
        (order) => order.id === linkedCourtOrderProvision.court_order_id && !order.deleted_at,
      ) ?? null
    : null;
  const courtOrderProvisionOptions = entry?.case_id
    ? snapshot.courtOrderProvisions
        .filter((provision) => !provision.deleted_at && provision.case_id === entry.case_id)
        .sort((a, b) => a.label.localeCompare(b.label))
    : [];

  return {
    snapshot,
    activeCase: home.activeCase,
    entry,
    child,
    attachments,
    filingLinkCount: entry ? filingEntryLinkCounts[entry.id] ?? 0 : 0,
    courtOrderProvisionOptions,
    linkedCourtOrderProvision,
    linkedCourtOrder,
    linkEntryToCourtOrderProvision: useCaseIntelligenceStore(
      (state) => state.linkEntryToCourtOrderProvision,
    ),
    peoplePresent: [],
    loading,
    error,
    hasHydrated,
    persistence,
  };
}
