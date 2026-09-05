export type RequestedEntrySelection = { ids: string[] | null; error: string | null };

/** Absent selection means the case flow; a malformed explicit selection must never become all records. */
export function parseRequestedEntryIds(value: string | undefined): RequestedEntrySelection {
  if (value === undefined) return { ids: null, error: null };
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string' && /^[\w-]{1,160}$/.test(id))) throw new Error('Invalid selection');
    return { ids: [...new Set(parsed)], error: null };
  } catch {
    return { ids: [], error: 'This export link has an invalid record selection. Return to the source screen and choose the records again.' };
  }
}

export function parseRequestedEntrySelection(entryId?: string, entryIds?: string): RequestedEntrySelection {
  if (entryId === undefined) return parseRequestedEntryIds(entryIds);
  if (entryIds !== undefined || !/^[\w-]{1,160}$/.test(entryId)) {
    return { ids: [], error: 'This export link has an invalid record selection. Return to the source screen and choose the records again.' };
  }
  return { ids: [entryId], error: null };
}
