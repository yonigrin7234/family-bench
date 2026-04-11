import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { hashFile } from '@/lib/utils/hash';

export interface CapturedPhoto {
  uri: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileHash: string;
  exifTimestamp?: string;
  exifGpsLat?: number;
  exifGpsLng?: number;
  exifDeviceMake?: string;
  exifDeviceModel?: string;
}

async function extractPhotoData(
  result: ImagePicker.ImagePickerAsset
): Promise<CapturedPhoto> {
  const uri = result.uri;
  const fileName = result.fileName ?? uri.split('/').pop() ?? 'photo.jpg';
  const fileType = result.mimeType ?? 'image/jpeg';

  // Get file size
  let fileSize = 0;
  if (Platform.OS !== 'web') {
    const info = await FileSystem.getInfoAsync(uri);
    fileSize = info.exists ? (info.size ?? 0) : 0;
  }

  // SHA-256 hash for chain of custody
  const fileHash = await hashFile(uri);

  // EXIF data
  const exif = result.exif;
  let exifTimestamp: string | undefined;
  let exifGpsLat: number | undefined;
  let exifGpsLng: number | undefined;
  let exifDeviceMake: string | undefined;
  let exifDeviceModel: string | undefined;

  if (exif) {
    exifTimestamp = exif.DateTimeOriginal as string | undefined;
    exifDeviceMake = exif.Make as string | undefined;
    exifDeviceModel = exif.Model as string | undefined;

    // GPS coordinates from EXIF
    if (exif.GPSLatitude != null && exif.GPSLongitude != null) {
      exifGpsLat = exif.GPSLatitude as number;
      exifGpsLng = exif.GPSLongitude as number;
    }
  }

  return {
    uri,
    fileName,
    fileType,
    fileSize,
    fileHash,
    exifTimestamp,
    exifGpsLat,
    exifGpsLng,
    exifDeviceMake,
    exifDeviceModel,
  };
}

export function useCamera() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = async (): Promise<CapturedPhoto | null> => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Camera permission needed to capture evidence photos.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        exif: true, // Preserve EXIF for forensic metadata
      });

      if (result.canceled || !result.assets?.[0]) return null;
      return extractPhotoData(result.assets[0]);
    } catch (e) {
      setError('Failed to capture photo. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async (): Promise<CapturedPhoto | null> => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Photo library access needed to attach evidence.');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        exif: true,
      });

      if (result.canceled || !result.assets?.[0]) return null;
      return extractPhotoData(result.assets[0]);
    } catch (e) {
      setError('Failed to select photo. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { takePhoto, pickFromGallery, loading, error };
}
