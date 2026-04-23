import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

// SHA-256 hash of a file for chain-of-custody evidence integrity.
// Every file captured (photo, audio, document) gets hashed at creation.
// This hash is stored alongside the entry and can verify the file hasn't been tampered with.

export async function hashFile(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    // Web: fetch file as ArrayBuffer, hash with SubtleCrypto
    try {
      const response = await fetch(uri);
      const buffer = await response.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return 'hash-unavailable-web';
    }
  }

  // Native: read file as base64, hash with expo-crypto
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64' as any,
    });
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      base64
    );
    return hash;
  } catch {
    return 'hash-unavailable';
  }
}

// Hash a string (for content_hash on text entries)
export async function hashString(content: string): Promise<string> {
  if (Platform.OS === 'web') {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return 'hash-unavailable-web';
    }
  }

  try {
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      content
    );
  } catch {
    return 'hash-unavailable';
  }
}
