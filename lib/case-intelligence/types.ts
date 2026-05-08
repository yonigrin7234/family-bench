import type { Tables } from '@/lib/supabase/database.types';
import type { EntryTypeFilterValue } from './entryTypes';

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

export type CaseIntelligenceSource = 'supabase' | 'fallback' | 'local';
export type LocalSyncStatus = 'pending' | 'local_pending' | 'error' | 'synced';

export type LocalRecordMeta = {
  table: string;
  id: string;
  local_created_at: string;
  local_updated_at: string;
  sync_status: LocalSyncStatus;
  error?: string | null;
};

export type AttachmentKind = 'photo' | 'document' | 'voice_memo' | 'screenshot';

export type ReportPreviewType =
  | 'timeline'
  | 'flagged'
  | 'communication'
  | 'medical'
  | 'custodyExchange';

export type ReportPreviewFlagFilter = 'all' | 'flagged';

export type ReportPreviewState = {
  reportType: ReportPreviewType;
  typeFilter: EntryTypeFilterValue;
  flagFilter: ReportPreviewFlagFilter;
};

export type FilingPackageStatus = 'draft' | 'in_progress' | 'ready_for_review';

export type FilingChecklistKey = 'forms' | 'exhibits' | 'declarations' | 'service';

export type FilingChecklistState = Record<FilingChecklistKey, boolean>;

export type FilingPackageLocalState = {
  packageId: string;
  linkedEntryIds: string[];
  linkedAttachmentIds: string[];
  linkedReportTypes: ReportPreviewType[];
  checklist: FilingChecklistState;
  exhibitGroups: Array<{
    id: string;
    label: string;
    entryIds: string[];
    attachmentIds: string[];
  }>;
  updatedAt: string;
};

export type FilingBuilderState = {
  selectedPackageId: string | null;
  packageStates: Record<string, FilingPackageLocalState>;
  updatedAt: string | null;
};

export type AdvisorMessageRole = 'advisor' | 'user';

export type AdvisorMessage = {
  id: string;
  role: AdvisorMessageRole;
  body: string;
  createdAt: string;
  linkedEntryIds: string[];
  prompt?: string | null;
  localOnly: boolean;
};

export type AdvisorConversationState = {
  threadId: string;
  pinnedThreadId: string | null;
  messages: AdvisorMessage[];
  updatedAt: string | null;
};

export type LocalPersistenceDiagnostics = {
  active: boolean;
  adapter: 'localStorage' | 'fileSystem' | 'memory';
  hydrationCompleted: boolean;
  lastHydratedAt?: string;
  lastPersistedAt?: string;
  syncMode: 'disabled_demo' | 'local_first' | 'remote_write_enabled';
  error: string | null;
};

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
