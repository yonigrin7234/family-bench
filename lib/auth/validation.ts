export function normalizeEmail(value: string): string {
  const email = value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error('Enter a valid email address.');
  }
  return email;
}

export function validateNewPassword(password: string): void {
  if (password.length < 12) throw new Error('Use a password with at least 12 characters.');
  if (password.length > 128) throw new Error('Use a password with no more than 128 characters.');
}
