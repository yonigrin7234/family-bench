import type { CaseIntelligenceSnapshot } from './types';

export function emptyCaseSnapshot(): CaseIntelligenceSnapshot {
  return { cases: [], children: [], people: [], entries: [], evidenceAttachments: [], courtOrders: [], courtOrderProvisions: [], filingPackages: [], keyDates: [], patternTags: [], aiOutputs: [], advisorThreads: [] };
}

export function assertSnapshotOwner(snapshot: CaseIntelligenceSnapshot, ownerId: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ownerId)) throw new Error('Invalid account identity.');
  if (!snapshot || typeof snapshot !== 'object') throw new Error('Saved workspace is invalid. It has not been changed.');
  for (const key of Object.keys(emptyCaseSnapshot()) as Array<keyof CaseIntelligenceSnapshot>) {
    const rows = snapshot[key];
    if (!Array.isArray(rows) || rows.some((row) => !row || row.user_id !== ownerId || typeof row.id !== 'string')) {
      throw new Error('This saved workspace belongs to a different account. It has not been opened or changed.');
    }
  }
}

export function workspaceStorageKey(ownerId: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ownerId)) throw new Error('Invalid account identity.');
  return `family-bench.account.${ownerId}.v2`;
}
