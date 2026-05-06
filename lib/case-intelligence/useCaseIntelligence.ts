import { useEffect, useMemo } from 'react';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import type { Database, Tables, TablesInsert } from '@/lib/supabase/database.types';
import { hashString } from '@/lib/utils/hash';
import { getEntryTypeOption, type EntryTypeValue } from './entryTypes';
import {
  DEFAULT_REPORT_PREVIEW_STATE,
  createLocalRecordMeta,
  getLocalPersistenceAdapter,
  localRecordKey,
  readPersistedCaseIntelligence,
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
  CaseIntelligenceSnapshot,
  CaseIntelligenceSource,
  Entry,
  HomeCaseIntelligence,
  LocalPersistenceDiagnostics,
  LocalRecordMeta,
  ReportPreviewState,
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
  privateNotes?: string | null;
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

type CaseIntelligenceState = {
  snapshot: CaseIntelligenceSnapshot;
  source: CaseIntelligenceSource;
  reportPreviewState: ReportPreviewState;
  localRecords: Record<string, LocalRecordMeta>;
  persistence: LocalPersistenceDiagnostics;
  loading: boolean;
  hasLoaded: boolean;
  hasHydrated: boolean;
  hasPersistedSnapshot: boolean;
  error: string | null;
  load: () => Promise<void>;
  createEntry: (input: CaptureEntryInput) => Promise<SaveEntryResult>;
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
    flag_severity: input.isFlagged ? 'review' : null,
    flag_category: input.isFlagged ? option.issueKey : null,
    issue_key: option.issueKey,
    location_name: nullIfBlank(input.locationName),
    location_lat: null,
    location_lng: null,
    metadata: {
      capture_version: 'pr3a',
      entry_type_label: option.label,
    },
    voice_transcript: null,
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
      metadata.sync_status === 'pending' ||
      metadata.sync_status === 'error',
  );
}

function mergeLocalFirstSnapshot(
  loadedSnapshot: CaseIntelligenceSnapshot,
  localSnapshot: CaseIntelligenceSnapshot,
  localRecords: Record<string, LocalRecordMeta>,
): CaseIntelligenceSnapshot {
  const loadedEntryIds = new Set(loadedSnapshot.entries.map((entry) => entry.id));
  const localEntryById = new Map(localSnapshot.entries.map((entry) => [entry.id, entry]));
  const localOnlyEntries = localSnapshot.entries.filter(
    (entry) => !loadedEntryIds.has(entry.id) && hasLocalEntryState(entry, localRecords),
  );

  const entries = [
    ...localOnlyEntries,
    ...loadedSnapshot.entries.map((entry) => {
      const localEntry = localEntryById.get(entry.id);
      return localEntry && hasLocalEntryState(localEntry, localRecords) ? localEntry : entry;
    }),
  ];

  return {
    ...loadedSnapshot,
    entries,
  };
}

function persistStateSnapshot(
  snapshot: CaseIntelligenceSnapshot,
  reportPreviewState: ReportPreviewState,
  localRecords: Record<string, LocalRecordMeta>,
  set: (patch: Partial<CaseIntelligenceState>) => void,
  get: () => CaseIntelligenceState,
) {
  void writePersistedCaseIntelligence({
    snapshot,
    reportPreviewState,
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
    let hydratedLocalRecords = get().localRecords;
    let hasPersistedSnapshot = false;

    try {
      const localResult = await readPersistedCaseIntelligence();
      const hydratedAt = new Date().toISOString();

      if (localResult.document) {
        hydratedSnapshot = localResult.document.snapshot;
        hydratedSource = 'local';
        hydratedReportPreviewState = localResult.document.reportPreviewState;
        hydratedLocalRecords = localResult.document.localRecords;
        hasPersistedSnapshot = true;

        set({
          snapshot: hydratedSnapshot,
          source: hydratedSource,
          reportPreviewState: hydratedReportPreviewState,
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
      persistStateSnapshot(nextSnapshot, get().reportPreviewState, get().localRecords, set, get);
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
      persistStateSnapshot(nextSnapshot, get().reportPreviewState, get().localRecords, set, get);
    }
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
        capture_method: 'manual_local',
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
    persistStateSnapshot(get().snapshot, get().reportPreviewState, get().localRecords, set, get);

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
      persistStateSnapshot(get().snapshot, get().reportPreviewState, get().localRecords, set, get);
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
      persistStateSnapshot(get().snapshot, get().reportPreviewState, get().localRecords, set, get);
    }

    return {
      entry: remoteResult.ok ? remoteResult.entry : localEntry,
      source: remoteResult.ok ? 'supabase' : 'local',
      warning: remoteResult.warning,
    };
  },
  setReportPreviewState: (patch) => {
    set((state) => ({
      reportPreviewState: {
        ...state.reportPreviewState,
        ...patch,
      },
      hasPersistedSnapshot: true,
    }));
    persistStateSnapshot(get().snapshot, get().reportPreviewState, get().localRecords, set, get);
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
    persistStateSnapshot(get().snapshot, get().reportPreviewState, get().localRecords, set, get);
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

  return {
    snapshot,
    home,
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

export function useCaseMap() {
  const { snapshot, home, loading, error, hasHydrated, persistence } = useCaseIntelligenceHome();
  const caseId = home.activeCase?.id;

  return {
    snapshot,
    source: home.source,
    activeCase: home.activeCase,
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
    ? snapshot.evidenceAttachments.filter((attachment) => attachment.entry_id === entry.id)
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
