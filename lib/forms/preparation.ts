import type { Entry } from '../case-intelligence/types';
import { courtFormSections, sanitizeCourtFormValues, type CourtFormDraft } from './model';
import { assertCourtFormSources } from './sources';

type PreparingDraft = Pick<CourtFormDraft, 'id' | 'userId' | 'caseId' | 'formId' | 'values' | 'sourceEntryIds'>;

function sourceIds(draft: PreparingDraft) { return [...new Set(draft.sourceEntryIds)].sort(); }

function draftContent(draft: PreparingDraft): string {
  const values = sanitizeCourtFormValues(draft.formId, draft.values);
  return JSON.stringify({
    id: draft.id, userId: draft.userId, caseId: draft.caseId, formId: draft.formId,
    // Missing optional values and explicit blanks have the same PDF meaning.
    values: courtFormSections(draft.formId).flatMap((section) => section.fields).map((field) => [field.id, values[field.id] ?? (field.kind === 'check' ? false : '')]),
    sourceEntryIds: sourceIds(draft),
  });
}

function sourceContent(draft: PreparingDraft, entries: Entry[]): string {
  const ids = sourceIds(draft);
  assertCourtFormSources(ids, entries, draft.caseId, draft.userId);
  return JSON.stringify(ids.map((id) => {
    const matches = entries.filter((entry) => entry.id === id);
    if (matches.length !== 1) throw new Error('A source entry is unavailable or inconsistent. Review this draft before generating a PDF.');
    const entry = matches[0];
    // Pin the exact source facts from before saving. Sync timestamps, private
    // notes and unrelated records do not change the text chosen for this form.
    return { id, userId: entry.user_id, caseId: entry.case_id, body: entry.body, date: entry.event_date, time: entry.event_time };
  }));
}

/** Call before the first save await, then assert against the saved draft after
 * every asynchronous boundary. Account/session/mount checks remain the caller's. */
export function pinCourtFormPreparation(draft: PreparingDraft, entries: Entry[]): (drafts: CourtFormDraft[], currentEntries: Entry[]) => void {
  const expectedDraft = draftContent(draft);
  const expectedSources = sourceContent(draft, entries);
  // Retain only immutable expectations; neither the editor nor a store row can
  // mutate the reference used for subsequent checks.
  const pinned = { ...draft, sourceEntryIds: sourceIds(draft) };
  return (drafts, currentEntries) => {
    const matches = drafts.filter((current) => current.id === pinned.id);
    if (matches.length !== 1 || draftContent(matches[0]) !== expectedDraft) {
      throw new Error('The form draft changed during preparation. Review it and try again.');
    }
    if (sourceContent(pinned, currentEntries) !== expectedSources) {
      throw new Error('A source entry’s facts changed during preparation. Review this draft and try again.');
    }
  };
}
