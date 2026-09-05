import { supabase } from '@/lib/supabase/client';
import type { Json } from '@/lib/supabase/database.types';
import { getWorkspaceOwnerId } from '@/lib/auth/session';
import { assertSnapshotOwner } from './ownership';
import { SYNC_TABLES, type SyncChange, type SyncRow, type SyncVersion } from './syncModel';
import type { CaseIntelligenceSnapshot } from './types';

export type CloudWorkspace = {
  snapshot: CaseIntelligenceSnapshot;
  versions: SyncVersion[];
  workspace: Record<string, unknown> | null;
  rows: Record<string, SyncRow>;
};

function clientFor(ownerId: string) {
  if (getWorkspaceOwnerId() !== ownerId) throw new Error('Account changed. Open your current case and try again.');
  if (!supabase) throw new Error('Family Bench cloud connection is not configured.');
  return supabase;
}

export async function fetchCloudWorkspace(ownerId: string): Promise<CloudWorkspace> {
  const client = clientFor(ownerId);
  // Rows and their versions must come from the same PostgreSQL statement
  // snapshot. Separate requests could attach a new version to old row content.
  const { data, error } = await client.rpc('read_case_workspace');
  clientFor(ownerId);
  if (error) throw new Error(`Unable to open your cloud workspace. ${error.message}`);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('The cloud workspace response is incomplete.');
  const value = data as unknown as { snapshot: CaseIntelligenceSnapshot; versions: SyncVersion[]; workspace: SyncRow | null };
  assertSnapshotOwner(value.snapshot, ownerId);
  if (!Array.isArray(value.versions) || value.versions.some((v) => typeof v.table_name !== 'string' || typeof v.record_id !== 'string' || !Number.isSafeInteger(v.version) || v.version < 1)) throw new Error('Cloud record versions could not be verified.');
  if (value.workspace && (value.workspace.user_id !== ownerId || value.workspace.id !== ownerId)) throw new Error('Cloud workspace account does not match.');
  const rows: Record<string, SyncRow> = {};
  for (const [table, collection] of SYNC_TABLES) for (const row of value.snapshot[collection]) rows[`${table}:${row.id}`] = row;
  if (value.workspace) rows[`case_workspace_state:${ownerId}`] = value.workspace;
  return { snapshot: value.snapshot, versions: value.versions, workspace: value.workspace?.state as Record<string, unknown> | null ?? null, rows };
}

export async function sendCloudChanges(ownerId: string, changes: SyncChange[]): Promise<SyncVersion[]> {
  if (!changes.length) return [];
  const client = clientFor(ownerId);
  const { data, error } = await client.rpc('sync_case_records', { changes: changes as unknown as Json });
  clientFor(ownerId);
  if (error) throw new Error(error.message === 'SYNC_CONFLICT' || error.message.includes('SYNC_CONFLICT') ? 'SYNC_CONFLICT' : `Sync could not finish. ${error.message}`);
  if (!Array.isArray(data)) throw new Error('The server returned an invalid sync receipt. Changes remain on this device.');
  const receipts = data as unknown as SyncVersion[];
  for (const change of changes) {
    const receipt = receipts.find((r) => r.table_name === change.table_name && r.record_id === change.row.id && r.mutation_id === change.mutation_id);
    if (!receipt || !Number.isSafeInteger(receipt.version) || receipt.version < 1) throw new Error('The server did not confirm every change. Sync will retry safely.');
  }
  return receipts;
}
