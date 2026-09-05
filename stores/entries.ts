import { create } from 'zustand';

export interface Entry {
  id: string;
  user_id: string;
  case_id?: string;
  child_id?: string;
  entry_type: string;
  event_date: string;
  event_time?: string;
  event_end_time?: string;
  custody_period?: string;
  title?: string;
  body?: string;
  child_mood?: string;
  is_flagged: boolean;
  flag_severity?: string;
  flag_category?: string;
  location_name?: string;
  location_lat?: number;
  location_lng?: number;
  people_present?: string[];
  metadata: Record<string, unknown>;
  voice_transcript?: string;
  capture_method?: string;
  content_hash?: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  // UI-only
  has_attachments?: boolean;
  has_audio?: boolean;
}

interface EntryFilters {
  dateRange?: { start: string; end: string };
  entryType?: string;
  flaggedOnly?: boolean;
  searchQuery?: string;
}

interface EntriesState {
  entries: Entry[];
  filters: EntryFilters;
  loading: boolean;
  error: string | null;

  setEntries: (entries: Entry[]) => void;
  addEntry: (entry: Entry) => void;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
  softDeleteEntry: (id: string) => void;
  setFilters: (filters: Partial<EntryFilters>) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useEntriesStore = create<EntriesState>((set) => ({
  entries: [],
  filters: {},
  loading: false,
  error: null,

  setEntries: (entries) => set({ entries }),

  addEntry: (entry) =>
    set((state) => ({
      entries: [entry, ...state.entries],
    })),

  updateEntry: (id, updates) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e
      ),
    })),

  softDeleteEntry: (id) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, deleted_at: new Date().toISOString() } : e
      ),
    })),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  clearFilters: () => set({ filters: {} }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}));

// Selector: entries filtered by current filters, excluding soft-deleted
export function useFilteredEntries() {
  const entries = useEntriesStore((s) => s.entries);
  const filters = useEntriesStore((s) => s.filters);

  return entries.filter((e) => {
    if (e.deleted_at) return false;
    if (filters.entryType && e.entry_type !== filters.entryType) return false;
    if (filters.flaggedOnly && !e.is_flagged) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matches =
        e.title?.toLowerCase().includes(q) ||
        e.body?.toLowerCase().includes(q) ||
        e.location_name?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (filters.dateRange) {
      if (e.event_date < filters.dateRange.start) return false;
      if (e.event_date > filters.dateRange.end) return false;
    }
    return true;
  });
}
