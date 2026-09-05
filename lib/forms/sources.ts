import type { Entry } from '../case-intelligence/types';
import { isPrivateEntry } from '../export/model';

export function courtFormSources(entries: Entry[], caseId: string, ownerId: string): Entry[] {
  return entries.filter((entry) => entry.case_id === caseId && entry.user_id === ownerId && !entry.deleted_at && !isPrivateEntry(entry))
    .sort((a, b) => a.event_date.localeCompare(b.event_date) || a.id.localeCompare(b.id));
}

export function assertCourtFormSources(sourceEntryIds: string[], entries: Entry[], caseId: string, ownerId: string): void {
  const available = new Set(courtFormSources(entries, caseId, ownerId).map((entry) => entry.id));
  if (sourceEntryIds.some((id) => !available.has(id))) throw new Error('A source entry is private, unavailable, or belongs to another case. Review this draft before generating a PDF.');
}

/** The user chooses the insertion; private notes and legal conclusions are never added. */
export function courtFormSourceText(entry: Entry): string {
  if (isPrivateEntry(entry) || entry.deleted_at) throw new Error('This entry cannot be inserted in a court form.');
  if (!entry.body?.trim()) throw new Error('This entry has no factual text to insert.');
  return `${entry.event_date}${entry.event_time ? ` ${entry.event_time}` : ''}\n${entry.body.trim()}`;
}
