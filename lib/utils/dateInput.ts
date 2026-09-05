export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function normalizeOptionalDate(value?: string | null): string | null {
  const date = value?.trim();
  if (!date) return null;
  if (!isCalendarDate(date)) throw new Error('Enter a real calendar date in YYYY-MM-DD format.');
  return date;
}

export function normalizeOptionalTime(value?: string | null): string | null {
  const time = value?.trim();
  if (!time) return null;
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time)) throw new Error('Enter a valid time in 24-hour HH:MM format.');
  return time.length === 5 ? `${time}:00` : time;
}

export function localCalendarDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
