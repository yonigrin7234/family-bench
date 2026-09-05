import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import type { CourtFormId } from './model';

/** Kept behind a dynamic import so the PDF assets do not load with the app shell. */
export async function loadCourtFormTemplate(formId: CourtFormId): Promise<Uint8Array> {
  if (formId !== 'mc031' && formId !== 'fl300') throw new Error('This court form is not supported.');
  const asset = Asset.fromModule(formId === 'mc031'
    ? require('../../assets/forms/mc-031.acroform.pdf')
    : require('../../assets/forms/fl-300.acroform.pdf'));
  await asset.downloadAsync();
  const uri = asset.localUri || asset.uri;
  if (Platform.OS !== 'web') return new File(uri).bytes();
  const response = await fetch(uri);
  if (!response.ok) throw new Error('The official form template could not be loaded. Please try again.');
  return new Uint8Array(await response.arrayBuffer());
}
