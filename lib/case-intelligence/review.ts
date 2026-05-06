import type { Json } from '@/lib/supabase/database.types';
import type { Entry } from './types';

export type EntryReviewMetadata = {
  captured_body?: string | null;
  reviewed_at?: string | null;
  reviewed_body_updated_at?: string | null;
  review_visibility?: 'court_ready' | 'private';
  [key: string]: Json | undefined;
};

export function getEntryMetadata(entry: Entry): EntryReviewMetadata {
  if (!entry.metadata || typeof entry.metadata !== 'object' || Array.isArray(entry.metadata)) {
    return {};
  }

  return entry.metadata as EntryReviewMetadata;
}

export function getCapturedBody(entry: Entry) {
  const metadata = getEntryMetadata(entry);
  return typeof metadata.captured_body === 'string' ? metadata.captured_body : entry.body;
}

export function isEntryReviewed(entry: Entry) {
  return Boolean(getEntryMetadata(entry).reviewed_at);
}
