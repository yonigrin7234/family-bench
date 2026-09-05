import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';
import type { EvidenceSourceInput } from './core';
import { validateEvidenceSize } from './core';
import { discardTemporarySource, registerTemporarySource } from './sourceCleanup';

export type PickedEvidence = Omit<EvidenceSourceInput, 'entryId'>;
export type EvidencePickerSource = 'photo' | 'document' | 'camera';

function kindForMime(mime: string): EvidenceSourceInput['kind'] {
  return mime.startsWith('image/') ? 'photo' : mime.startsWith('audio/') ? 'voice_memo' : 'document';
}

async function prepareSelection(picked: PickedEvidence): Promise<PickedEvidence> {
  try {
    await registerTemporarySource(picked);
    if (picked.fileSizeBytes != null) validateEvidenceSize(picked.fileSizeBytes);
    return picked;
  } catch (error) {
    try { await discardTemporarySource(picked); }
    catch (cleanupError) { throw cleanupError; }
    throw error;
  }
}

function webDocument(): Promise<PickedEvidence | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    let settled = false;
    const settle = (value: PickedEvidence | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(value);
    };
    input.type = 'file';
    input.accept = 'application/pdf,image/*,audio/*,text/plain,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    input.style.display = 'none';
    input.addEventListener('cancel', () => settle(null), { once: true });
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { settle(null); return; }
      try {
        validateEvidenceSize(file.size);
        settle({
          kind: kindForMime(file.type), filename: file.name,
          mimeType: file.type || 'application/octet-stream', fileSizeBytes: file.size,
          localUri: URL.createObjectURL(file), sourceLabel: 'File selection',
          sourceMetadata: { file_last_modified_at: new Date(file.lastModified).toISOString() },
        });
      } catch (error) { settled = true; input.remove(); reject(error); }
    };
    document.body.appendChild(input);
    input.click();
  });
}

export async function pickEvidenceFile(source: EvidencePickerSource): Promise<PickedEvidence | null> {
  if (source === 'document') {
    if (Platform.OS === 'web') return webDocument();
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false });
    const asset = result.assets?.[0];
    if (!asset) return null;
    const mime = asset.mimeType || 'application/octet-stream';
    return prepareSelection({ kind: kindForMime(mime), filename: asset.name, mimeType: mime,
      fileSizeBytes: asset.size ?? null, localUri: asset.uri, sourceLabel: 'Document selection' });
  }
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error('Camera permission is required to capture a photo.');
  } else if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error('Photo library permission is required to select an image.');
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'], quality: 1, exif: true, allowsEditing: false,
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Current,
  };
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.assets?.[0];
  if (!asset) return null;
  const size = asset.fileSize ?? asset.file?.size ?? null;
  return prepareSelection({
    kind: asset.fileName?.toLowerCase().includes('screenshot') ? 'screenshot' : 'photo',
    filename: asset.fileName || `photo-${Date.now()}.jpg`,
    mimeType: asset.mimeType || 'image/jpeg', fileSizeBytes: size, localUri: asset.uri,
    sourceLabel: source === 'camera' ? 'Camera capture' : 'Photo library selection',
    capturedAt: source === 'camera' ? new Date().toISOString() : null,
    sourceMetadata: asset.exif ?? null,
  });
}

export function releasePickedEvidence(picked: PickedEvidence): void {
  if (Platform.OS === 'web' && picked.localUri?.startsWith('blob:')) URL.revokeObjectURL(picked.localUri);
}

export async function discardPickedEvidence(picked: PickedEvidence): Promise<void> {
  await discardTemporarySource(picked);
}
