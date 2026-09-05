const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function encodeBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  let chunk = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0);
    chunk += ALPHABET[n >>> 18] + ALPHABET[(n >>> 12) & 63]
      + (i + 1 < bytes.length ? ALPHABET[(n >>> 6) & 63] : '=')
      + (i + 2 < bytes.length ? ALPHABET[n & 63] : '=');
    if (chunk.length >= 32768) { chunks.push(chunk); chunk = ''; }
  }
  return chunks.join('') + chunk;
}

export function decodeBase64(value: string): Uint8Array {
  const raw = value.replace(/\s/g, '');
  const padding = raw.endsWith('==') ? 2 : raw.endsWith('=') ? 1 : 0;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(raw) || raw.length % 4 !== 0) throw new Error('Unreadable evidence file encoding.');
  const bytes = new Uint8Array((raw.length / 4) * 3 - padding);
  let output = 0;
  for (let i = 0; i < raw.length; i += 4) {
    const n = (ALPHABET.indexOf(raw[i]) << 18) | (ALPHABET.indexOf(raw[i + 1]) << 12)
      | (Math.max(0, ALPHABET.indexOf(raw[i + 2])) << 6) | Math.max(0, ALPHABET.indexOf(raw[i + 3]));
    if (output < bytes.length) bytes[output++] = n >>> 16;
    if (output < bytes.length) bytes[output++] = (n >>> 8) & 255;
    if (output < bytes.length) bytes[output++] = n & 255;
  }
  return bytes;
}
