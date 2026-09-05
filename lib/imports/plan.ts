import type { CaptureEntryInput } from '../case-intelligence/useCaseIntelligence';
import type { Entry } from '../case-intelligence/types';
import { getEntryMetadata } from '../case-intelligence/review';
import type { CsvRow } from './csv';
import { MAX_CSV_BYTES, MAX_CSV_RECORDS, SHA256_PATTERN, UUID_PATTERN, validateImportProvenance, type ImportProvenance } from './model';

export type ImportScope = { ownerId: string; caseId: string; childId: string | null };
export type ImportHasher = (bytes: Uint8Array) => Promise<string>;
export type PlannedCsvRow = { data: CsvRow; id: string; rowHash: string; repeatedRow: number | null };
export type CsvImportPlan = { scope: ImportScope; fileHash: string; byteLength: number; scopeKey: string; sourceEntryId: string; sourceAttachmentId: string; rows: PlannedCsvRow[] };
export function importProvenance(entry: Entry): ImportProvenance | null {
  try { return validateImportProvenance(getEntryMetadata(entry).import_provenance); } catch { return null; }
}
async function digest(value: string, hash: ImportHasher): Promise<string> {
  const result = await hash(new TextEncoder().encode(value));
  if (!SHA256_PATTERN.test(result)) throw new Error('Unable to compute a valid CSV import fingerprint.');
  return result;
}
function uuid(hash: string) { return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-8${hash.slice(13, 16)}-${((parseInt(hash[16], 16) & 3) | 8).toString(16)}${hash.slice(17, 20)}-${hash.slice(20, 32)}`; }
export async function buildCsvImportPlan(scope: ImportScope, bytes: Uint8Array, rows: CsvRow[], hash: ImportHasher): Promise<CsvImportPlan> {
  if (!UUID_PATTERN.test(scope.ownerId) || !UUID_PATTERN.test(scope.caseId) || (scope.childId !== null && !UUID_PATTERN.test(scope.childId))) throw new Error('Choose a valid account, case, and child scope.');
  if (!bytes.length || bytes.length > MAX_CSV_BYTES || !rows.length || rows.length > MAX_CSV_RECORDS || rows.some((row, index) => row.rowIndex !== index + 1)) throw new Error('The CSV must contain 1–500 sequential reviewed data rows and be no larger than 4 MiB.');
  const fileHash = await hash(bytes);
  if (!SHA256_PATTERN.test(fileHash)) throw new Error('Unable to fingerprint the CSV original.');
  const scopeKey = await digest(JSON.stringify(['family-bench-csv-v1', scope.ownerId, scope.caseId, fileHash, scope.childId]), hash);
  const sourceEntryId = uuid(await digest(`${scopeKey}:source-entry`, hash));
  const sourceAttachmentId = uuid(await digest(`${scopeKey}:source-attachment`, hash));
  const seen = new Map<string, number>();
  const planned: PlannedCsvRow[] = [];
  for (const data of rows) {
    const { rowIndex, ...content } = data;
    const rowHash = await digest(JSON.stringify(content), hash);
    const repeatedRow = seen.get(rowHash) ?? null;
    if (repeatedRow === null) seen.set(rowHash, rowIndex);
    planned.push({ data, rowHash, repeatedRow, id: uuid(await digest(`${scopeKey}:row:${rowIndex}:${rowHash}`, hash)) });
  }
  return { scope: { ...scope }, fileHash, byteLength: bytes.length, scopeKey, sourceEntryId, sourceAttachmentId, rows: planned };
}
export function provenanceFor(plan: CsvImportPlan, row?: PlannedCsvRow): ImportProvenance {
  return { version: 1, kind: row ? 'csv_row' : 'csv_source', fileHash: plan.fileHash, scopeKey: plan.scopeKey, sourceEntryId: plan.sourceEntryId, sourceAttachmentId: plan.sourceAttachmentId, rowIndex: row?.data.rowIndex ?? null, rowHash: row?.rowHash ?? null };
}
export function sourceEntryInput(plan: CsvImportPlan): CaptureEntryInput {
  return { id: plan.sourceEntryId, entryType: 'other', eventDate: plan.rows[0].data.eventDate, childId: plan.scope.childId, isFlagged: false, reviewVisibility: 'private',
    title: `Private CSV source — ${plan.fileHash.slice(0, 12)}`,
    body: `Private source for ${plan.rows.length} CSV data rows. The source record uses the first data row’s event date. The complete original may contain private notes. Imported rows are reviewed separately. SHA-256: ${plan.fileHash}.`,
    importProvenance: provenanceFor(plan) };
}
export function importedEntryInput(plan: CsvImportPlan, row: PlannedCsvRow): CaptureEntryInput {
  const { rowIndex, ...data } = row.data;
  return { ...data, id: row.id, childId: plan.scope.childId, reviewVisibility: 'private', importProvenance: provenanceFor(plan, row) };
}
export function findImportedDuplicate(entries: Entry[], plan: CsvImportPlan, row: PlannedCsvRow): Entry | undefined {
  const sameId = entries.find((entry) => entry.id === row.id);
  if (sameId) {
    const provenance = importProvenance(sameId);
    if (sameId.user_id !== plan.scope.ownerId || sameId.case_id !== plan.scope.caseId || sameId.child_id !== plan.scope.childId || sameId.deleted_at || JSON.stringify(provenance) !== JSON.stringify(provenanceFor(plan, row))) throw new Error(`Data row ${row.data.rowIndex} has an existing identity that does not match this import. No existing record was overwritten.`);
    return sameId;
  }
  return entries.find((entry) => entry.user_id === plan.scope.ownerId && entry.case_id === plan.scope.caseId && entry.child_id === plan.scope.childId && !entry.deleted_at
    && importProvenance(entry)?.kind === 'csv_row' && importProvenance(entry)?.rowHash === row.rowHash);
}
