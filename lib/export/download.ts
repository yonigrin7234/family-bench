import { Asset } from 'expo-asset';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { discardTemporarySource, registerTemporarySource } from '../evidence/sourceCleanup';
import type { TimelineArtifact, TimelineFonts } from './timeline';

async function fontBytes(module: number): Promise<Uint8Array> {
  const asset = Asset.fromModule(module);
  await asset.downloadAsync();
  const uri = asset.localUri || asset.uri;
  if (Platform.OS !== 'web') return new File(uri).bytes();
  const response = await fetch(uri);
  if (!response.ok) throw new Error('The report font could not be loaded. Please try again.');
  return new Uint8Array(await response.arrayBuffer());
}

export async function loadTimelineFonts(): Promise<TimelineFonts> {
  const [regular, bold] = await Promise.all([
    fontBytes(require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf')),
    fontBytes(require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf')),
  ]);
  return { regular, bold };
}

export async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, new Uint8Array(bytes));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function downloadArtifact(artifact: TimelineArtifact, assertCurrent: () => void = () => {}): Promise<void> {
  assertCurrent();
  if (Platform.OS === 'web') {
    if (typeof document === 'undefined') throw new Error('Open the app in a browser to download your export.');
    const url = URL.createObjectURL(new Blob([new Uint8Array(artifact.bytes).buffer], { type: artifact.mimeType }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = artifact.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }
  if (!await Sharing.isAvailableAsync()) throw new Error('File sharing is unavailable on this device. Open Family Bench on the web to download your export.');
  assertCurrent();
  const file = new File(Paths.cache, `${Crypto.randomUUID()}-${artifact.name}`);
  try {
    await registerTemporarySource({ localUri: file.uri });
    assertCurrent();
    file.create();
    file.write(artifact.bytes);
    assertCurrent();
    await Sharing.shareAsync(file.uri, { mimeType: artifact.mimeType, dialogTitle: 'Save or share your Family Bench export' });
  } finally {
    // Failed removal stays in the cleanup registry and is surfaced by its global notice.
    await discardTemporarySource({ localUri: file.uri }).catch(() => undefined);
  }
}
