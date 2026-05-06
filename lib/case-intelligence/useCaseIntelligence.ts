import { useEffect, useMemo, useState } from 'react';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { isSupabaseConfigured, supabase } from '@/lib/supabase/client';
import type { Database, Tables, TablesInsert } from '@/lib/supabase/database.types';
import { hashString } from '@/lib/utils/hash';
import { getEntryTypeOption, type EntryTypeValue } from './entryTypes';
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
  loading: boolean;
  hasLoaded: boolean;
  error: string | null;
  load: () => Promise<void>;
  createEntry: (input: CaptureEntryInput) => Promise<SaveEntryResult>;
  updateEntryReview: (entryId: string, patch: EntryReviewPatch) => void;
};

const isSupabaseWriteEnabled = process.env.EXPO_PUBLIC_ENABLE_SUPABASE_WRITES === 'true';

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
    id: Crypto.randomUUID(),
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

      return {
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
    }),
  };
}

function mergeCapturedEntries(
  loadedSnapshot: CaseIntelligenceSnapshot,
  currentSnapshot: CaseIntelligenceSnapshot,
): CaseIntelligenceSnapshot {
  const capturedEntries = currentSnapshot.entries.filter((entry) =>
    ['manual_local', 'manual_supabase'].includes(entry.capture_method ?? ''),
  );

  if (!capturedEntries.length) return loadedSnapshot;

  return {
    ...loadedSnapshot,
    entries: [
      ...capturedEntries,
      ...loadedSnapshot.entries.filter(
        (entry) => !capturedEntries.some((captured) => captured.id === entry.id),
      ),
    ],
  };
}

const useCaseIntelligenceStore = create<CaseIntelligenceState>((set, get) => ({
  snapshot: createFallbackCaseIntelligence(),
  source: 'fallback',
  loading: false,
  hasLoaded: false,
  error: null,
  load: async () => {
    set({ loading: true, error: null });
    try {
      const result = await loadCaseIntelligenceFromSupabase();
      const currentSnapshot = get().snapshot;
      set({
        snapshot: mergeCapturedEntries(result.snapshot, currentSnapshot),
        source: result.source,
        loading: false,
        hasLoaded: true,
        error: null,
      });
    } catch (err) {
      set({
        snapshot: createFallbackCaseIntelligence(),
        source: 'fallback',
        loading: false,
        hasLoaded: true,
        error: err instanceof Error ? err.message : 'Unable to load case intelligence.',
      });
    }
  },
  createEntry: async (input) => {
    const current = get();
    const activeCase = getActiveCase(current.snapshot);
    const userId = activeCase?.user_id || '';
    const entry = await buildEntry(input, current.snapshot, userId);
    const remoteResult = await trySaveEntryToSupabase(entry);
    const savedEntry = remoteResult.ok
      ? remoteResult.entry
      : {
          ...entry,
          capture_method: 'manual_local',
        };

    set((state) => ({
      snapshot: appendEntry(state.snapshot, savedEntry),
    }));

    return {
      entry: savedEntry,
      source: remoteResult.ok ? 'supabase' : 'fallback',
      warning: remoteResult.warning,
    };
  },
  updateEntryReview: (entryId, patch) => {
    set((state) => ({
      snapshot: updateEntryInSnapshot(state.snapshot, entryId, patch),
    }));
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
  };
}

export function useCaseIntelligenceTimeline() {
  const { snapshot, home, loading, error } = useCaseIntelligenceHome();

  return {
    snapshot,
    source: home.source,
    activeCase: home.activeCase,
    entries: getRecentEntries(snapshot, home.activeCase?.id, 100),
    flaggedEntries: getFlaggedEntries(snapshot, home.activeCase?.id),
    loading,
    error,
  };
}

export function useCaseMap() {
  const { snapshot, home, loading, error } = useCaseIntelligenceHome();
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
  };
}

export function useCaptureEntry() {
  return useCaseIntelligenceStore((state) => state.createEntry);
}

export function useUpdateEntryReview() {
  return useCaseIntelligenceStore((state) => state.updateEntryReview);
}

export function useEntryDetail(entryId?: string) {
  const { snapshot, home, loading, error } = useCaseIntelligenceHome();
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
  };
}
