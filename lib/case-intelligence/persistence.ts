import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import type { Json } from '@/lib/supabase/database.types';
import type {
  AdvisorConversationState,
  CaseIntelligenceSnapshot,
  Entry,
  EvidenceAttachment,
  LocalRecordMeta,
  LocalSyncStatus,
  ReportPreviewState,
} from './types';

const PERSISTENCE_VERSION = 1;
const STORAGE_KEY = 'family-bench.case-intelligence.v1';
const FILE_DIRECTORY = `${FileSystem.documentDirectory ?? ''}family-bench/`;
const FILE_URI = `${FILE_DIRECTORY}case-intelligence-v1.json`;

export const DEFAULT_REPORT_PREVIEW_STATE: ReportPreviewState = {
  reportType: 'timeline',
  typeFilter: 'all',
  flagFilter: 'all',
};

export const DEFAULT_ADVISOR_STATE: AdvisorConversationState = {
  threadId: 'local-advisor-thread',
  pinnedThreadId: 'local-advisor-thread',
  messages: [],
  updatedAt: null,
};

export type LocalPersistenceAdapter = 'localStorage' | 'fileSystem' | 'memory';

export type PersistedCaseIntelligenceDocument = {
  version: typeof PERSISTENCE_VERSION;
  savedAt: string;
  snapshot: CaseIntelligenceSnapshot;
  reportPreviewState: ReportPreviewState;
  advisorState: AdvisorConversationState;
  localRecords: Record<string, LocalRecordMeta>;
};

let memoryDocument: PersistedCaseIntelligenceDocument | null = null;

function hasWebStorage() {
  return Platform.OS === 'web' && typeof window !== 'undefined' && Boolean(window.localStorage);
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
    reportType,
    typeFilter,
    flagFilter,
  };
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

function parseDocument(raw: string): PersistedCaseIntelligenceDocument | null {
  const parsed = JSON.parse(raw) as Partial<PersistedCaseIntelligenceDocument>;
  if (parsed.version !== PERSISTENCE_VERSION || !parsed.snapshot) return null;

  return {
    version: PERSISTENCE_VERSION,
    savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
    snapshot: parsed.snapshot,
    reportPreviewState: normalizeReportPreviewState(parsed.reportPreviewState),
    advisorState: normalizeAdvisorState(parsed.advisorState),
    localRecords: parsed.localRecords ?? {},
  };
}

export async function readPersistedCaseIntelligence(): Promise<{
  adapter: LocalPersistenceAdapter;
  document: PersistedCaseIntelligenceDocument | null;
}> {
  const adapter = getLocalPersistenceAdapter();

  if (adapter === 'localStorage') {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return { adapter, document: raw ? parseDocument(raw) : null };
  }

  if (adapter === 'fileSystem') {
    const info = await FileSystem.getInfoAsync(FILE_URI);
    if (!info.exists) return { adapter, document: null };
    return { adapter, document: parseDocument(await FileSystem.readAsStringAsync(FILE_URI)) };
  }

  return { adapter, document: memoryDocument };
}

export async function writePersistedCaseIntelligence({
  snapshot,
  reportPreviewState,
  advisorState,
  localRecords,
}: {
  snapshot: CaseIntelligenceSnapshot;
  reportPreviewState: ReportPreviewState;
  advisorState: AdvisorConversationState;
  localRecords: Record<string, LocalRecordMeta>;
}): Promise<{ adapter: LocalPersistenceAdapter; savedAt: string }> {
  const adapter = getLocalPersistenceAdapter();
  const document: PersistedCaseIntelligenceDocument = {
    version: PERSISTENCE_VERSION,
    savedAt: new Date().toISOString(),
    snapshot,
    reportPreviewState,
    advisorState,
    localRecords,
  };
  const serialized = JSON.stringify(document);

  if (adapter === 'localStorage') {
    window.localStorage.setItem(STORAGE_KEY, serialized);
    return { adapter, savedAt: document.savedAt };
  }

  if (adapter === 'fileSystem') {
    await FileSystem.makeDirectoryAsync(FILE_DIRECTORY, { intermediates: true });
    await FileSystem.writeAsStringAsync(FILE_URI, serialized);
    return { adapter, savedAt: document.savedAt };
  }

  memoryDocument = document;
  return { adapter, savedAt: document.savedAt };
}
