import { sanitizeCourtFormValues } from '../forms/model';
import type { Json } from '../supabase/database.types';
import type { CaseIntelligenceSnapshot } from './types';

export type ContextIssue = { path: string; code: 'shape' | 'owner' | 'reference' | 'unsupported' };
export type PreservedWorkspaceContext = {
  id: string;
  ownerId: string;
  observedAt: string;
  source: 'local' | 'cloud' | 'switch' | 'conflict' | 'save';
  resolvedAt: string | null;
  issues: ContextIssue[];
  raw: Json;
};

export const WORKSPACE_CONTEXT_KEYS = ['selectedCaseId', 'caseWorkspaceStates', 'reportPreviewState', 'savedReportVersions', 'advisorState', 'filingBuilderState', 'patternReviewState', 'conflictHistory', 'courtFormDrafts'] as const;
export function extractWorkspaceContext(document: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(WORKSPACE_CONTEXT_KEYS.filter((key) => Object.hasOwn(document, key)).map((key) => [key, document[key]]));
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const reportTypes = ['timeline', 'flagged', 'communication', 'medical', 'custodyExchange', 'late', 'expense', 'benchBrief'];
const patternKinds = ['late_exchanges', 'denied_visits', 'flagged_incidents', 'medical_entries', 'communication_non_response', 'filing_linked_entries'];
type ObjectValue = Record<string, unknown>;

/** Checks only known context references. Case-record metadata remains untouched. */
export function inspectWorkspaceContext(value: unknown, snapshot: CaseIntelligenceSnapshot, ownerId: string): ContextIssue[] {
  const issues: ContextIssue[] = [];
  const add = (path: string, code: ContextIssue['code']) => { if (issues.length < 100) issues.push({ path, code }); };
  function object(value: unknown, path: string, keys?: readonly string[]): ObjectValue {
    if (value == null) return {};
    if (typeof value !== 'object' || Array.isArray(value)) { add(path, 'shape'); return {}; }
    const item = value as ObjectValue;
    if (keys) for (const key of Object.keys(item)) if (!keys.includes(key)) add(`${path}.${key}`, 'unsupported');
    if (item.ownerId != null && item.ownerId !== ownerId) add(`${path}.ownerId`, 'owner');
    if (item.user_id != null && item.user_id !== ownerId) add(`${path}.user_id`, 'owner');
    return item;
  }
  function array(value: unknown, path: string): unknown[] {
    if (value == null) return [];
    if (!Array.isArray(value)) { add(path, 'shape'); return []; }
    return value;
  }
  function strings(value: unknown, path: string): string[] {
    return array(value, path).filter((id, index): id is string => { if (typeof id === 'string') return true; add(`${path}[${index}]`, 'shape'); return false; });
  }
  function optionalString(value: unknown, path: string) { if (value != null && typeof value !== 'string') add(path, 'shape'); }
  const cases = new Map(snapshot.cases.filter((row) => row.user_id === ownerId).map((row) => [row.id, row]));
  function caseRef(value: unknown, path: string, live = false): string | null {
    if (value == null) return null;
    if (typeof value !== 'string' || !cases.has(value) || (live && cases.get(value)?.deleted_at)) { add(path, 'reference'); return null; }
    return value;
  }
  function ref(value: unknown, collection: 'entries' | 'children' | 'filingPackages' | 'evidenceAttachments' | 'advisorThreads', caseId: string | null, path: string) {
    if (typeof value !== 'string' || !snapshot[collection].some((row) => row.id === value && row.user_id === ownerId && (!caseId || row.case_id === caseId))) add(path, 'reference');
  }
  function refs(value: unknown, collection: Parameters<typeof ref>[1], caseId: string | null, path: string) {
    strings(value, path).forEach((id, index) => ref(id, collection, caseId, `${path}[${index}]`));
  }
  function report(value: unknown, path: string) {
    const item = object(value, path, ['reportType', 'typeFilter', 'flagFilter']);
    if (item.reportType != null && !reportTypes.includes(String(item.reportType))) add(`${path}.reportType`, 'shape');
    optionalString(item.typeFilter, `${path}.typeFilter`);
    if (item.flagFilter != null && !['all', 'flagged'].includes(String(item.flagFilter))) add(`${path}.flagFilter`, 'shape');
  }
  function context(value: unknown, caseId: string | null, path: string, root = false) {
    const item = object(value, path, root ? [...WORKSPACE_CONTEXT_KEYS, 'ownerId'] : ['reportPreviewState', 'advisorState', 'filingBuilderState', 'patternReviewState', 'ownerId']);
    report(item.reportPreviewState, `${path}.reportPreviewState`);
    const advisor = object(item.advisorState, `${path}.advisorState`, ['threadId', 'pinnedThreadId', 'messages', 'updatedAt']);
    for (const key of ['threadId', 'pinnedThreadId', 'updatedAt']) optionalString(advisor[key], `${path}.advisorState.${key}`);
    for (const key of ['threadId', 'pinnedThreadId']) if (typeof advisor[key] === 'string' && uuid.test(advisor[key])) ref(advisor[key], 'advisorThreads', caseId, `${path}.advisorState.${key}`);
    array(advisor.messages, `${path}.advisorState.messages`).forEach((value, index) => {
      const at = `${path}.advisorState.messages[${index}]`;
      const message = object(value, at, ['id', 'role', 'body', 'createdAt', 'linkedEntryIds', 'prompt', 'localOnly']);
      for (const key of ['id', 'body', 'createdAt']) if (typeof message[key] !== 'string') add(`${at}.${key}`, 'shape');
      if (!['user', 'advisor'].includes(String(message.role))) add(`${at}.role`, 'shape');
      optionalString(message.prompt, `${at}.prompt`);
      refs(message.linkedEntryIds, 'entries', caseId, `${at}.linkedEntryIds`);
    });
    const filing = object(item.filingBuilderState, `${path}.filingBuilderState`, ['selectedPackageId', 'packageStates', 'updatedAt']);
    if (filing.selectedPackageId != null) ref(filing.selectedPackageId, 'filingPackages', caseId, `${path}.filingBuilderState.selectedPackageId`);
    const packages = object(filing.packageStates, `${path}.filingBuilderState.packageStates`);
    for (const [id, value] of Object.entries(packages)) {
      const at = `${path}.filingBuilderState.packageStates.${id}`;
      const state = object(value, at, ['packageId', 'linkedEntryIds', 'linkedAttachmentIds', 'linkedReportTypes', 'checklist', 'exhibitGroups', 'updatedAt']);
      ref(id, 'filingPackages', caseId, at);
      if (state.packageId !== id) add(`${at}.packageId`, 'reference');
      const packageCase = snapshot.filingPackages.find((row) => row.id === id)?.case_id ?? caseId;
      refs(state.linkedEntryIds, 'entries', packageCase, `${at}.linkedEntryIds`);
      refs(state.linkedAttachmentIds, 'evidenceAttachments', packageCase, `${at}.linkedAttachmentIds`);
      for (const type of strings(state.linkedReportTypes, `${at}.linkedReportTypes`)) if (!reportTypes.includes(type)) add(`${at}.linkedReportTypes`, 'shape');
      object(state.checklist, `${at}.checklist`, ['forms', 'exhibits', 'declarations', 'service']);
      array(state.exhibitGroups, `${at}.exhibitGroups`).forEach((group, index) => {
        const atGroup = `${at}.exhibitGroups[${index}]`;
        const item = object(group, atGroup, ['id', 'label', 'entryIds', 'attachmentIds']);
        refs(item.entryIds, 'entries', packageCase, `${atGroup}.entryIds`);
        refs(item.attachmentIds, 'evidenceAttachments', packageCase, `${atGroup}.attachmentIds`);
      });
    }
    const patterns = object(item.patternReviewState, `${path}.patternReviewState`, ['acknowledgedPatternIds', 'dismissedPatternIds', 'updatedAt']);
    for (const key of ['acknowledgedPatternIds', 'dismissedPatternIds']) for (const id of strings(patterns[key], `${path}.patternReviewState.${key}`)) {
      const [patternCase, kind, suffix, ...rest] = id.split(':');
      const row = snapshot.patternTags.find((row) => row.id === id && row.user_id === ownerId && (!caseId || row.case_id === caseId));
      if (row) continue;
      if (!caseRef(patternCase, `${path}.patternReviewState.${key}`) || (caseId && patternCase !== caseId) || !patternKinds.includes(kind) || rest.length || (kind === 'filing_linked_entries' ? !suffix : Boolean(suffix))) add(`${path}.patternReviewState.${key}`, 'reference');
      if (suffix) ref(suffix, 'filingPackages', caseId, `${path}.patternReviewState.${key}`);
    }
  }
  const root = object(value, 'workspace');
  const selected = root.selectedCaseId == null ? snapshot.selectedCaseId ?? snapshot.cases.find((row) => row.user_id === ownerId && !row.deleted_at && row.is_active)?.id ?? snapshot.cases.find((row) => row.user_id === ownerId && !row.deleted_at)?.id ?? null : caseRef(root.selectedCaseId, 'workspace.selectedCaseId', true);
  if (snapshot.selectedCaseId) caseRef(snapshot.selectedCaseId, 'snapshot.selectedCaseId', true);
  context(value, selected, 'workspace', true);
  const caseContexts = object(root.caseWorkspaceStates, 'workspace.caseWorkspaceStates');
  for (const [id, value] of Object.entries(caseContexts)) { caseRef(id, `workspace.caseWorkspaceStates.${id}`); context(value, id, `workspace.caseWorkspaceStates.${id}`); }
  array(root.savedReportVersions, 'workspace.savedReportVersions').forEach((value, index) => {
    const path = `workspace.savedReportVersions[${index}]`;
    const version = object(value, path, ['id', 'caseId', 'reportType', 'title', 'createdAt', 'updatedAt', 'includedEntryIds', 'filters', 'linkedFilingPackageIds']);
    if (typeof version.id !== 'string' || !reportTypes.includes(String(version.reportType))) add(path, 'shape');
    for (const key of ['title', 'createdAt', 'updatedAt']) optionalString(version[key], `${path}.${key}`);
    const ids = strings(version.includedEntryIds, `${path}.includedEntryIds`);
    const inferred = ids.length ? snapshot.entries.find((row) => row.id === ids[0])?.case_id ?? null : null;
    const reportCase = version.caseId == null ? inferred : caseRef(version.caseId, `${path}.caseId`);
    refs(ids, 'entries', reportCase, `${path}.includedEntryIds`);
    refs(version.linkedFilingPackageIds, 'filingPackages', reportCase, `${path}.linkedFilingPackageIds`);
    const filters = object(version.filters, `${path}.filters`, ['typeFilter', 'flagFilter', 'childFilter', 'dateRangeLabel']);
    if (filters.childFilter != null && filters.childFilter !== 'all') ref(filters.childFilter, 'children', reportCase, `${path}.filters.childFilter`);
  });
  array(root.courtFormDrafts, 'workspace.courtFormDrafts').forEach((value, index) => {
    const path = `workspace.courtFormDrafts[${index}]`;
    const draft = object(value, path, ['id', 'userId', 'caseId', 'formId', 'values', 'sourceEntryIds', 'createdAt', 'updatedAt']);
    if (draft.userId !== ownerId) add(`${path}.userId`, 'owner');
    if (typeof draft.id !== 'string' || !uuid.test(draft.id)) add(`${path}.id`, 'shape');
    const draftCase = caseRef(draft.caseId, `${path}.caseId`);
    if (!draftCase) add(`${path}.caseId`, 'reference');
    refs(draft.sourceEntryIds, 'entries', draftCase, `${path}.sourceEntryIds`);
    try {
      if (draft.formId !== 'mc031' && draft.formId !== 'fl300') throw new Error('Unsupported form');
      const normalized = sanitizeCourtFormValues(draft.formId, draft.values);
      for (const key of Object.keys(object(draft.values, `${path}.values`))) if (!Object.hasOwn(normalized, key)) add(`${path}.values.${key}`, 'unsupported');
    } catch { add(`${path}.values`, 'shape'); }
  });
  array(root.conflictHistory, 'workspace.conflictHistory').forEach((value, index) => {
    const path = `workspace.conflictHistory[${index}]`;
    const conflict = object(value, path, ['key', 'table', 'version', 'local', 'remote', 'resolutionId', 'resolvedAt', 'choice']);
    for (const key of ['key', 'table', 'resolutionId', 'resolvedAt']) if (typeof conflict[key] !== 'string') add(`${path}.${key}`, 'shape');
    if (!conflict.local || !['device', 'cloud'].includes(String(conflict.choice))) add(path, 'shape');
    for (const side of ['local', 'remote']) {
      if (conflict[side] == null) continue;
      const row = object(conflict[side], `${path}.${side}`);
      if (row.user_id !== ownerId) add(`${path}.${side}.user_id`, 'owner');
      // Historical copies may reference records no longer in the live snapshot.
      // They are retained as private history and are never used as active context.
    }
  });
  return issues;
}

/** Remove only affected display sections; preserve the untouched original separately. */
export function safeContextInput(value: unknown, issues: ContextIssue[]): Record<string, unknown> {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? JSON.parse(JSON.stringify(value)) as Record<string, unknown> : {};
  if (issues.some((issue) => issue.code === 'owner' && (issue.path === 'workspace.ownerId' || issue.path === 'workspace.user_id'))) return {};
  const affected = (path: string) => issues.some((issue) => issue.path === path || issue.path.startsWith(`${path}.`) || issue.path.startsWith(`${path}[`));
  for (const key of ['advisorState', 'filingBuilderState', 'patternReviewState', 'reportPreviewState']) if (affected(`workspace.${key}`) || affected('workspace.selectedCaseId') || affected('snapshot.selectedCaseId')) delete source[key];
  if (affected('workspace.selectedCaseId') || affected('snapshot.selectedCaseId')) source.selectedCaseId = null;
  const contexts = source.caseWorkspaceStates;
  if (contexts && typeof contexts === 'object' && !Array.isArray(contexts)) {
    source.caseWorkspaceStates = Object.fromEntries(Object.entries(contexts).filter(([id]) => !affected(`workspace.caseWorkspaceStates.${id}`)));
  } else delete source.caseWorkspaceStates;
  for (const key of ['savedReportVersions', 'courtFormDrafts', 'conflictHistory']) {
    if (Array.isArray(source[key])) source[key] = source[key].filter((_value: unknown, index: number) => !affected(`workspace.${key}[${index}]`));
    else delete source[key];
  }
  return extractWorkspaceContext(source);
}
