import { sanitizeCourtFormValues, type CourtFormDraft } from '../forms/model';
import { extractWorkspaceContext, type PreservedWorkspaceContext } from './contextIntegrity';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { assertSnapshotOwner, workspaceStorageKey } from './ownership';
import { createWriteQueue } from './writeQueue';
import type { ResolvedSyncConflict } from './syncModel';
import { captureWorkspaceLease } from './workspaceLease';
import { sealLocalBytes, openLocalBytes } from '@/lib/security/localEncryption';
import type { Json } from '@/lib/supabase/database.types';
import type {
  AdvisorConversationState,
  CaseIntelligenceSnapshot,
  CaseWorkspaceContext,
  Entry,
  EvidenceAttachment,
  FilingBuilderState,
  FilingChecklistKey,
  FilingPackageLocalState,
  LocalRecordMeta,
  LocalSyncStatus,
  PatternReviewState,
  ReportPreviewType,
  ReportPreviewState,
  SavedReportVersion,
} from './types';

const PERSISTENCE_VERSION = 2;
const enqueueWrite = createWriteQueue();
const sequences = new Map<string, number>();
const FILE_DIRECTORY = `${FileSystem.documentDirectory ?? ''}family-bench/`;


export const DEFAULT_REPORT_PREVIEW_STATE: ReportPreviewState = {
  reportType: 'timeline',
  typeFilter: 'all',
  flagFilter: 'all',
};

export const DEFAULT_SAVED_REPORT_VERSIONS: SavedReportVersion[] = [];

export const DEFAULT_ADVISOR_STATE: AdvisorConversationState = {
  threadId: 'local-advisor-thread',
  pinnedThreadId: 'local-advisor-thread',
  messages: [],
  updatedAt: null,
};

export const DEFAULT_FILING_CHECKLIST_STATE = {
  forms: false,
  exhibits: false,
  declarations: false,
  service: false,
} satisfies Record<FilingChecklistKey, boolean>;

export const DEFAULT_FILING_BUILDER_STATE: FilingBuilderState = {
  selectedPackageId: null,
  packageStates: {},
  updatedAt: null,
};

export const DEFAULT_PATTERN_REVIEW_STATE: PatternReviewState = {
  acknowledgedPatternIds: [],
  dismissedPatternIds: [],
  updatedAt: null,
};

export type LocalPersistenceAdapter = 'localStorage' | 'fileSystem' | 'memory';

export type PersistedCaseIntelligenceDocument = {
  version: typeof PERSISTENCE_VERSION;
  /** Read-time original context, before display normalization. Never written as a second copy. */
  unvalidatedWorkspaceState?: unknown;
  savedAt: string;
  sequence?: number;
  ownerId: string;
  snapshot: CaseIntelligenceSnapshot;
  selectedCaseId?: string | null;
  caseWorkspaceStates?: Record<string, CaseWorkspaceContext>;
  contextRecovery?: PreservedWorkspaceContext[];
  contextError?: string | null;
  reportPreviewState: ReportPreviewState;
  savedReportVersions: SavedReportVersion[];
  courtFormDrafts?: CourtFormDraft[];
  advisorState: AdvisorConversationState;
  filingBuilderState: FilingBuilderState;
  patternReviewState: PatternReviewState;
  conflictHistory: ResolvedSyncConflict[];
  localRecords: Record<string, LocalRecordMeta>;
};



function hasWebStorage() {
  try { return Platform.OS === 'web' && typeof window !== 'undefined' && Boolean(window.localStorage); }
  catch { return false; }
}

export function getLocalPersistenceAdapter(): LocalPersistenceAdapter {
  if (hasWebStorage()) return 'localStorage';
  if (FileSystem.documentDirectory) return 'fileSystem';
  return 'memory';
}

export function localRecordKey(table: string, id: string) {
  return `${table}:${id}`;
}

export function createLocalRecordMeta({
  table,
  id,
  now = new Date().toISOString(),
  status = 'pending',
  previous,
  error = null,
}: {
  table: string;
  id: string;
  now?: string;
  status?: LocalSyncStatus;
  previous?: LocalRecordMeta;
  error?: string | null;
}): LocalRecordMeta {
  return {
    table,
    id,
    local_created_at: previous?.local_created_at ?? now,
    local_updated_at: now,
    sync_status: status,
    error,
    server_version: previous?.server_version ?? 0,
    mutation_id: Crypto.randomUUID(),
  };
}

function asObjectJson(value: Json): Record<string, Json | undefined> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}

export function withEntryLocalMeta(entry: Entry, meta: LocalRecordMeta): Entry {
  return {
    ...entry,
    metadata: {
      ...asObjectJson(entry.metadata),
      local_created_at: meta.local_created_at,
      local_updated_at: meta.local_updated_at,
      sync_status: meta.sync_status,
      sync_error: meta.error ?? null,
    },
  };
}

export function withEvidenceAttachmentLocalMeta(
  attachment: EvidenceAttachment,
  meta: LocalRecordMeta,
): EvidenceAttachment {
  return {
    ...attachment,
    exif: {
      ...asObjectJson(attachment.exif),
      local_created_at: meta.local_created_at,
      local_updated_at: meta.local_updated_at,
      sync_status: meta.sync_status,
      sync_error: meta.error ?? null,
    },
  };
}

function normalizeReportPreviewState(value: unknown): ReportPreviewState {
  if (!value || typeof value !== 'object') return DEFAULT_REPORT_PREVIEW_STATE;
  const candidate = value as Partial<ReportPreviewState>;
  const reportType = candidate.reportType ?? DEFAULT_REPORT_PREVIEW_STATE.reportType;
  const typeFilter = candidate.typeFilter ?? DEFAULT_REPORT_PREVIEW_STATE.typeFilter;
  const flagFilter = candidate.flagFilter ?? DEFAULT_REPORT_PREVIEW_STATE.flagFilter;

  return {
    reportType: REPORT_TYPES.includes(reportType) ? reportType : 'timeline',
    typeFilter,
    flagFilter,
  };
}

function normalizeSavedReportVersions(value: unknown): SavedReportVersion[] {
  if (!Array.isArray(value)) return DEFAULT_SAVED_REPORT_VERSIONS;

  return value
    .filter((item) => item && typeof item === 'object')
    .map((item) => item as Partial<SavedReportVersion>)
    .filter((item) => typeof item.id === 'string' && typeof item.reportType === 'string')
    .map((item) => ({
      id: item.id as string,
      caseId: typeof item.caseId === 'string' ? item.caseId : null,
      reportType: item.reportType as ReportPreviewType,
      title: typeof item.title === 'string' ? item.title : 'Saved report',
      createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
      includedEntryIds: stringArray(item.includedEntryIds),
      filters: {
        typeFilter: item.filters?.typeFilter ?? DEFAULT_REPORT_PREVIEW_STATE.typeFilter,
        flagFilter: item.filters?.flagFilter ?? DEFAULT_REPORT_PREVIEW_STATE.flagFilter,
        childFilter: typeof item.filters?.childFilter === 'string' ? item.filters.childFilter : null,
        dateRangeLabel:
          typeof item.filters?.dateRangeLabel === 'string'
            ? item.filters.dateRangeLabel
            : 'Date range placeholder',
      },
      linkedFilingPackageIds: stringArray(item.linkedFilingPackageIds),
    }))
    .filter((item) => REPORT_TYPES.includes(item.reportType));
}

function normalizeAdvisorState(value: unknown): AdvisorConversationState {
  if (!value || typeof value !== 'object') return DEFAULT_ADVISOR_STATE;
  const candidate = value as Partial<AdvisorConversationState>;
  const messages = Array.isArray(candidate.messages)
    ? candidate.messages.filter(
        (message) =>
          message &&
          typeof message === 'object' &&
          'id' in message &&
          'role' in message &&
          'body' in message,
      )
    : [];

  return {
    threadId: typeof candidate.threadId === 'string' ? candidate.threadId : DEFAULT_ADVISOR_STATE.threadId,
    pinnedThreadId:
      typeof candidate.pinnedThreadId === 'string'
        ? candidate.pinnedThreadId
        : DEFAULT_ADVISOR_STATE.pinnedThreadId,
    messages: messages as AdvisorConversationState['messages'],
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : null,
  };
}

const CHECKLIST_KEYS: FilingChecklistKey[] = ['forms', 'exhibits', 'declarations', 'service'];
const REPORT_TYPES: ReportPreviewType[] = [
  'timeline',
  'flagged',
  'communication',
  'medical',
  'custodyExchange',
  'late', 'expense', 'benchBrief',
];

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function normalizeChecklist(value: unknown) {
  const candidate = value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Partial<Record<FilingChecklistKey, unknown>>)
    : {};

  return CHECKLIST_KEYS.reduce(
    (checklist, key) => ({
      ...checklist,
      [key]: typeof candidate[key] === 'boolean' ? candidate[key] : false,
    }),
    { ...DEFAULT_FILING_CHECKLIST_STATE },
  );
}

function normalizePackageState(packageId: string, value: unknown): FilingPackageLocalState {
  const candidate =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Partial<FilingPackageLocalState>)
      : {};
  const exhibitGroups = Array.isArray(candidate.exhibitGroups)
    ? candidate.exhibitGroups
        .filter((group) => group && typeof group === 'object')
        .map((group, index) => {
          const normalized = group as Partial<FilingPackageLocalState['exhibitGroups'][number]>;
          const label = typeof normalized.label === 'string' ? normalized.label : `Group ${index + 1}`;

          return {
            id: typeof normalized.id === 'string' ? normalized.id : `${packageId}-group-${index + 1}`,
            label,
            entryIds: stringArray(normalized.entryIds),
            attachmentIds: stringArray(normalized.attachmentIds),
          };
        })
    : [];

  return {
    packageId,
    linkedEntryIds: stringArray(candidate.linkedEntryIds),
    linkedAttachmentIds: stringArray(candidate.linkedAttachmentIds),
    linkedReportTypes: stringArray(candidate.linkedReportTypes).filter(
      (report): report is ReportPreviewType => REPORT_TYPES.includes(report as ReportPreviewType),
    ),
    checklist: normalizeChecklist(candidate.checklist),
    exhibitGroups,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : new Date().toISOString(),
  };
}

function normalizeFilingBuilderState(value: unknown): FilingBuilderState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_FILING_BUILDER_STATE;
  const candidate = value as Partial<FilingBuilderState>;
  const rawPackageStates =
    candidate.packageStates && typeof candidate.packageStates === 'object' && !Array.isArray(candidate.packageStates)
      ? candidate.packageStates
      : {};
  const packageStates = Object.entries(rawPackageStates).reduce<Record<string, FilingPackageLocalState>>(
    (states, [packageId, packageState]) => ({
      ...states,
      [packageId]: normalizePackageState(packageId, packageState),
    }),
    {},
  );
  const selectedPackageId =
    typeof candidate.selectedPackageId === 'string' && packageStates[candidate.selectedPackageId]
      ? candidate.selectedPackageId
      : null;

  return {
    selectedPackageId,
    packageStates,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : null,
  };
}

function normalizePatternReviewState(value: unknown): PatternReviewState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_PATTERN_REVIEW_STATE;
  }

  const candidate = value as Partial<PatternReviewState>;

  return {
    acknowledgedPatternIds: stringArray(candidate.acknowledgedPatternIds),
    dismissedPatternIds: stringArray(candidate.dismissedPatternIds),
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : null,
  };
}

function parseDocument(raw: string): PersistedCaseIntelligenceDocument | null {
  const parsed = JSON.parse(raw) as Partial<PersistedCaseIntelligenceDocument>;
  if (parsed.version !== PERSISTENCE_VERSION || !parsed.snapshot) return null;

  const rawWorkspace = extractWorkspaceContext(parsed as Record<string, unknown>);
  let workspace;
  try { workspace = normalizeWorkspaceState(rawWorkspace); } catch { workspace = normalizeWorkspaceState({}); }
  return {
    version: PERSISTENCE_VERSION,
    ...workspace,
    unvalidatedWorkspaceState: rawWorkspace,
    contextRecovery: parsed.contextRecovery ?? [],
    contextError: parsed.contextError ?? null,
    ownerId: typeof parsed.ownerId === 'string' ? parsed.ownerId : '',
    sequence: typeof parsed.sequence === 'number' ? parsed.sequence : 0,
    savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    snapshot: parsed.snapshot,
    selectedCaseId: typeof parsed.selectedCaseId === 'string' ? parsed.selectedCaseId : parsed.snapshot.selectedCaseId ?? null,
    localRecords: parsed.localRecords ?? {},
  };
}

function normalizeConflictHistory(value: unknown): ResolvedSyncConflict[] {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((row) => !row || typeof row.resolutionId !== 'string' || typeof row.key !== 'string' || !row.local)) throw new Error('Conflict history could not be read. The saved workspace has not been changed.');
  return value as ResolvedSyncConflict[];
}

function normalizeCaseWorkspaceStates(value: unknown): Record<string, CaseWorkspaceContext> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([id]) => /^[0-9a-f-]{36}$/i.test(id)).map(([id, context]) => {
    const item = context && typeof context === 'object' ? context as Record<string, unknown> : {};
    return [id, {
      reportPreviewState: normalizeReportPreviewState(item.reportPreviewState),
      advisorState: normalizeAdvisorState(item.advisorState),
      filingBuilderState: normalizeFilingBuilderState(item.filingBuilderState),
      patternReviewState: normalizePatternReviewState(item.patternReviewState),
    }];
  }));
}

function normalizeCourtFormDrafts(value: unknown): CourtFormDraft[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({ id: item.id, userId: item.userId, caseId: item.caseId, formId: item.formId, values: sanitizeCourtFormValues(item.formId, item.values), sourceEntryIds: stringArray(item.sourceEntryIds), createdAt: item.createdAt, updatedAt: item.updatedAt }));
}

export function normalizeWorkspaceState(value: unknown) {
  const candidate = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    selectedCaseId: typeof candidate.selectedCaseId === 'string' ? candidate.selectedCaseId : null,
    caseWorkspaceStates: normalizeCaseWorkspaceStates(candidate.caseWorkspaceStates),
    reportPreviewState: normalizeReportPreviewState(candidate.reportPreviewState),
    savedReportVersions: normalizeSavedReportVersions(candidate.savedReportVersions),
    courtFormDrafts: normalizeCourtFormDrafts(candidate.courtFormDrafts),
    advisorState: normalizeAdvisorState(candidate.advisorState),
    filingBuilderState: normalizeFilingBuilderState(candidate.filingBuilderState),
    patternReviewState: normalizePatternReviewState(candidate.patternReviewState),
    conflictHistory: normalizeConflictHistory(candidate.conflictHistory),
  };
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(text: string): Uint8Array {
  if (!/^(?:[0-9a-f]{2})+$/i.test(text)) throw new Error('Saved workspace is damaged. It has not been overwritten.');
  return Uint8Array.from(text.match(/../g)!, (byte) => parseInt(byte, 16));
}

async function decodeDocument(raw: string, ownerId: string): Promise<PersistedCaseIntelligenceDocument> {
  const bytes = await openLocalBytes(ownerId, fromHex(raw));
  const document = parseDocument(new TextDecoder().decode(bytes));
  if (!document || document.ownerId !== ownerId) throw new Error('Saved workspace could not be verified. It has not been overwritten.');
  assertSnapshotOwner(document.snapshot, ownerId);
  if (!Array.isArray(document.contextRecovery) || document.contextRecovery.some((copy) => copy.ownerId !== ownerId || typeof copy.id !== 'string' || !Array.isArray(copy.issues))) throw new Error('Saved context recovery copies could not be verified. The original file has been preserved.');
  return document;
}

export async function readPersistedCaseIntelligence(ownerId: string): Promise<{
  adapter: LocalPersistenceAdapter;
  document: PersistedCaseIntelligenceDocument | null;
  warning?: string;
}> {
  const key = workspaceStorageKey(ownerId);
  // A reopened native session must observe any prior session's pending save.
  // Queue reads and sequence initialization with writes and clears so a stale
  // hydrated snapshot cannot subsequently overwrite the newer disk copy.
  return enqueueWrite(key, async () => {
    const adapter = getLocalPersistenceAdapter();
    if (adapter === 'localStorage') {
      const raw = window.localStorage.getItem(key);
      return { adapter, document: raw ? await decodeDocument(raw, ownerId) : null };
    }
    if (adapter === 'fileSystem') {
      const candidates: PersistedCaseIntelligenceDocument[] = [];
      let damaged = false;
      for (const slot of ['a', 'b']) {
        const uri = `${FILE_DIRECTORY}${key}.${slot}.enc`;
        const info = await FileSystem.getInfoAsync(uri);
        if (!info.exists) continue;
        try { candidates.push(await decodeDocument(await FileSystem.readAsStringAsync(uri), ownerId)); }
        catch { damaged = true; }
      }
      candidates.sort((a, b) => (b.sequence ?? 0) - (a.sequence ?? 0));
      const document = candidates[0] ?? null;
      if (damaged && !document) throw new Error('Saved workspace is damaged. Its files have been preserved for recovery.');
      sequences.set(key, document?.sequence ?? 0);
      return { adapter, document, warning: damaged ? 'An interrupted save was recovered from the previous verified copy. Review your latest changes.' : undefined };
    }
    throw new Error('Durable storage is unavailable on this device. Case records cannot be saved.');
  });
}

export async function writePersistedCaseIntelligence(input: {
  ownerId: string;
  snapshot: CaseIntelligenceSnapshot;
  selectedCaseId?: string | null;
  caseWorkspaceStates?: Record<string, CaseWorkspaceContext>;
  contextRecovery?: PreservedWorkspaceContext[];
  contextError?: string | null;
  reportPreviewState: ReportPreviewState;
  savedReportVersions: SavedReportVersion[];
  courtFormDrafts?: CourtFormDraft[];
  advisorState: AdvisorConversationState;
  filingBuilderState: FilingBuilderState;
  patternReviewState: PatternReviewState;
  conflictHistory: ResolvedSyncConflict[];
  localRecords: Record<string, LocalRecordMeta>;
}): Promise<{ adapter: LocalPersistenceAdapter; savedAt: string }> {
  const key = workspaceStorageKey(input.ownerId);
  const assertLease = captureWorkspaceLease(input.ownerId);
  assertSnapshotOwner(input.snapshot, input.ownerId);
  if ((input.contextRecovery ?? []).some((copy) => copy.ownerId !== input.ownerId)) throw new Error('Context recovery copies cannot be moved between accounts.');
  // Capture now: callers can mutate their state again while this write waits.
  const captured = JSON.parse(JSON.stringify(input)) as typeof input;
  return enqueueWrite(key, async () => {
    const adapter = getLocalPersistenceAdapter();
    const savedAt = new Date().toISOString();
    const sequence = (sequences.get(key) ?? 0) + 1;
    const document: PersistedCaseIntelligenceDocument = { ...captured, version: PERSISTENCE_VERSION, savedAt, sequence };
    const encoded = toHex(await sealLocalBytes(input.ownerId, new TextEncoder().encode(JSON.stringify(document))));
    assertLease();
    if (adapter === 'localStorage') {
      window.localStorage.setItem(key, encoded);
      if (window.localStorage.getItem(key) !== encoded) throw new Error('Workspace write could not be verified. Please retry.');
    } else if (adapter === 'fileSystem') {
      await FileSystem.makeDirectoryAsync(FILE_DIRECTORY, { intermediates: true });
      // Alternate complete encrypted documents. A process termination during a
      // write leaves the other generation available for explicit recovery.
      const uri = `${FILE_DIRECTORY}${key}.${sequence % 2 ? 'a' : 'b'}.enc`;
      await FileSystem.writeAsStringAsync(uri, encoded);
      if (await FileSystem.readAsStringAsync(uri) !== encoded) throw new Error('Workspace write could not be verified. Please retry.');
    } else throw new Error('Durable storage is unavailable. Your changes have not been saved.');
    sequences.set(key, sequence);
    return { adapter, savedAt };
  });
}

export async function clearPersistedCaseIntelligence(ownerId: string): Promise<{ adapter: LocalPersistenceAdapter; clearedAt: string }> {
  const key = workspaceStorageKey(ownerId);
  return enqueueWrite(key, async () => {
    const adapter = getLocalPersistenceAdapter();
    if (adapter === 'localStorage') window.localStorage.removeItem(key);
    else if (adapter === 'fileSystem') {
      for (const slot of ['a', 'b']) await FileSystem.deleteAsync(`${FILE_DIRECTORY}${key}.${slot}.enc`, { idempotent: true });
    }
    sequences.delete(key);
    return { adapter, clearedAt: new Date().toISOString() };
  });
}
