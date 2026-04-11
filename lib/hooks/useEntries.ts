import { useCallback } from 'react';
import { useEntriesStore } from '@/stores/entries';
import { supabase } from '@/lib/supabase/client';
import { hashString } from '@/lib/utils/hash';
import { Platform } from 'react-native';
import type { Entry } from '@/stores/entries';

// Hook that handles entry CRUD with Supabase persistence.
// In production with PowerSync, reads come from local SQLite
// and writes sync automatically. This is the fallback/direct path.

export function useEntries() {
  const store = useEntriesStore();

  const fetchEntries = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);

    try {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .is('deleted_at', null)
        .order('event_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      store.setEntries((data as Entry[]) ?? []);
    } catch (e) {
      store.setError('Could not load entries. Pull to retry.');
    } finally {
      store.setLoading(false);
    }
  }, [store]);

  const createEntry = useCallback(
    async (entryData: Omit<Entry, 'id' | 'created_at' | 'updated_at' | 'is_edited' | 'content_hash'>) => {
      const now = new Date().toISOString();

      // SHA-256 hash of content for chain of custody
      const contentToHash = [
        entryData.entry_type,
        entryData.event_date,
        entryData.event_time ?? '',
        entryData.body ?? '',
        entryData.title ?? '',
        JSON.stringify(entryData.metadata ?? {}),
      ].join('|');
      const contentHash = await hashString(contentToHash);

      const entry: Entry = {
        ...entryData,
        id: crypto.randomUUID(),
        is_edited: false,
        content_hash: contentHash,
        capture_method: entryData.capture_method ?? 'manual_text',
        created_at: now,
        updated_at: now,
      };

      // Optimistic: add to local store immediately
      store.addEntry(entry);

      // Persist to Supabase (PowerSync handles this in production)
      try {
        const { error } = await supabase.from('entries').insert({
          id: entry.id,
          user_id: entry.user_id,
          case_id: entry.case_id,
          child_id: entry.child_id,
          entry_type: entry.entry_type,
          event_date: entry.event_date,
          event_time: entry.event_time,
          custody_period: entry.custody_period,
          title: entry.title,
          body: entry.body,
          child_mood: entry.child_mood,
          is_flagged: entry.is_flagged,
          flag_severity: entry.flag_severity,
          flag_category: entry.flag_category,
          location_name: entry.location_name,
          location_lat: entry.location_lat,
          location_lng: entry.location_lng,
          people_present: entry.people_present,
          metadata: entry.metadata,
          voice_transcript: entry.voice_transcript,
          capture_method: entry.capture_method,
          content_hash: contentHash,
          hash_algorithm: 'SHA-256',
          device_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          device_os: Platform.OS,
          app_version: '1.0.0',
          capture_timestamp: now,
          created_at: now,
          updated_at: now,
        });

        if (error) {
          console.error('Failed to sync entry:', error);
          // Entry stays in local store, will retry on next sync
        }
      } catch (e) {
        console.error('Network error saving entry:', e);
        // Offline: entry is in local store, PowerSync syncs later
      }

      return entry;
    },
    [store]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      // Optimistic soft delete
      store.softDeleteEntry(id);

      try {
        await supabase
          .from('entries')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);
      } catch (e) {
        console.error('Failed to sync delete:', e);
      }
    },
    [store]
  );

  return {
    entries: store.entries,
    loading: store.loading,
    error: store.error,
    fetchEntries,
    createEntry,
    deleteEntry,
  };
}
