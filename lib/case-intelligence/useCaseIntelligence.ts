import { useEffect, useMemo } from 'react';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import type { Database, Tables, TablesInsert } from '@/lib/supabase/database.types';
import { hashString } from '@/lib/utils/hash';
import { getEntryTypeOption, type EntryTypeValue } from './entryTypes';
import {
  DEFAULT_ADVISOR_STATE,
  DEFAULT_FILING_BUILDER_STATE,
  DEFAULT_FILING_CHECKLIST_STATE,
  DEFAULT_PATTERN_REVIEW_STATE,
  DEFAULT_REPORT_PREVIEW_STATE,
  DEFAULT_SAVED_REPORT_VERSIONS,
  createLocalRecordMeta,
  getLocalPersistenceAdapter,
  localRecordKey,
  readPersistedCaseIntelligence,
  withEvidenceAttachmentLocalMeta,
  withEntryLocalMeta,
  writePersistedCaseIntelligence,
} from './persistence';
import { buildDetectedCasePatterns } from './patterns';
import { getEntryMetadata } from './review';
import { createFallbackCaseIntelligence } from './seed';
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
  CaseIntelligenceSource,
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
  LocalPersistenceDiagnostics,
  LocalRecordMeta,
  PatternReviewState,
  Person,
  ReportPreviewType,
  ReportPreviewState,
  SavedReportVersion,
  AttachmentKind,
} from './types';

type TableName = keyof Database['public']['Tables'];

async function selectRows<T extends TableName>(
  client: NonNullable<typeof supabase>,
  table: T,
): Promise<Tables<T>[]> {
  const { data, error } = await client.from(table).select('*');
  if (error) {
    if (__DEV__) {
      console.warn(`Supabase ${String(table)} unavailable; using local fallback for that table.`, error.message);
    }
    return [];
  }
  return (data ?? []) as unknown as Tables<T>[];
}

async function loadCaseIntelligenceFromSupabase(): Promise<{
  snapshot: CaseIntelligenceSnapshot;
  source: CaseIntelligenceSource;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { snapshot: createFallbackCaseIntelligence(), source: 'fallback' };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { snapshot: createFallbackCaseIntelligence(), source: 'fallback' };
  }

  const [
    cases,
    children,
    people,
    entries,
    evidenceAttachments,
    courtOrders,
    courtOrderProvisions,
    filingPackages,
    keyDates,
    patternTags,
    aiOutputs,
    advisorThreads,
  ] = await Promise.all([
    selectRows(supabase, 'cases'),
    selectRows(supabase, 'children'),
    selectRows(supabase, 'people'),
    selectRows(supabase, 'entries'),
    selectRows(supabase, 'attachments'),
    selectRows(supabase, 'court_orders'),
    selectRows(supabase, 'court_order_provisions'),
    selectRows(supabase, 'filing_packages'),
    selectRows(supabase, 'key_dates'),
    selectRows(supabase, 'pattern_tags'),
    selectRows(supabase, 'ai_outputs'),
    selectRows(supabase, 'advisor_threads'),
  ]);

  const snapshot: CaseIntelligenceSnapshot = {
    cases,
    children,
    people,
    entries,
    evidenceAttachments,
    courtOrders,
    courtOrderProvisions,
    filingPackages,
    keyDates,
    patternTags,
    aiOutputs,
    advisorThreads,
  };

  if (!getActiveCase(snapshot)) {
    return { snapshot: createFallbackCaseIntelligence(session.user.id), source: 'fallback' };
  }

  return { snapshot, source: 'supabase' };
}

export type CaptureEntryInput = {
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
  captureSource?: 'manual' | 'voice_placeholder';
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

export type CreatePlaceholderAttachmentInput = {
  entryId: string;
  kind: AttachmentKind;
  sourceLabel?: string | null;
};

export type CreateLocalAttachmentInput = {
  entryId: string;
  kind: AttachmentKind;
  filename: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  durationMs?: number | null;
  localUri?: string | null;
  localReference?: string | null;
  sourceLabel?: string | null;
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
  caseName: string;
  caseNumber?: string | null;
  courtName?: string | null;
  county?: string | null;
  department?: string | null;
  judgeName?: string | null;
  userRole: CaseSetupUserRole;
  otherParentName: string;
  childName: string;
  nextHearingDate?: string | null;
};

type SaveCaseSetupResult = {
  case: FamilyBenchCase;
  source: 'local';
};

export type CreateFilingPackageInput = {
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
  snapshot: CaseIntelligenceSnapshot;
  source: CaseIntelligenceSource;
  reportPreviewState: ReportPreviewState;
  savedReportVersions: SavedReportVersion[];
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
  selectFilingPackage: (packageId: string | null) => void;
  updateFilingPackageStatus: (packageId: string, status: FilingPackageStatus) => void;
  toggleFilingPackageEntry: (packageId: string, entryId: string) => void;
  toggleFilingPackageAttachment: (packageId: string, attachmentId: string) => void;
  toggleFilingPackageReport: (packageId: string, reportType: ReportPreviewType) => void;
  toggleFilingPackageChecklist: (packageId: string, item: FilingChecklistKey) => void;
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
  }) => SavedReportVersion;
  updateEntryReview: (entryId: string, patch: EntryReviewPatch) => void;
};

const isSupabaseWriteEnabled = process.env.EXPO_PUBLIC_ENABLE_SUPABASE_WRITES === 'true';

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

function normalizeTime(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return /^\d{2}:\d{2}$/.test(trimmed) ? `${trimmed}:00` : trimmed;
}

function nullIfBlank(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeDate(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
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

  const option = getEntryTypeOption(input.entryType);
  const now = new Date().toISOString();
  const body = nullIfBlank(input.body);
  const title = nullIfBlank(input.title) ?? option.defaultTitle;
  const primaryChild =
    snapshot.children.find((child) => !child.deleted_at && child.case_id === activeCase.id) ?? null;
  const hashInput = [
    input.entryType,
    input.eventDate,
    normalizeTime(input.eventTime),
    title,
    body,
    nullIfBlank(input.sourceCapturedText),
    nullIfBlank(input.locationName),
    nullIfBlank(input.privateNotes),
  ]
    .filter(Boolean)
    .join('\n');

  return {
    id: `local-entry-${Crypto.randomUUID()}`,
    user_id: userId,
    case_id: activeCase.id,
    child_id: primaryChild?.id ?? null,
    entry_type: input.entryType,
    event_date: input.eventDate,
    event_time: normalizeTime(input.eventTime),
    event_end_time: null,
    custody_period: null,
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
      capture_version: input.captureSource === 'voice_placeholder' ? 'pr4c_voice_placeholder' : 'pr3a',
      entry_type_label: option.label,
      captured_body: nullIfBlank(input.sourceCapturedText) ?? body,
      source_mode: input.captureSource ?? 'manual',
      transcript_status: input.captureSource === 'voice_placeholder' ? 'typed_placeholder' : null,
      ai_structured_interpretation_status:
        input.captureSource === 'voice_placeholder' ? 'not_generated' : null,
      reviewed_body_source:
        input.captureSource === 'voice_placeholder' ? 'manual_transcript_review' : null,
    },
    voice_transcript:
      input.captureSource === 'voice_placeholder' ? nullIfBlank(input.sourceCapturedText) : null,
    capture_method: 'manual',
    content_hash: await hashString(hashInput),
    is_edited: false,
    private_notes: nullIfBlank(input.privateNotes),
    court_ready_summary: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}

const ATTACHMENT_PLACEHOLDER_DETAILS: Record<
  AttachmentKind,
  { label: string; filenameStem: string; fileType: string; mimeType: string; extension: string }
> = {
  photo: {
    label: 'Photo placeholder',
    filenameStem: 'photo',
    fileType: 'photo',
    mimeType: 'image/jpeg',
    extension: 'jpg',
  },
  document: {
    label: 'Document placeholder',
    filenameStem: 'document',
    fileType: 'document',
    mimeType: 'application/pdf',
    extension: 'pdf',
  },
  voice_memo: {
    label: 'Voice memo placeholder',
    filenameStem: 'voice-memo',
    fileType: 'voice_memo',
    mimeType: 'audio/m4a',
    extension: 'm4a',
  },
  screenshot: {
    label: 'Screenshot placeholder',
    filenameStem: 'screenshot',
    fileType: 'screenshot',
    mimeType: 'image/png',
    extension: 'png',
  },
};

function compactTimestamp(value: string) {
  return value.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z').replace('T', '-');
}

function safeFilename(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 'local-attachment';
  return trimmed.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'local-attachment';
}

function mimeTypeForKind(kind: AttachmentKind, mimeType?: string | null) {
  const normalized = nullIfBlank(mimeType);
  if (normalized) return normalized;
  if (kind === 'photo' || kind === 'screenshot') return 'image/jpeg';
  if (kind === 'voice_memo') return 'audio/m4a';
  return 'application/octet-stream';
}

function fileTypeForKind(kind: AttachmentKind) {
  return kind === 'screenshot' ? 'screenshot' : kind;
}

function buildPlaceholderAttachment(
  input: CreatePlaceholderAttachmentInput,
  snapshot: CaseIntelligenceSnapshot,
  userId: string,
): EvidenceAttachment {
  const entry = snapshot.entries.find(
    (candidate) => candidate.id === input.entryId && !candidate.deleted_at,
  );
  if (!entry) {
    throw new Error('Open a saved entry before adding attachment metadata.');
  }

  const details = ATTACHMENT_PLACEHOLDER_DETAILS[input.kind];
  const now = new Date().toISOString();
  const id = `local-attachment-${Crypto.randomUUID()}`;
  const sourceLabel = nullIfBlank(input.sourceLabel) ?? details.label;
  const fileName = `${compactTimestamp(now)}-${details.filenameStem}.${details.extension}`;
  const caseId = entry.case_id ?? getActiveCase(snapshot)?.id ?? null;

  return {
    id,
    user_id: userId,
    case_id: caseId,
    entry_id: entry.id,
    file_name: fileName,
    file_type: details.fileType,
    mime_type: details.mimeType,
    file_size_bytes: 0,
    storage_bucket: 'evidence-originals',
    storage_path: `local-only/placeholders/${caseId ?? 'case'}/${entry.id}/${fileName}`,
    thumbnail_path: null,
    description: `${details.label} metadata record. Original evidence is preserved when uploads are enabled later.`,
    is_receipt: false,
    file_hash: `placeholder:${id}`,
    hash_algorithm: 'sha256-placeholder',
    captured_at: now,
    source_device: sourceLabel,
    exif: {
      attachment_kind: input.kind,
      source_label: sourceLabel,
      storage_status: 'placeholder_only',
      original_evidence_preserved: true,
      derived_previews_pending: true,
      file_size_placeholder: true,
      hash_status: 'placeholder_not_content_hash',
    },
    created_at: now,
    deleted_at: null,
  };
}

function buildLocalAttachment(
  input: CreateLocalAttachmentInput,
  snapshot: CaseIntelligenceSnapshot,
  userId: string,
): EvidenceAttachment {
  const entry = snapshot.entries.find(
    (candidate) => candidate.id === input.entryId && !candidate.deleted_at,
  );
  if (!entry) {
    throw new Error('Open a saved entry before adding attachment metadata.');
  }

  const now = new Date().toISOString();
  const id = `local-attachment-${Crypto.randomUUID()}`;
  const fileName = safeFilename(input.filename);
  const mimeType = mimeTypeForKind(input.kind, input.mimeType);
  const sourceLabel = nullIfBlank(input.sourceLabel) ?? 'Family Bench local file selection';
  const caseId = entry.case_id ?? getActiveCase(snapshot)?.id ?? null;
  const storagePath = `local-only/selected/${caseId ?? 'case'}/${entry.id}/${id}/${fileName}`;

  return {
    id,
    user_id: userId,
    case_id: caseId,
    entry_id: entry.id,
    file_name: fileName,
    file_type: fileTypeForKind(input.kind),
    mime_type: mimeType,
    file_size_bytes:
      typeof input.fileSizeBytes === 'number' && Number.isFinite(input.fileSizeBytes)
        ? input.fileSizeBytes
        : null,
    storage_bucket: 'evidence-originals',
    storage_path: storagePath,
    thumbnail_path: null,
    description:
      'Local attachment metadata record. Original evidence reference is preserved locally; uploads and derived previews come later.',
    is_receipt: false,
    file_hash: `placeholder:${id}`,
    hash_algorithm: 'sha256-placeholder',
    captured_at: now,
    source_device: sourceLabel,
    exif: {
      attachment_kind: input.kind,
      source_label: sourceLabel,
      storage_status: 'local_only_no_upload',
      original_evidence_preserved: true,
      derived_previews_pending: true,
      file_size_placeholder: input.fileSizeBytes == null,
      hash_status: 'placeholder_not_content_hash',
      duration_ms:
        typeof input.durationMs === 'number' && Number.isFinite(input.durationMs)
          ? input.durationMs
          : null,
      local_uri: nullIfBlank(input.localUri),
      local_reference: nullIfBlank(input.localReference),
      selected_at: now,
      selection_source: 'local_picker',
    },
    created_at: now,
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
      .find((person) => hasLocalTableRecord('people', person.id, localRecords) && predicate(person)) ??
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
      .find((child) => hasLocalTableRecord('children', child.id, localRecords)) ?? null
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
      .find((date) => hasLocalTableRecord('key_dates', date.id, localRecords)) ?? null
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
  const existingLocalCase = getLocalSetupCase(currentSnapshot, currentLocalRecords);
  const previousActiveCase = getActiveCase(currentSnapshot);
  const caseId = existingLocalCase?.id ?? `local-case-${Crypto.randomUUID()}`;
  const userId = existingLocalCase?.user_id ?? previousActiveCase?.user_id ?? '';
  const hearingDate = normalizeDate(input.nextHearingDate);
  const caseName = nullIfBlank(input.caseName) ?? 'Local family case';
  const childName = nullIfBlank(input.childName) ?? 'Child';
  const otherName = nullIfBlank(input.otherParentName) ?? 'Other parent';
  const nextHearingAt = hearingDate ? `${hearingDate}T09:00:00` : null;
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
    status: 'active',
    county: nullIfBlank(input.county),
    state: existingLocalCase?.state ?? null,
    is_active: true,
    next_hearing_at: nextHearingAt,
    created_at: existingLocalCase?.created_at ?? now,
    updated_at: now,
    deleted_at: null,
  };

  const existingChild = findLocalChild(currentSnapshot, currentLocalRecords, caseId);
  const childId = existingChild?.id ?? `local-child-${Crypto.randomUUID()}`;
  const childRecord = localMetaForUpdate('children', childId, currentLocalRecords, now);
  localRecordUpdates[localRecordKey('children', childId)] = childRecord;

  const child: Child = {
    id: childId,
    user_id: userId,
    case_id: caseId,
    name: childName,
    date_of_birth: existingChild?.date_of_birth ?? null,
    created_at: existingChild?.created_at ?? now,
    updated_at: now,
    deleted_at: null,
  };

  const existingPrimaryPerson = findLocalPerson(
    currentSnapshot,
    currentLocalRecords,
    caseId,
    (person) => person.is_primary_client,
  );
  const primaryPersonId = existingPrimaryPerson?.id ?? `local-person-${Crypto.randomUUID()}`;
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
    (person) => !person.is_primary_client,
  );
  const otherParentId = existingOtherParent?.id ?? `local-person-${Crypto.randomUUID()}`;
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
  const hearingId = existingHearing?.id ?? `local-key-date-${Crypto.randomUUID()}`;
  const hearingRecord = hearingDate
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
        event_time: '09:00:00',
        title: existingHearing?.title ?? 'Next hearing',
        description: 'Recorded during local case setup.',
        is_completed: false,
        related_filing_package_id: null,
        related_court_order_id: null,
        created_at: existingHearing?.created_at ?? now,
        updated_at: now,
        deleted_at: null,
      }
    : null;

  const previousCaseId = existingLocalCase?.id ?? previousActiveCase?.id ?? null;
  const shouldMoveLocalRows = previousCaseId !== null && previousCaseId !== caseId;
  const movedEntryIds = new Set<string>();

  const entries = currentSnapshot.entries.map((entry) => {
    if (shouldMoveLocalRows && entry.case_id === previousCaseId && hasLocalEntryState(entry, currentLocalRecords)) {
      const movedRecord = localMetaForUpdate('entries', entry.id, currentLocalRecords, now);
      localRecordUpdates[localRecordKey('entries', entry.id)] = movedRecord;
      movedEntryIds.add(entry.id);
      return withEntryLocalMeta(
        {
          ...entry,
          case_id: caseId,
          child_id: child.id,
          updated_at: now,
        },
        movedRecord,
      );
    }

    return entry;
  });

  const evidenceAttachments = currentSnapshot.evidenceAttachments.map((attachment) => {
    const shouldMoveAttachment =
      (attachment.entry_id ? movedEntryIds.has(attachment.entry_id) : false) ||
      (shouldMoveLocalRows &&
        attachment.case_id === previousCaseId &&
        hasLocalAttachmentState(attachment, currentLocalRecords));

    if (!shouldMoveAttachment) return attachment;

    const movedRecord = localMetaForUpdate('attachments', attachment.id, currentLocalRecords, now);
    localRecordUpdates[localRecordKey('attachments', attachment.id)] = movedRecord;

    return withEvidenceAttachmentLocalMeta(
      {
        ...attachment,
        case_id: caseId,
      },
      movedRecord,
    );
  });

  const cases = [
    activeCase,
    ...currentSnapshot.cases
      .filter((caseRow) => caseRow.id !== caseId)
      .map((caseRow) => ({
        ...caseRow,
        is_active: false,
        status: caseRow.status === 'active' ? 'inactive' : caseRow.status,
      })),
  ];
  const children = [child, ...currentSnapshot.children.filter((row) => row.id !== child.id)];
  const people = [
    primaryPerson,
    otherParent,
    ...currentSnapshot.people.filter(
      (row) => row.id !== primaryPerson.id && row.id !== otherParent.id,
    ),
  ];
  const keyDates = [
    ...(hearing ? [hearing] : []),
    ...currentSnapshot.keyDates.filter((row) => row.id !== hearingId),
  ];
  const localRecords = {
    ...currentLocalRecords,
    ...localRecordUpdates,
  };
  if (!hearing && existingHearing) {
    delete localRecords[localRecordKey('key_dates', existingHearing.id)];
  }

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
        label: 'Exhibit group A placeholder',
        entryIds: [],
        attachmentIds: [],
      },
      {
        id: `${packageId}-exhibit-b`,
        label: 'Exhibit group B placeholder',
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
  const id = `local-filing-${Crypto.randomUUID()}`;
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
        'Local filing package foundation. No AI drafting, e-filing, remote write, or final court PDF has been generated.',
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
    return `${contextLine}\n\nUseful documentation is specific: date, time, location, people present, what was said or done, immediate impact on the child, and any follow-up communication. Screenshots, documents, photos, and voice notes can be linked as evidence metadata placeholders until uploads are enabled.\n\nThis is legal information, not legal advice.`;
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
    id: `local-advisor-user-${Crypto.randomUUID()}`,
    role: 'user',
    body: input.prompt.trim(),
    createdAt: now,
    linkedEntryIds: [],
    prompt: input.prompt,
    localOnly: true,
  };
  const advisorMessage: AdvisorMessage = {
    id: `local-advisor-response-${Crypto.randomUUID()}`,
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

type SupabaseEntrySaveResult =
  | { ok: true; entry: Entry; warning?: undefined }
  | { ok: false; warning: string; entry?: undefined };

async function trySaveEntryToSupabase(entry: Entry): Promise<SupabaseEntrySaveResult> {
  if (!isSupabaseWriteEnabled || !isSupabaseConfigured || !supabase) {
    return { ok: false, warning: 'Supabase writes are disabled; saved locally.' };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { ok: false, warning: 'No Supabase session; saved locally.' };
  }

  const remoteEntry: Entry = {
    ...entry,
    user_id: session.user.id,
    capture_method: 'manual_supabase',
  };
  const insert: TablesInsert<'entries'> = {
    ...remoteEntry,
  };

  const { error } = await supabase.from('entries').insert(insert);
  if (error) {
    return { ok: false, warning: `Supabase entry save failed; saved locally. ${error.message}` };
  }

  return { ok: true, entry: remoteEntry };
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
          captured_body: currentMetadata.captured_body ?? entry.body,
          reviewed_at: reviewedAt,
          reviewed_body_updated_at: hasBodyPatch ? now : currentMetadata.reviewed_body_updated_at,
          review_visibility: patch.reviewVisibility ?? currentMetadata.review_visibility,
        },
      };

      return localMeta ? withEntryLocalMeta(updatedEntry, localMeta) : updatedEntry;
    }),
  };
}

function hasLocalEntryState(entry: Entry, localRecords: Record<string, LocalRecordMeta>) {
  const metadata = getEntryMetadata(entry);
  const localRecord = localRecords[localRecordKey('entries', entry.id)];

  return Boolean(
      localRecord ||
      entry.capture_method === 'manual_local' ||
      entry.capture_method === 'voice_placeholder_local' ||
      metadata.sync_status === 'pending' ||
      metadata.sync_status === 'error',
  );
}

function hasLocalAttachmentState(
  attachment: EvidenceAttachment,
  localRecords: Record<string, LocalRecordMeta>,
) {
  const localRecord = localRecords[localRecordKey('attachments', attachment.id)];
  if (localRecord && localRecord.sync_status !== 'synced') return true;
  return attachment.id.startsWith('local-attachment-');
}

function mergeLocalRows<T extends { id: string; deleted_at: string | null }>(
  table: string,
  loadedRows: T[],
  localRows: T[],
  localRecords: Record<string, LocalRecordMeta>,
) {
  const loadedIds = new Set(loadedRows.map((row) => row.id));
  const localById = new Map(localRows.map((row) => [row.id, row]));
  const localOnlyRows = localRows.filter(
    (row) => !loadedIds.has(row.id) && hasLocalTableRecord(table, row.id, localRecords),
  );

  return [
    ...localOnlyRows,
    ...loadedRows.map((row) => {
      const localRow = localById.get(row.id);
      return localRow && hasLocalTableRecord(table, localRow.id, localRecords) ? localRow : row;
    }),
  ];
}

function mergeLocalFirstSnapshot(
  loadedSnapshot: CaseIntelligenceSnapshot,
  localSnapshot: CaseIntelligenceSnapshot,
  localRecords: Record<string, LocalRecordMeta>,
): CaseIntelligenceSnapshot {
  const loadedEntryIds = new Set(loadedSnapshot.entries.map((entry) => entry.id));
  const localEntryById = new Map(localSnapshot.entries.map((entry) => [entry.id, entry]));
  const loadedAttachmentIds = new Set(
    loadedSnapshot.evidenceAttachments.map((attachment) => attachment.id),
  );
  const localAttachmentById = new Map(
    localSnapshot.evidenceAttachments.map((attachment) => [attachment.id, attachment]),
  );
  const localOnlyEntries = localSnapshot.entries.filter(
    (entry) => !loadedEntryIds.has(entry.id) && hasLocalEntryState(entry, localRecords),
  );
  const localOnlyAttachments = localSnapshot.evidenceAttachments.filter(
    (attachment) =>
      !loadedAttachmentIds.has(attachment.id) && hasLocalAttachmentState(attachment, localRecords),
  );

  const entries = [
    ...localOnlyEntries,
    ...loadedSnapshot.entries.map((entry) => {
      const localEntry = localEntryById.get(entry.id);
      return localEntry && hasLocalEntryState(localEntry, localRecords) ? localEntry : entry;
    }),
  ];
  const evidenceAttachments = [
    ...localOnlyAttachments,
    ...loadedSnapshot.evidenceAttachments.map((attachment) => {
      const localAttachment = localAttachmentById.get(attachment.id);
      return localAttachment && hasLocalAttachmentState(localAttachment, localRecords)
        ? localAttachment
        : attachment;
    }),
  ];

  return {
    ...loadedSnapshot,
    cases: mergeLocalRows('cases', loadedSnapshot.cases, localSnapshot.cases, localRecords),
    children: mergeLocalRows('children', loadedSnapshot.children, localSnapshot.children, localRecords),
    people: mergeLocalRows('people', loadedSnapshot.people, localSnapshot.people, localRecords),
    filingPackages: mergeLocalRows(
      'filing_packages',
      loadedSnapshot.filingPackages,
      localSnapshot.filingPackages,
      localRecords,
    ),
    entries,
    evidenceAttachments,
    keyDates: mergeLocalRows('key_dates', loadedSnapshot.keyDates, localSnapshot.keyDates, localRecords),
  };
}

function persistStateSnapshot(
  snapshot: CaseIntelligenceSnapshot,
  reportPreviewState: ReportPreviewState,
  advisorState: AdvisorConversationState,
  localRecords: Record<string, LocalRecordMeta>,
  set: (patch: Partial<CaseIntelligenceState>) => void,
  get: () => CaseIntelligenceState,
) {
  void writePersistedCaseIntelligence({
    snapshot,
    reportPreviewState,
    savedReportVersions: get().savedReportVersions,
    advisorState,
    filingBuilderState: get().filingBuilderState,
    patternReviewState: get().patternReviewState,
    localRecords,
  })
    .then(({ adapter, savedAt }) => {
      set({
        persistence: {
          ...get().persistence,
          adapter,
          hydrationCompleted: true,
          lastPersistedAt: savedAt,
          error: null,
        },
      });
    })
    .catch((err) => {
      set({
        persistence: {
          ...get().persistence,
          hydrationCompleted: true,
          error: err instanceof Error ? err.message : 'Unable to persist local case data.',
        },
      });
    });
}

const useCaseIntelligenceStore = create<CaseIntelligenceState>((set, get) => ({
  snapshot: createFallbackCaseIntelligence(),
  source: 'fallback',
  reportPreviewState: DEFAULT_REPORT_PREVIEW_STATE,
  savedReportVersions: DEFAULT_SAVED_REPORT_VERSIONS,
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
    if (get().loading) return;

    set({ loading: true, error: null });
    let hydratedSnapshot = get().snapshot;
    let hydratedSource: CaseIntelligenceSource = get().source;
    let hydratedReportPreviewState = get().reportPreviewState;
    let hydratedSavedReportVersions = get().savedReportVersions;
    let hydratedAdvisorState = get().advisorState;
    let hydratedFilingBuilderState = get().filingBuilderState;
    let hydratedPatternReviewState = get().patternReviewState;
    let hydratedLocalRecords = get().localRecords;
    let hasPersistedSnapshot = false;

    try {
      const localResult = await readPersistedCaseIntelligence();
      const hydratedAt = new Date().toISOString();

      if (localResult.document) {
        hydratedSnapshot = localResult.document.snapshot;
        hydratedSource = 'local';
        hydratedReportPreviewState = localResult.document.reportPreviewState;
        hydratedSavedReportVersions = localResult.document.savedReportVersions;
        hydratedAdvisorState = localResult.document.advisorState;
        hydratedFilingBuilderState = localResult.document.filingBuilderState;
        hydratedPatternReviewState = localResult.document.patternReviewState;
        hydratedLocalRecords = localResult.document.localRecords;
        hasPersistedSnapshot = true;

        set({
          snapshot: hydratedSnapshot,
          source: hydratedSource,
          reportPreviewState: hydratedReportPreviewState,
          savedReportVersions: hydratedSavedReportVersions,
          advisorState: hydratedAdvisorState,
          filingBuilderState: hydratedFilingBuilderState,
          patternReviewState: hydratedPatternReviewState,
          localRecords: hydratedLocalRecords,
          hasHydrated: true,
          hasPersistedSnapshot: true,
          persistence: createPersistenceDiagnostics({
            adapter: localResult.adapter,
            hydrationCompleted: true,
            lastHydratedAt: hydratedAt,
            lastPersistedAt: localResult.document.savedAt,
            error: null,
          }),
        });
      } else {
        set({
          hasHydrated: true,
          hasPersistedSnapshot: false,
          persistence: createPersistenceDiagnostics({
            adapter: localResult.adapter,
            hydrationCompleted: true,
            lastHydratedAt: hydratedAt,
            error: null,
          }),
        });
      }
    } catch (err) {
      set({
        hasHydrated: true,
        hasPersistedSnapshot: false,
        persistence: createPersistenceDiagnostics({
          hydrationCompleted: true,
          lastHydratedAt: new Date().toISOString(),
          error: err instanceof Error ? err.message : 'Unable to hydrate local case data.',
        }),
      });
    }

    try {
      const result = await loadCaseIntelligenceFromSupabase();
      const currentSnapshot = get().snapshot;
      const currentLocalRecords = get().localRecords;
      const shouldPreferPersistedLocal =
        result.source === 'fallback' && (hasPersistedSnapshot || get().hasPersistedSnapshot);
      const hasPendingLocalRecords = Object.values(currentLocalRecords).some(
        (record) => record.sync_status !== 'synced',
      );
      const nextSnapshot = shouldPreferPersistedLocal
        ? currentSnapshot
        : mergeLocalFirstSnapshot(result.snapshot, currentSnapshot, currentLocalRecords);
      const nextSource: CaseIntelligenceSource = shouldPreferPersistedLocal
        ? 'local'
        : hasPendingLocalRecords
          ? 'local'
          : result.source;

      set({
        snapshot: nextSnapshot,
        source: nextSource,
        loading: false,
        hasLoaded: true,
        error: null,
      });
      persistStateSnapshot(
        nextSnapshot,
        get().reportPreviewState,
        get().advisorState,
        get().localRecords,
        set,
        get,
      );
    } catch (err) {
      const persistedState = get();
      const nextSnapshot = persistedState.hasPersistedSnapshot
        ? persistedState.snapshot
        : createFallbackCaseIntelligence();
      const nextSource: CaseIntelligenceSource = persistedState.hasPersistedSnapshot
        ? 'local'
        : 'fallback';

      set({
        snapshot: nextSnapshot,
        source: nextSource,
        loading: false,
        hasLoaded: true,
        error: err instanceof Error ? err.message : 'Unable to load case intelligence.',
      });
      persistStateSnapshot(
        nextSnapshot,
        get().reportPreviewState,
        get().advisorState,
        get().localRecords,
        set,
        get,
      );
    }
  },
  saveCaseSetup: async (input) => {
    const current = get();
    const built = buildCaseSetupSnapshot(input, current.snapshot, current.localRecords);

    set({
      snapshot: built.snapshot,
      source: 'local',
      hasPersistedSnapshot: true,
      localRecords: built.localRecords,
    });
    persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
    );

    return {
      case: built.activeCase,
      source: 'local',
    };
  },
  createEntry: async (input) => {
    const current = get();
    const activeCase = getActiveCase(current.snapshot);
    const userId = activeCase?.user_id || '';
    const entry = await buildEntry(input, current.snapshot, userId);
    const recordKey = localRecordKey('entries', entry.id);
    const localRecord = createLocalRecordMeta({
      table: 'entries',
      id: entry.id,
    });
    const localEntry = withEntryLocalMeta(
      {
        ...entry,
        capture_method:
          input.captureSource === 'voice_placeholder' ? 'voice_placeholder_local' : 'manual_local',
      },
      localRecord,
    );

    set((state) => ({
      snapshot: appendEntry(state.snapshot, localEntry),
      source: 'local',
      hasPersistedSnapshot: true,
      localRecords: {
        ...state.localRecords,
        [recordKey]: localRecord,
      },
    }));
    persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
    );

    if (input.forceLocalOnly) {
      return {
        entry: localEntry,
        source: 'local',
        warning: 'Entry was saved locally. Remote writes are disabled for voice placeholders.',
      };
    }

    const remoteResult = await trySaveEntryToSupabase(localEntry);
    if (remoteResult.ok) {
      const syncedRecord = createLocalRecordMeta({
        table: 'entries',
        id: remoteResult.entry.id,
        status: 'synced',
        previous: get().localRecords[recordKey],
      });
      const syncedEntry = withEntryLocalMeta(
        {
          ...remoteResult.entry,
          capture_method: 'manual_supabase',
        },
        syncedRecord,
      );

      set((state) => ({
        snapshot: appendEntry(state.snapshot, syncedEntry),
        source: 'supabase',
        localRecords: {
          ...state.localRecords,
          [recordKey]: syncedRecord,
        },
      }));
      persistStateSnapshot(
        get().snapshot,
        get().reportPreviewState,
        get().advisorState,
        get().localRecords,
        set,
        get,
      );
    } else if (isSupabaseWriteEnabled) {
      const errorRecord = createLocalRecordMeta({
        table: 'entries',
        id: entry.id,
        status: 'error',
        previous: get().localRecords[recordKey],
        error: remoteResult.warning,
      });
      const errorEntry = withEntryLocalMeta(localEntry, errorRecord);

      set((state) => ({
        snapshot: appendEntry(state.snapshot, errorEntry),
        localRecords: {
          ...state.localRecords,
          [recordKey]: errorRecord,
        },
      }));
      persistStateSnapshot(
        get().snapshot,
        get().reportPreviewState,
        get().advisorState,
        get().localRecords,
        set,
        get,
      );
    }

    return {
      entry: remoteResult.ok ? remoteResult.entry : localEntry,
      source: remoteResult.ok ? 'supabase' : 'local',
      warning: remoteResult.warning,
    };
  },
  createPlaceholderAttachment: async (input) => {
    const current = get();
    const activeCase = getActiveCase(current.snapshot);
    const userId = activeCase?.user_id || '';
    const attachment = buildPlaceholderAttachment(input, current.snapshot, userId);
    const recordKey = localRecordKey('attachments', attachment.id);
    const localRecord = createLocalRecordMeta({
      table: 'attachments',
      id: attachment.id,
    });
    const localAttachment = withEvidenceAttachmentLocalMeta(attachment, localRecord);

    set((state) => ({
      snapshot: appendAttachment(state.snapshot, localAttachment),
      source: 'local',
      hasPersistedSnapshot: true,
      localRecords: {
        ...state.localRecords,
        [recordKey]: localRecord,
      },
    }));
    persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
    );

    return {
      attachment: localAttachment,
      source: 'local',
      warning: 'Attachment metadata was saved locally. Uploads and remote storage sync are not enabled in this PR.',
    };
  },
  createLocalAttachment: async (input) => {
    const current = get();
    const activeCase = getActiveCase(current.snapshot);
    const userId = activeCase?.user_id || '';
    const attachment = buildLocalAttachment(input, current.snapshot, userId);
    const recordKey = localRecordKey('attachments', attachment.id);
    const localRecord = createLocalRecordMeta({
      table: 'attachments',
      id: attachment.id,
      status: 'local_pending',
    });
    const localAttachment = withEvidenceAttachmentLocalMeta(attachment, localRecord);

    set((state) => ({
      snapshot: appendAttachment(state.snapshot, localAttachment),
      source: 'local',
      hasPersistedSnapshot: true,
      localRecords: {
        ...state.localRecords,
        [recordKey]: localRecord,
      },
    }));
    persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
    );

    return {
      attachment: localAttachment,
      source: 'local',
      warning:
        'Attachment metadata was saved locally. Original evidence stays on this device; remote storage uploads are disabled.',
    };
  },
  createFilingPackage: async (input) => {
    const current = get();
    const activeCase = getActiveCase(current.snapshot);
    const userId = activeCase?.user_id || '';
    const built = buildFilingPackage(input, current.snapshot, userId);
    const recordKey = localRecordKey('filing_packages', built.filingPackage.id);
    const localRecord = createLocalRecordMeta({
      table: 'filing_packages',
      id: built.filingPackage.id,
      status: 'local_pending',
    });

    set((state) => ({
      snapshot: appendFilingPackage(state.snapshot, built.filingPackage),
      source: 'local',
      hasPersistedSnapshot: true,
      filingBuilderState: {
        selectedPackageId: built.filingPackage.id,
        packageStates: {
          ...state.filingBuilderState.packageStates,
          [built.filingPackage.id]: built.localState,
        },
        updatedAt: new Date().toISOString(),
      },
      localRecords: {
        ...state.localRecords,
        [recordKey]: localRecord,
      },
    }));
    persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
    );

    return {
      filingPackage: built.filingPackage,
      source: 'local',
    };
  },
  selectFilingPackage: (packageId) => {
    set((state) => ({
      filingBuilderState: {
        ...state.filingBuilderState,
        selectedPackageId: packageId,
        updatedAt: new Date().toISOString(),
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
  updateFilingPackageStatus: (packageId, status) => {
    const key = localRecordKey('filing_packages', packageId);
    const localRecord = createLocalRecordMeta({
      table: 'filing_packages',
      id: packageId,
      status: 'local_pending',
      previous: get().localRecords[key],
    });

    set((state) => ({
      snapshot: updateFilingPackageRow(state.snapshot, packageId, { status }),
      source: 'local',
      hasPersistedSnapshot: true,
      filingBuilderState: {
        ...state.filingBuilderState,
        selectedPackageId: packageId,
        updatedAt: new Date().toISOString(),
      },
      localRecords: {
        ...state.localRecords,
        [key]: localRecord,
      },
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
  toggleFilingPackageEntry: (packageId, entryId) => {
    const key = localRecordKey('filing_packages', packageId);
    const localRecord = createLocalRecordMeta({
      table: 'filing_packages',
      id: packageId,
      status: 'local_pending',
      previous: get().localRecords[key],
    });

    set((state) => ({
      snapshot: updateFilingPackageRow(state.snapshot, packageId, {}),
      source: 'local',
      hasPersistedSnapshot: true,
      filingBuilderState: updateFilingBuilderPackageState(
        state.filingBuilderState,
        packageId,
        (packageState) => ({
          ...packageState,
          linkedEntryIds: toggleString(packageState.linkedEntryIds, entryId),
        }),
      ),
      localRecords: {
        ...state.localRecords,
        [key]: localRecord,
      },
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
  toggleFilingPackageAttachment: (packageId, attachmentId) => {
    const key = localRecordKey('filing_packages', packageId);
    const localRecord = createLocalRecordMeta({
      table: 'filing_packages',
      id: packageId,
      status: 'local_pending',
      previous: get().localRecords[key],
    });

    set((state) => ({
      snapshot: updateFilingPackageRow(state.snapshot, packageId, {}),
      source: 'local',
      hasPersistedSnapshot: true,
      filingBuilderState: updateFilingBuilderPackageState(
        state.filingBuilderState,
        packageId,
        (packageState) => ({
          ...packageState,
          linkedAttachmentIds: toggleString(packageState.linkedAttachmentIds, attachmentId),
        }),
      ),
      localRecords: {
        ...state.localRecords,
        [key]: localRecord,
      },
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
  toggleFilingPackageReport: (packageId, reportType) => {
    const key = localRecordKey('filing_packages', packageId);
    const localRecord = createLocalRecordMeta({
      table: 'filing_packages',
      id: packageId,
      status: 'local_pending',
      previous: get().localRecords[key],
    });

    set((state) => ({
      snapshot: updateFilingPackageRow(state.snapshot, packageId, {}),
      source: 'local',
      hasPersistedSnapshot: true,
      filingBuilderState: updateFilingBuilderPackageState(
        state.filingBuilderState,
        packageId,
        (packageState) => ({
          ...packageState,
          linkedReportTypes: packageState.linkedReportTypes.includes(reportType)
            ? packageState.linkedReportTypes.filter((item) => item !== reportType)
            : [...packageState.linkedReportTypes, reportType],
        }),
      ),
      localRecords: {
        ...state.localRecords,
        [key]: localRecord,
      },
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
  toggleFilingPackageChecklist: (packageId, item) => {
    const key = localRecordKey('filing_packages', packageId);
    const localRecord = createLocalRecordMeta({
      table: 'filing_packages',
      id: packageId,
      status: 'local_pending',
      previous: get().localRecords[key],
    });
    let nextProgress = 0;

    set((state) => {
      const filingBuilderState = updateFilingBuilderPackageState(
        state.filingBuilderState,
        packageId,
        (packageState) => {
          const checklist = {
            ...packageState.checklist,
            [item]: !packageState.checklist[item],
          };
          nextProgress = calculateChecklistProgress(checklist);

          return {
            ...packageState,
            checklist,
          };
        },
      );

      return {
        snapshot: updateFilingPackageRow(state.snapshot, packageId, {
          completion_percent: nextProgress,
        }),
        source: 'local',
        hasPersistedSnapshot: true,
        filingBuilderState,
        localRecords: {
          ...state.localRecords,
          [key]: localRecord,
        },
      };
    });
    persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
    );
  },
  acknowledgePattern: (patternId) => {
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
  saveReportVersion: (input) => {
    const now = new Date().toISOString();
    const version: SavedReportVersion = {
      id: `local-report-${Crypto.randomUUID()}`,
      reportType: input.reportType,
      title: input.title,
      createdAt: now,
      updatedAt: now,
      includedEntryIds: input.includedEntryIds,
      filters: input.filters,
      linkedFilingPackageIds: [],
    };

    set((state) => ({
      savedReportVersions: [version, ...state.savedReportVersions].slice(0, 20),
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

    return version;
  },
  updateEntryReview: (entryId, patch) => {
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
    persistStateSnapshot(
      get().snapshot,
      get().reportPreviewState,
      get().advisorState,
      get().localRecords,
      set,
      get,
    );
  },
}));

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
          .filter((date) => !date.deleted_at && date.case_id === caseId && date.date_type === 'hearing')
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
    otherParent: people.find((person) => !person.is_primary_client) ?? null,
    child: children[0] ?? null,
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
      .filter((filingPackage) => !filingPackage.deleted_at && filingPackage.case_id === caseId)
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
        .filter((entry) => !entry.deleted_at && entry.case_id === caseId)
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
            attachment.case_id === caseId || Boolean(attachment.entry_id && entryIds.has(attachment.entry_id)),
        )
        .sort((a, b) =>
          (b.captured_at ?? b.created_at).localeCompare(a.captured_at ?? a.created_at),
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

export function useReportPreviewState() {
  const filingBuilderState = useCaseIntelligenceStore((state) => state.filingBuilderState);
  const snapshot = useCaseIntelligenceStore((state) => state.snapshot);
  const activeCase = getActiveCase(snapshot);

  return {
    reportPreviewState: useCaseIntelligenceStore((state) => state.reportPreviewState),
    savedReportVersions: useCaseIntelligenceStore((state) => state.savedReportVersions),
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

export function useEntryDetail(entryId?: string) {
  const { snapshot, home, filingEntryLinkCounts, loading, error, hasHydrated, persistence } =
    useCaseIntelligenceHome();
  const entry = snapshot.entries.find((candidate) => candidate.id === entryId) ?? null;
  const child = entry
    ? snapshot.children.find((candidate) => candidate.id === entry.child_id) ?? null
    : null;
  const attachments = entry
    ? snapshot.evidenceAttachments
        .filter((attachment) => attachment.entry_id === entry.id)
        .filter((attachment) => !attachment.deleted_at)
        .sort((a, b) =>
          (b.captured_at ?? b.created_at).localeCompare(a.captured_at ?? a.created_at),
        )
    : [];

  return {
    snapshot,
    activeCase: home.activeCase,
    entry,
    child,
    attachments,
    filingLinkCount: entry ? filingEntryLinkCounts[entry.id] ?? 0 : 0,
    peoplePresent: [],
    loading,
    error,
    hasHydrated,
    persistence,
  };
}
