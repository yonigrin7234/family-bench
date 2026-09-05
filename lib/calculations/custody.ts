import type { Entry } from '../case-intelligence/types';
import { recordedInstant } from '../reporting/capture';

export type CustodyCaregiver = 'me' | 'other_parent' | 'neutral';
export type CustodyBasis = 'actual' | 'scheduled';
export type CustodyInterval = { version: 1; startAt: string; endAt: string; caregiver: CustodyCaregiver; basis: CustodyBasis };

export function validateCustodyInterval(value: unknown): CustodyInterval {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('The custody interval is invalid.');
  const v = value as Record<string, unknown>;
  if (v.version !== 1 || typeof v.caregiver !== 'string' || typeof v.basis !== 'string' || !['me', 'other_parent', 'neutral'].includes(v.caregiver) || !['actual', 'scheduled'].includes(v.basis)) {
    throw new Error('Choose who had the time and whether it was scheduled or actual.');
  }
  for (const field of ['startAt', 'endAt'] as const) {
    if (typeof v[field] !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(v[field])) throw new Error('Custody times must include a recorded time zone.');
  }
  const startAt = recordedInstant(v.startAt as string, 'Custody start');
  const endAt = recordedInstant(v.endAt as string, 'Custody end');
  if (Date.parse(endAt) <= Date.parse(startAt)) throw new Error('The custody end must be after its start.');
  return { version: 1, startAt, endAt, caregiver: v.caregiver as CustodyCaregiver, basis: v.basis as CustodyBasis };
}

export function readCustodyInterval(entry: Entry): CustodyInterval | null {
  const metadata = entry.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  try { return validateCustodyInterval(metadata.custody_interval); } catch { return null; }
}

export type CustodyTimeResult = {
  basis: CustodyBasis;
  hours: Record<CustodyCaregiver, number>;
  unknownHours: number;
  conflictingHours: number;
  totalHours: number;
  coveredHours: number;
  yourRecordedShare: number | null;
  sourceEntries: Entry[];
  invalidIntervalCount: number;
};

/** Sweep explicit intervals. Duplicate intervals are unioned; contradictory caregivers stay unresolved. */
export function calculateCustodyTime(entries: Entry[], filter: {
  ownerId: string; caseId: string; childId: string | null; fromAt: string; toAt: string; basis: CustodyBasis;
}): CustodyTimeResult {
  const boundary = validateCustodyInterval({ version: 1, startAt: filter.fromAt, endAt: filter.toAt, caregiver: 'me', basis: filter.basis });
  const start = Date.parse(boundary.startAt); const end = Date.parse(boundary.endAt);
  const scoped = entries.filter((entry) => entry.user_id === filter.ownerId && entry.case_id === filter.caseId
    && entry.child_id === filter.childId && !entry.deleted_at);
  let invalidIntervalCount = 0;
  const intervals = scoped.flatMap((entry) => {
    const detail = readCustodyInterval(entry);
    if (!detail) {
      if (entry.metadata && typeof entry.metadata === 'object' && !Array.isArray(entry.metadata) && entry.metadata.custody_interval) invalidIntervalCount++;
      return [];
    }
    if (detail.basis !== filter.basis) return [];
    const from = Math.max(start, Date.parse(detail.startAt)); const to = Math.min(end, Date.parse(detail.endAt));
    return to > from ? [{ entry, from, to, caregiver: detail.caregiver }] : [];
  });
  const events = new Map<number, Array<{ caregiver: CustodyCaregiver; delta: number }>>();
  for (const interval of intervals) {
    events.set(interval.from, [...(events.get(interval.from) ?? []), { caregiver: interval.caregiver, delta: 1 }]);
    events.set(interval.to, [...(events.get(interval.to) ?? []), { caregiver: interval.caregiver, delta: -1 }]);
  }
  const boundaries = [...new Set([start, end, ...events.keys()])].sort((a, b) => a - b);
  const active: Record<CustodyCaregiver, number> = { me: 0, other_parent: 0, neutral: 0 };
  const hours: Record<CustodyCaregiver, number> = { me: 0, other_parent: 0, neutral: 0 };
  let unknownHours = 0; let conflictingHours = 0;
  for (let i = 0; i < boundaries.length - 1; i++) {
    const at = boundaries[i];
    for (const change of events.get(at) ?? []) active[change.caregiver] += change.delta;
    const elapsed = (boundaries[i + 1] - at) / 3_600_000;
    const caregivers = (Object.keys(active) as CustodyCaregiver[]).filter((caregiver) => active[caregiver] > 0);
    if (!caregivers.length) unknownHours += elapsed;
    else if (caregivers.length > 1) conflictingHours += elapsed;
    else hours[caregivers[0]] += elapsed;
  }
  const coveredHours = hours.me + hours.other_parent + hours.neutral;
  return { basis: filter.basis, hours, unknownHours, conflictingHours, totalHours: (end - start) / 3_600_000,
    coveredHours, yourRecordedShare: coveredHours > 0 ? hours.me / coveredHours * 100 : null,
    sourceEntries: intervals.map((row) => row.entry).sort((a, b) => (readCustodyInterval(a)?.startAt ?? '').localeCompare(readCustodyInterval(b)?.startAt ?? '')),
    invalidIntervalCount };
}
