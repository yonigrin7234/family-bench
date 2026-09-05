export const MAX_CSV_BYTES = 4 * 1024 * 1024;
export const MAX_CSV_RECORDS = 500;
export const IMPORT_VERSION = 1;
export type ImportProvenance = {
  version: 1;
  kind: 'csv_source' | 'csv_row';
  fileHash: string;
  scopeKey: string;
  sourceEntryId: string;
  sourceAttachmentId: string;
  /** One-based data row, excluding the CSV header. */
  rowIndex: number | null;
  rowHash: string | null;
};
export const SHA256_PATTERN = /^[a-f0-9]{64}$/;
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateImportProvenance(value: unknown): ImportProvenance {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('CSV import provenance is invalid.');
  const v = value as Record<string, unknown>;
  const keys = ['version', 'kind', 'fileHash', 'scopeKey', 'sourceEntryId', 'sourceAttachmentId', 'rowIndex', 'rowHash'];
  if (Object.keys(v).length !== keys.length || keys.some((key) => !Object.hasOwn(v, key)) || v.version !== 1 || !['csv_source', 'csv_row'].includes(String(v.kind))
    || typeof v.fileHash !== 'string' || !SHA256_PATTERN.test(v.fileHash) || typeof v.scopeKey !== 'string' || !SHA256_PATTERN.test(v.scopeKey)
    || typeof v.sourceEntryId !== 'string' || !UUID_PATTERN.test(v.sourceEntryId) || typeof v.sourceAttachmentId !== 'string' || !UUID_PATTERN.test(v.sourceAttachmentId)) throw new Error('CSV import provenance is invalid.');
  if (v.kind === 'csv_source' ? v.rowIndex !== null || v.rowHash !== null
    : typeof v.rowIndex !== 'number' || !Number.isInteger(v.rowIndex) || v.rowIndex < 1 || v.rowIndex > MAX_CSV_RECORDS || typeof v.rowHash !== 'string' || !SHA256_PATTERN.test(v.rowHash)) throw new Error('CSV import row provenance is invalid.');
  return { version: 1, kind: v.kind as ImportProvenance['kind'], fileHash: v.fileHash, scopeKey: v.scopeKey, sourceEntryId: v.sourceEntryId, sourceAttachmentId: v.sourceAttachmentId, rowIndex: v.rowIndex as number | null, rowHash: v.rowHash as string | null };
}
