import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { encodeBase64 } from '../evidence/encoding';
import { readEvidenceSource } from '../evidence/local';
import { discardPickedEvidence, pickEvidenceFile, type PickedEvidence } from '../evidence/picker';
import { discardTemporarySource, registerTemporarySource } from '../evidence/sourceCleanup';
import type { EvidenceSourceInput } from '../evidence/core';
import { MAX_CSV_BYTES } from './model';

export async function pickCsvBytes(): Promise<{ picked: PickedEvidence; bytes: Uint8Array } | null> {
  const picked = await pickEvidenceFile('document');
  if (!picked) return null;
  try {
    if (!picked.filename.toLowerCase().endsWith('.csv')) throw new Error('Choose a .csv file using the Family Bench template. Provider exports are not mapped automatically.');
    if (picked.fileSizeBytes != null && picked.fileSizeBytes > MAX_CSV_BYTES) throw new Error('The CSV exceeds the 4 MiB import limit.');
    const bytes = await readEvidenceSource({ ...picked, entryId: 'pending-csv-import' });
    if (!bytes.length || bytes.length > MAX_CSV_BYTES) throw new Error('Choose a non-empty CSV no larger than 4 MiB.');
    return { picked, bytes };
  } catch (error) { await discardPickedEvidence(picked).catch(() => undefined); throw error; }
}

/** Freeze exactly the previewed bytes before the original-file writer reads them. */
export async function frozenCsvSource(picked: PickedEvidence, bytes: Uint8Array): Promise<{ input: EvidenceSourceInput; release: () => Promise<void> }> {
  if (!bytes.length || bytes.length > MAX_CSV_BYTES) throw new Error('The reviewed CSV bytes are unavailable or exceed 4 MiB.');
  let localUri: string;
  if (Platform.OS === 'web') localUri = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'text/csv' }));
  else {
    if (!FileSystem.cacheDirectory) throw new Error('Device cache storage is unavailable. The CSV has not been imported.');
    localUri = `${FileSystem.cacheDirectory}family-bench-csv-${Crypto.randomUUID()}.csv`;
    const encoded = encodeBase64(bytes);
    try {
      await registerTemporarySource({ localUri });
      await FileSystem.writeAsStringAsync(localUri, encoded, { encoding: FileSystem.EncodingType.Base64 });
    } catch (error) {
      // Failed removal remains in the device cleanup queue, including after a restart.
      await discardTemporarySource({ localUri }).catch(() => undefined); throw error;
    }
  }
  const source: PickedEvidence = { ...picked, localUri, kind: 'document', mimeType: 'text/csv', fileSizeBytes: bytes.length, sourceLabel: 'Reviewed CSV import' };
  return { input: { ...source, entryId: 'pending-csv-import' }, release: () => discardTemporarySource(source) };
}
export async function hashCsvBytes(bytes: Uint8Array): Promise<string> {
  const hash = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, new Uint8Array(bytes));
  return Array.from(new Uint8Array(hash), (value) => value.toString(16).padStart(2, '0')).join('');
}
