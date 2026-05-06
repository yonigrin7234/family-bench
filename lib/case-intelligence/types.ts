import type { Tables } from '@/lib/supabase/database.types';

export type FamilyBenchCase = Tables<'cases'>;
export type Child = Tables<'children'>;
export type Person = Tables<'people'>;
export type Entry = Tables<'entries'>;

// Current Supabase/PowerSync table name is `attachments`; the domain name is evidence attachment.
export type EvidenceAttachment = Tables<'attachments'>;

export type CourtOrder = Tables<'court_orders'>;
export type CourtOrderProvision = Tables<'court_order_provisions'>;
export type FilingPackage = Tables<'filing_packages'>;
export type KeyDate = Tables<'key_dates'>;
export type PatternTag = Tables<'pattern_tags'>;
export type AIOutput = Tables<'ai_outputs'>;
export type AdvisorThread = Tables<'advisor_threads'>;

export type CaseIntelligenceSource = 'supabase' | 'fallback';

export type CaseIntelligenceSnapshot = {
  cases: FamilyBenchCase[];
  children: Child[];
  people: Person[];
  entries: Entry[];
  evidenceAttachments: EvidenceAttachment[];
  courtOrders: CourtOrder[];
  courtOrderProvisions: CourtOrderProvision[];
  filingPackages: FilingPackage[];
  keyDates: KeyDate[];
  patternTags: PatternTag[];
  aiOutputs: AIOutput[];
  advisorThreads: AdvisorThread[];
};

export type NextStep = {
  title: string;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
  dueLabel?: string;
  completionPercent?: number;
  relatedFilingPackageId?: string;
  relatedKeyDateId?: string;
};

export type HomeCaseIntelligence = {
  source: CaseIntelligenceSource;
  activeCase: FamilyBenchCase | null;
  primaryPerson: Person | null;
  upcomingKeyDates: KeyDate[];
  recentEntries: Entry[];
  flaggedEntries: Entry[];
  patterns: PatternTag[];
  nextStep: NextStep;
};
