import type { CaseIntelligenceSnapshot, LocalRecordMeta } from './types';

// Foreign-key order is part of the RPC contract. Attachments follow entries;
// court orders may reference attachments, and key dates may reference filings.
export const SYNC_TABLES = [
  ['cases', 'cases'], ['children', 'children'], ['people', 'people'],
  ['entries', 'entries'], ['attachments', 'evidenceAttachments'],
  ['court_orders', 'courtOrders'], ['court_order_provisions', 'courtOrderProvisions'],
  ['filing_packages', 'filingPackages'], ['key_dates', 'keyDates'],
  ['pattern_tags', 'patternTags'], ['advisor_threads', 'advisorThreads'], ['ai_outputs', 'aiOutputs'],
] as const satisfies ReadonlyArray<readonly [string, keyof CaseIntelligenceSnapshot]>;

export type SyncVersion = { table_name: string; record_id: string; version: number; mutation_id: string };
export type SyncRow = Record<string, unknown> & { id: string; user_id: string };
export type SyncChange = { table_name: string; row: SyncRow; expected_version: number; mutation_id: string };
export type SyncConflict = { key: string; table: string; local: SyncRow; remote: SyncRow | null; version: number };

// Explicit app-writable fields: server provenance and future schema fields must
// never become writable merely because they were returned by a read.
const WRITABLE_FIELDS: Record<string, readonly string[]> = {
  cases: ['id', 'user_id', 'title', 'case_number', 'court_name', 'department', 'judge_name', 'case_type', 'status', 'county', 'state', 'is_active', 'next_hearing_at', 'created_at', 'updated_at', 'deleted_at'],
  children: ['id', 'user_id', 'case_id', 'name', 'date_of_birth', 'created_at', 'updated_at', 'deleted_at'],
  people: ['id', 'user_id', 'case_id', 'display_name', 'role', 'relationship', 'email', 'phone', 'is_primary_client', 'notes', 'created_at', 'updated_at', 'deleted_at'],
  entries: ['id', 'user_id', 'case_id', 'child_id', 'entry_type', 'event_date', 'event_time', 'event_end_time', 'custody_period', 'title', 'body', 'child_mood', 'is_flagged', 'flag_severity', 'flag_category', 'issue_key', 'location_name', 'location_lat', 'location_lng', 'metadata', 'voice_transcript', 'capture_method', 'content_hash', 'is_edited', 'private_notes', 'court_ready_summary', 'created_at', 'updated_at', 'deleted_at'],
  attachments: ['id', 'user_id', 'case_id', 'entry_id', 'file_name', 'file_type', 'mime_type', 'file_size_bytes', 'storage_bucket', 'storage_path', 'thumbnail_path', 'description', 'is_receipt', 'file_hash', 'hash_algorithm', 'captured_at', 'source_device', 'exif', 'created_at', 'deleted_at'],
  court_orders: ['id', 'user_id', 'case_id', 'order_date', 'order_title', 'order_type', 'source_attachment_id', 'provisions', 'created_at', 'updated_at', 'deleted_at'],
  court_order_provisions: ['id', 'user_id', 'case_id', 'court_order_id', 'provision_key', 'category', 'label', 'body', 'effective_date', 'end_date', 'created_at', 'updated_at', 'deleted_at'],
  filing_packages: ['id', 'user_id', 'case_id', 'title', 'filing_type', 'status', 'due_date', 'completion_percent', 'court_ready_summary', 'created_at', 'updated_at', 'deleted_at'],
  key_dates: ['id', 'user_id', 'case_id', 'date_type', 'event_date', 'event_time', 'title', 'description', 'is_completed', 'related_filing_package_id', 'related_court_order_id', 'created_at', 'updated_at', 'deleted_at'],
  pattern_tags: ['id', 'user_id', 'case_id', 'issue_key', 'label', 'severity', 'description', 'source_entry_ids', 'first_seen_on', 'last_seen_on', 'created_at', 'updated_at', 'deleted_at'],
  advisor_threads: ['id', 'user_id', 'case_id', 'title', 'topic', 'scope', 'status', 'last_message_at', 'created_at', 'updated_at', 'deleted_at'],
  ai_outputs: ['id', 'user_id', 'case_id', 'advisor_thread_id', 'output_type', 'status', 'prompt_key', 'model_name', 'title', 'summary', 'structured_output', 'grounding_notes', 'created_at', 'updated_at', 'deleted_at'],
  case_workspace_state: ['id', 'user_id', 'state', 'created_at', 'updated_at'],
};

export function cleanRemoteRow(table: string, row: SyncRow): SyncRow {
  const fields = WRITABLE_FIELDS[table];
  if (!fields) throw new Error('Unknown sync table.');
  const clean = JSON.parse(JSON.stringify(Object.fromEntries(fields.filter((field) => Object.hasOwn(row, field)).map((field) => [field, row[field]])))) as SyncRow;
  const field = table === 'entries' ? 'metadata' : table === 'attachments' ? 'exif' : null;
  if (field && clean[field] && typeof clean[field] === 'object') {
    const metadata = clean[field] as Record<string, unknown>;
    for (const key of Object.keys(metadata)) {
      if (key.startsWith('local_') || key.startsWith('sync_')) delete metadata[key];
    }
  }
  return clean;
}

export function prepareSyncChanges(
  snapshot: CaseIntelligenceSnapshot,
  records: Record<string, LocalRecordMeta>,
  ownerId: string,
  includeAttachments = false,
): SyncChange[] {
  const changes: SyncChange[] = [];
  for (const [table, collection] of SYNC_TABLES) {
    if (table === 'attachments' && !includeAttachments) continue;
    for (const row of snapshot[collection]) {
      const meta = records[`${table}:${row.id}`];
      if (!meta || meta.sync_status === 'synced') continue;
      if (row.user_id !== ownerId) throw new Error('A record does not belong to the active account. Sync stopped.');
      if (!meta.mutation_id) throw new Error('A record has no sync identity. Sync stopped to preserve it.');
      changes.push({ table_name: table, row: cleanRemoteRow(table, row), expected_version: meta.server_version ?? 0, mutation_id: meta.mutation_id });
    }
  }
  return changes;
}

export function mergeSyncReceipts(
  current: Record<string, LocalRecordMeta>,
  receipts: SyncVersion[],
): Record<string, LocalRecordMeta> {
  const next = { ...current };
  for (const receipt of receipts) {
    const key = `${receipt.table_name}:${receipt.record_id}`;
    const meta = next[key];
    if (!meta) continue;
    next[key] = {
      ...meta,
      server_version: receipt.version,
      // An edit made during the request must stay queued even if an earlier
      // mutation of the same record has just reached the server.
      sync_status: meta.mutation_id === receipt.mutation_id ? 'synced' : meta.sync_status,
      error: null,
    };
  }
  return next;
}

export function findSyncConflicts(changes: SyncChange[], remote: Record<string, SyncRow>, versions: SyncVersion[]): SyncConflict[] {
  const byKey = new Map(versions.map((v) => [`${v.table_name}:${v.record_id}`, v]));
  return changes.flatMap((change) => {
    const key = `${change.table_name}:${change.row.id}`;
    const version = byKey.get(key);
    if (version?.mutation_id === change.mutation_id || (version?.version ?? 0) === change.expected_version) return [];
    return [{ key, table: change.table_name, local: change.row, remote: remote[key] ?? null, version: version?.version ?? 0 }];
  });
}

export type ResolvedSyncConflict = SyncConflict & { resolutionId: string; resolvedAt: string; choice: 'device' | 'cloud' };

export function conflictRecordCopy(row: SyncRow | null): SyncRow | null {
  if (!row) return null;
  const copy = JSON.parse(JSON.stringify(row)) as SyncRow;
  // Existing resolution history is stored once, alongside this new record.
  if (copy.state && typeof copy.state === 'object') delete (copy.state as Record<string, unknown>).conflictHistory;
  return copy;
}
