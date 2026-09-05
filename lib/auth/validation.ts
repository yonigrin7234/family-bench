export function normalizeEmail(value: string): string {
  const email = value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error('Enter a valid email address.');
  }
  return email;
}

export const NEW_PASSWORD_HELP = 'Use at least 12 characters, up to 72 UTF-8 bytes. Emoji and some letters use more than one byte.';

export function validateNewPassword(password: string): void {
  if (password.length < 12) throw new Error('Use a password with at least 12 characters.');
  if (new TextEncoder().encode(password).byteLength > 72) {
    throw new Error('This password is too long. Use 72 UTF-8 bytes or fewer; emoji and some letters use more than one byte.');
  }
}
