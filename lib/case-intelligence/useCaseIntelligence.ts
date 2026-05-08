import { useEffect, useMemo } from 'react';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import type { Database, Tables, TablesInsert } from '@/lib/supabase/database.types';
import { hashString } from '@/lib/utils/hash';
import { getEntryTypeOption, type EntryTypeValue } from './entryTypes';
import {
  DEFAULT_ADVISOR_STATE,
  DEFAULT_REPORT_PREVIEW_STATE,
  createLocalRecordMeta,
  getLocalPersistenceAdapter,
  localRecordKey,
  readPersistedCaseIntelligence,
  withEvidenceAttachmentLocalMeta,
  withEntryLocalMeta,
  writePersistedCaseIntelligence,
} from './persistence';
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
  HomeCaseIntelligence,
  KeyDate,
  LocalPersistenceDiagnostics,
  LocalRecordMeta,
  Person,
  ReportPreviewState,
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

type CaseIntelligenceState = {
  snapshot: CaseIntelligenceSnapshot;
  source: CaseIntelligenceSource;
  reportPreviewState: ReportPreviewState;
  advisorState: AdvisorConversationState;
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
  sendAdvisorMessage: (input: SendAdvisorMessageInput) => void;
  setReportPreviewState: (patch: Partial<ReportPreviewState>) => void;
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
    advisorState,
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
  advisorState: DEFAULT_ADVISOR_STATE,
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
    let hydratedAdvisorState = get().advisorState;
    let hydratedLocalRecords = get().localRecords;
    let hasPersistedSnapshot = false;

    try {
      const localResult = await readPersistedCaseIntelligence();
      const hydratedAt = new Date().toISOString();

      if (localResult.document) {
        hydratedSnapshot = localResult.document.snapshot;
        hydratedSource = 'local';
        hydratedReportPreviewState = localResult.document.reportPreviewState;
        hydratedAdvisorState = localResult.document.advisorState;
        hydratedLocalRecords = localResult.document.localRecords;
        hasPersistedSnapshot = true;

        set({
          snapshot: hydratedSnapshot,
          source: hydratedSource,
          reportPreviewState: hydratedReportPreviewState,
          advisorState: hydratedAdvisorState,
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

export function useCaseIntelligenceHome() {
  const snapshot = useCaseIntelligenceStore((state) => state.snapshot);
  const source = useCaseIntelligenceStore((state) => state.source);
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

  return {
    snapshot,
    home,
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
  const { snapshot, home, loading, error, hasHydrated, persistence } = useCaseIntelligenceHome();

  return {
    snapshot,
    source: home.source,
    activeCase: home.activeCase,
    entries: getRecentEntries(snapshot, home.activeCase?.id, 100),
    flaggedEntries: getFlaggedEntries(snapshot, home.activeCase?.id),
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
    loading,
    error,
    hasHydrated,
    hasLocalCaseSetup: localCaseSetupExists,
    hasUserCaseSetup: userCaseSetupExists,
    isDemoCase: demoCase,
    persistence,
  } = useCaseIntelligenceHome();
  const caseId = home.activeCase?.id;

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

export function useReportPreviewState() {
  return {
    reportPreviewState: useCaseIntelligenceStore((state) => state.reportPreviewState),
    setReportPreviewState: useCaseIntelligenceStore((state) => state.setReportPreviewState),
  };
}

export function useLocalPersistenceDiagnostics() {
  return useCaseIntelligenceStore((state) => state.persistence);
}

export function useEntryDetail(entryId?: string) {
  const { snapshot, home, loading, error, hasHydrated, persistence } = useCaseIntelligenceHome();
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
    peoplePresent: [],
    loading,
    error,
    hasHydrated,
    persistence,
  };
}
