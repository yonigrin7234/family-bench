import type { IconName } from '@/components/ui/fb';

export type SurfaceId = 'mobile' | 'desktop';
export type SurfaceComplexity = 'low' | 'medium' | 'high';

/**
 * Feature-level surface classification. Mirrors the taxonomy in
 * `docs/feature-surface-split.md` so every route can declare which
 * surface should "feature" it without consumers re-deriving the answer.
 *
 * - `mobile-only`: the feature can only meaningfully exist on a phone
 *   (camera, panic button, watch). Never appears on desktop.
 * - `mobile-primary`: designed and optimized for phone. Desktop may
 *   surface a read-only summary or admin control.
 * - `shared`: equal weight on both surfaces. Same store, same logic,
 *   density may differ.
 * - `desktop-primary`: designed for the war-room context. Phone may
 *   surface a summary, but the work happens on desktop.
 * - `desktop-only`: requires desktop affordances (multi-doc editing,
 *   browser extension, print binders). Never appears on mobile.
 */
export type SurfaceClass =
  | 'mobile-only'
  | 'mobile-primary'
  | 'shared'
  | 'desktop-primary'
  | 'desktop-only';

export const SURFACE_CLASS_VALUES: readonly SurfaceClass[] = [
  'mobile-only',
  'mobile-primary',
  'shared',
  'desktop-primary',
  'desktop-only',
] as const;

/**
 * Section IDs from `docs/family-bench-complete-feature-list.md`.
 * Used by `primaryFeatureSections` on each route so a route can declare
 * which sections of the master feature list it surfaces.
 */
export type FeatureSectionId = number;

export type SurfaceRouteId =
  | 'home'
  | 'capture'
  | 'voiceCapture'
  | 'timeline'
  | 'evidence'
  | 'entryDetail'
  | 'caseMap'
  | 'reports'
  | 'calculator'
  | 'advisor'
  | 'filings'
  | 'forms'
  | 'import'
  | 'patterns'
  | 'onboarding'
  | 'exportPrep'
  | 'practitioners'
  | 'safety'
  | 'cases'
  | 'more'
  | 'trustCenter'
  | 'briefcase'
  | 'settings';

export type SurfaceRouteDefinition = {
  id: SurfaceRouteId;
  path: string;
  label: string;
  icon: IconName;
  /** Which surface "owns" this route at the feature level. See `SurfaceClass`. */
  surfaceClass: SurfaceClass;
  /**
   * Section numbers from `docs/family-bench-complete-feature-list.md`
   * that this route primarily surfaces. A route can pull in features
   * from other sections too, but these are the canonical ones.
   */
  primaryFeatureSections: readonly FeatureSectionId[];
  mobileRole: string;
  desktopRole: string;
  mobileComplexity: SurfaceComplexity;
  desktopComplexity: SurfaceComplexity;
  mobileBehavior: readonly string[];
  desktopBehavior: readonly string[];
  appearsInMobileNav: boolean;
  appearsInDesktopNav: boolean;
  mobileNavOrder?: number;
  desktopNavOrder?: number;
  mobileActivePathPrefixes?: readonly string[];
  desktopActivePathPrefixes?: readonly string[];
  futureNotes: readonly string[];
};

export const SURFACE_ROUTES: readonly SurfaceRouteDefinition[] = [
  {
    id: 'home',
    path: '/',
    label: 'Home',
    icon: 'home',
    surfaceClass: 'shared',
    primaryFeatureSections: [27],
    mobileRole: 'Quick case status and capture entry point.',
    desktopRole: 'Case overview for the broader work session.',
    mobileComplexity: 'low',
    desktopComplexity: 'medium',
    mobileBehavior: ['Summarize current case, recent entries, and next steps in a compact flow.'],
    desktopBehavior: ['Use the shared shell and sidebar as the opening case workspace.'],
    appearsInMobileNav: true,
    appearsInDesktopNav: true,
    mobileNavOrder: 10,
    desktopNavOrder: 10,
    futureNotes: ['Can become the adaptive command center without forking store logic.'],
  },
  {
    id: 'capture',
    path: '/capture',
    label: 'Capture',
    icon: 'plus',
    surfaceClass: 'mobile-primary',
    primaryFeatureSections: [3, 4, 6],
    mobileRole: 'Primary in-the-moment entry capture.',
    desktopRole: 'Manual entry creation during review or preparation work.',
    mobileComplexity: 'medium',
    desktopComplexity: 'medium',
    mobileBehavior: ['Keep form controls stacked, reachable, and optimized for one-handed capture.'],
    desktopBehavior: ['Keep the same data flow while fitting the wider shell.'],
    appearsInMobileNav: true,
    appearsInDesktopNav: true,
    mobileNavOrder: 20,
    desktopNavOrder: 20,
    mobileActivePathPrefixes: ['/voice-capture'],
    futureNotes: ['Future capture modes should remain source-first and local-first.'],
  },
  {
    id: 'voiceCapture',
    path: '/voice-capture',
    label: 'Voice Capture',
    icon: 'mic',
    surfaceClass: 'mobile-primary',
    primaryFeatureSections: [5],
    mobileRole: 'Hands-light transcript and voice memo placeholder flow.',
    desktopRole: 'Voice capture review surface for typed transcripts and saved audio metadata.',
    mobileComplexity: 'medium',
    desktopComplexity: 'medium',
    mobileBehavior: ['Keep recorder, manual transcript, and accept/reject controls in a single stacked flow.'],
    desktopBehavior: ['Use the same voice draft state in the desktop shell without adding transcription services.'],
    appearsInMobileNav: false,
    appearsInDesktopNav: true,
    desktopNavOrder: 30,
    futureNotes: ['Real transcription, AI interpretation, and uploads remain future work.'],
  },
  {
    id: 'timeline',
    path: '/timeline',
    label: 'Timeline',
    icon: 'clock',
    surfaceClass: 'shared',
    primaryFeatureSections: [9, 10],
    mobileRole: 'Quick chronological review.',
    desktopRole: 'Dense chronological case review with filters and source counts.',
    mobileComplexity: 'medium',
    desktopComplexity: 'high',
    mobileBehavior: ['Use card-based entries with simple filters.'],
    desktopBehavior: ['Use persistent filters beside the entry list and a context rail when viewport width allows.'],
    appearsInMobileNav: true,
    appearsInDesktopNav: true,
    mobileNavOrder: 30,
    desktopNavOrder: 40,
    futureNotes: ['Can support denser grouping and saved views later.'],
  },
  {
    id: 'evidence',
    path: '/evidence',
    label: 'Evidence',
    icon: 'folder',
    surfaceClass: 'shared',
    primaryFeatureSections: [8, 9],
    mobileRole: 'Evidence browsing and attachment-count visibility.',
    desktopRole: 'Searchable evidence workspace for entries, attachments, and voice memos.',
    mobileComplexity: 'medium',
    desktopComplexity: 'high',
    mobileBehavior: ['Keep filters and result cards stacked for touch scanning.'],
    desktopBehavior: ['Keep search and filters visible beside a wider evidence result column.'],
    appearsInMobileNav: true,
    appearsInDesktopNav: true,
    mobileNavOrder: 40,
    desktopNavOrder: 50,
    futureNotes: ['OCR and AI search are future capabilities and should not change provenance rules.'],
  },
  {
    id: 'entryDetail',
    path: '/entry/[id]',
    label: 'Entry Detail',
    icon: 'doc',
    surfaceClass: 'shared',
    primaryFeatureSections: [7],
    mobileRole: 'Focused review, notes, summaries, and local source attachments.',
    desktopRole: 'Source-record inspection from timeline, evidence, reports, filings, or patterns.',
    mobileComplexity: 'medium',
    desktopComplexity: 'high',
    mobileBehavior: ['Keep review actions and attachment metadata in a single entry-focused stack.'],
    desktopBehavior: ['Use shared entry data and route context without becoming a separate desktop-only editor.'],
    appearsInMobileNav: false,
    appearsInDesktopNav: false,
    futureNotes: ['Future exhibit linkage should reuse entry IDs and attachment metadata.'],
  },
  {
    id: 'caseMap',
    path: '/case-map',
    label: 'Case Map',
    icon: 'scales',
    surfaceClass: 'desktop-primary',
    primaryFeatureSections: [2, 18, 19, 20],
    mobileRole: 'Basic case details and setup edit access.',
    desktopRole: 'Structured case map for parties, children, key dates, orders, and filing packages.',
    mobileComplexity: 'medium',
    desktopComplexity: 'high',
    mobileBehavior: ['Keep case sections stacked and easy to scan.'],
    desktopBehavior: ['Use two-column organization with a case context rail where available.'],
    appearsInMobileNav: false,
    appearsInDesktopNav: true,
    mobileNavOrder: 60,
    desktopNavOrder: 60,
    futureNotes: ['Document intake and order extraction should feed this route through shared data.'],
  },
  {
    id: 'reports',
    path: '/reports',
    label: 'Reports',
    icon: 'doc',
    surfaceClass: 'desktop-primary',
    primaryFeatureSections: [13, 14, 15],
    mobileRole: 'Preview factual report groupings from local entries.',
    desktopRole: 'Report preparation workspace with filters, preview, and source references.',
    mobileComplexity: 'medium',
    desktopComplexity: 'high',
    mobileBehavior: ['Keep report type, filters, and preview stacked.'],
    desktopBehavior: ['Keep report filters beside the preview and summarize active report context.'],
    appearsInMobileNav: false,
    appearsInDesktopNav: true,
    mobileNavOrder: 50,
    desktopNavOrder: 70,
    futureNotes: ['Final PDF export and filing insertion remain later phases.'],
  },
  {
    id: 'calculator',
    path: '/calculator',
    label: 'Custody calculator',
    icon: 'scales',
    surfaceClass: 'mobile-primary',
    primaryFeatureSections: [14, 15],
    mobileRole: 'Custody time-share breakdown from logged entries.',
    desktopRole: 'Custody analytics with breakdown and transition list.',
    mobileComplexity: 'medium',
    desktopComplexity: 'medium',
    mobileBehavior: ['Period segment + big-number breakdown + bar + legend stack.'],
    desktopBehavior: ['Same flow inside the shared desktop shell with wider columns.'],
    appearsInMobileNav: false,
    appearsInDesktopNav: true,
    desktopNavOrder: 75,
    futureNotes: [
      'Scheduled-vs-actual comparison waits for the custody-schedule data model.',
    ],
  },
  {
    id: 'advisor',
    path: '/advisor',
    label: 'Advisor',
    icon: 'chat',
    surfaceClass: 'shared',
    primaryFeatureSections: [16, 17],
    mobileRole: 'Quick legal-information-not-advice guidance placeholder.',
    desktopRole: 'Case companion thread placeholder with broader case context.',
    mobileComplexity: 'medium',
    desktopComplexity: 'medium',
    mobileBehavior: ['Keep suggested prompts and message input simple and restrained.'],
    desktopBehavior: ['Use the same placeholder conversation state inside the case workspace.'],
    appearsInMobileNav: false,
    appearsInDesktopNav: true,
    desktopNavOrder: 80,
    futureNotes: ['Real AI must be grounded, cautious, and added in a later PR.'],
  },
  {
    id: 'filings',
    path: '/filings',
    label: 'Filings',
    icon: 'folder',
    surfaceClass: 'desktop-primary',
    primaryFeatureSections: [11, 12, 23, 24],
    mobileRole: 'Limited filing-package visibility and simple linking when needed.',
    desktopRole: 'Primary filing-package organization workspace.',
    mobileComplexity: 'high',
    desktopComplexity: 'high',
    mobileBehavior: ['Keep the package list and detail sections stacked without dense side-by-side work.'],
    desktopBehavior: ['Use list/detail columns for package creation, selection, checklist, and source linking.'],
    appearsInMobileNav: false,
    appearsInDesktopNav: true,
    desktopNavOrder: 90,
    futureNotes: ['AI drafting, final PDFs, and e-filing remain future work.'],
  },
  {
    id: 'patterns',
    path: '/patterns',
    label: 'Patterns',
    icon: 'filter',
    surfaceClass: 'desktop-primary',
    primaryFeatureSections: [26],
    mobileRole: 'Review possible local patterns when prompted.',
    desktopRole: 'Rule-based pattern review and acknowledgement workspace.',
    mobileComplexity: 'medium',
    desktopComplexity: 'high',
    mobileBehavior: ['Keep stats, context, and possible pattern cards stacked.'],
    desktopBehavior: ['Use context and pattern columns for denser review while keeping neutral language.'],
    appearsInMobileNav: false,
    appearsInDesktopNav: true,
    desktopNavOrder: 100,
    futureNotes: ['Pattern detection must stay factual and avoid legal conclusions.'],
  },
  {
    id: 'onboarding',
    path: '/onboarding',
    label: 'Onboarding',
    icon: 'scales',
    surfaceClass: 'shared',
    primaryFeatureSections: [1, 2],
    mobileRole: 'First-run local case setup and quick case edits.',
    desktopRole: 'Local case setup and basic case details editing.',
    mobileComplexity: 'medium',
    desktopComplexity: 'medium',
    mobileBehavior: ['Keep setup fields stacked and touch-friendly.'],
    desktopBehavior: ['Use the shared setup route inside the desktop shell when reached from Case Map.'],
    appearsInMobileNav: false,
    appearsInDesktopNav: false,
    futureNotes: ['Account onboarding can be layered later without replacing local case setup.'],
  },
  {
    id: 'exportPrep',
    path: '/export-prep',
    label: 'Export Prep',
    icon: 'doc',
    surfaceClass: 'shared',
    primaryFeatureSections: [34],
    mobileRole: 'Preview local export structures when reached from entries, reports, or settings.',
    desktopRole: 'Inspect local JSON preview structures before export tooling exists.',
    mobileComplexity: 'medium',
    desktopComplexity: 'medium',
    mobileBehavior: ['Keep entry, case, and report export previews stacked.'],
    desktopBehavior: ['Show preview controls and JSON structures in the shared shell.'],
    appearsInMobileNav: false,
    appearsInDesktopNav: false,
    futureNotes: ['Actual downloads, print output, and PDFs remain future work.'],
  },
  {
    id: 'practitioners',
    path: '/practitioners',
    label: 'Practitioners',
    icon: 'chat',
    surfaceClass: 'desktop-primary',
    primaryFeatureSections: [25, 46],
    mobileRole: 'Review local sharing placeholders when needed.',
    desktopRole: 'Plan practitioner access scopes without granting remote permissions.',
    mobileComplexity: 'medium',
    desktopComplexity: 'medium',
    mobileBehavior: ['Keep invite placeholders and access notes stacked.'],
    desktopBehavior: ['Use side-by-side placeholder invite, scope, list, and audit sections.'],
    appearsInMobileNav: false,
    appearsInDesktopNav: true,
    desktopNavOrder: 110,
    futureNotes: ['Real invites, permissions, and practitioner comments require a later backend pass.'],
  },
  {
    id: 'safety',
    path: '/safety',
    label: 'Safety',
    icon: 'shield',
    surfaceClass: 'shared',
    primaryFeatureSections: [31],
    mobileRole: 'Read calm safety placeholders and reminders.',
    desktopRole: 'Review safety-resource and preservation placeholders in the case workspace.',
    mobileComplexity: 'low',
    desktopComplexity: 'medium',
    mobileBehavior: ['Keep resource placeholders and coming-later notes stacked.'],
    desktopBehavior: ['Show safety placeholders and evidence preservation copy in wider panels.'],
    appearsInMobileNav: false,
    appearsInDesktopNav: true,
    desktopNavOrder: 120,
    futureNotes: ['Panic, stealth, emergency notification, and backup automations remain future work.'],
  },
  {
    id: 'settings',
    path: '/settings',
    label: 'Settings',
    icon: 'folder',
    surfaceClass: 'shared',
    primaryFeatureSections: [30, 36, 39, 51],
    mobileRole: 'Review local data status and memory counts when needed.',
    desktopRole: 'Inspect local persistence, memory index, and reset/export placeholders.',
    mobileComplexity: 'medium',
    desktopComplexity: 'medium',
    mobileBehavior: ['Keep status, memory index, and reset confirmation stacked.'],
    desktopBehavior: ['Use wider status cards and memory index rows in the shared shell.'],
    appearsInMobileNav: false,
    appearsInDesktopNav: true,
    desktopNavOrder: 130,
    futureNotes: ['Full privacy controls, account deletion, and billing settings remain future work.'],
  },
  {
    id: 'cases', path: '/cases', label: 'Cases', icon: 'scales',
    surfaceClass: 'shared', primaryFeatureSections: [2, 40],
    mobileRole: 'Choose or create a case.', desktopRole: 'Choose or create a case.',
    mobileComplexity: 'low', desktopComplexity: 'low',
    mobileBehavior: ['Select a saved case before working with its records.'],
    desktopBehavior: ['Switch case context without mixing records or selections.'],
    appearsInMobileNav: false, appearsInDesktopNav: true, desktopNavOrder: 5, futureNotes: [],
  },
  {
    id: 'briefcase', path: '/briefcase', label: 'Briefcase', icon: 'folder',
    surfaceClass: 'shared', primaryFeatureSections: [8, 19, 20, 35],
    mobileRole: 'Find hearing records and selected orders.', desktopRole: 'Prepare hearing records and verify selected originals.',
    mobileComplexity: 'medium', desktopComplexity: 'medium',
    mobileBehavior: ['Keep hearing, order and record retrieval together.'],
    desktopBehavior: ['Review hearing records and send selected entries to factual export.'],
    appearsInMobileNav: false, appearsInDesktopNav: true, desktopNavOrder: 65,
    futureNotes: ['A successful file check does not guarantee offline app or account availability.'],
  },
  {
    id: 'trustCenter', path: '/trust-center', label: 'Trust Center', icon: 'shield',
    surfaceClass: 'shared', primaryFeatureSections: [7, 30, 34],
    mobileRole: 'Understand account and evidence controls.', desktopRole: 'Review account, evidence and sharing controls.',
    mobileComplexity: 'low', desktopComplexity: 'medium',
    mobileBehavior: ['Use factual product guarantees and visible checks.'],
    desktopBehavior: ['Review source-file integrity and open related data controls.'],
    appearsInMobileNav: false, appearsInDesktopNav: true, desktopNavOrder: 125, futureNotes: [],
  },
  {
    id: 'forms', path: '/forms', label: 'Court forms', icon: 'doc',
    surfaceClass: 'shared', primaryFeatureSections: [12],
    mobileRole: 'Review and save guided court-form drafts.', desktopRole: 'Prepare and download reviewed, unsigned official forms.',
    mobileComplexity: 'high', desktopComplexity: 'high',
    mobileBehavior: ['Keep draft fields stacked and preserve all entered text.'],
    desktopBehavior: ['Provide guided official templates with source versions and explicit supported sections.'],
    appearsInMobileNav: false, appearsInDesktopNav: true, desktopNavOrder: 96, futureNotes: ['Additional jurisdictions, signatures and e-filing require separate integrations.'],
  },
  {
    id: 'import', path: '/import', label: 'Import records', icon: 'folder',
    surfaceClass: 'shared', primaryFeatureSections: [4, 22],
    mobileRole: 'Review records from a selected CSV file.', desktopRole: 'Preserve a source CSV and review its records before importing.',
    mobileComplexity: 'medium', desktopComplexity: 'medium',
    mobileBehavior: ['Pick one file, confirm case and child, and review validation before saving.'],
    desktopBehavior: ['Show validated rows, exact duplicate counts, and recoverable import progress.'],
    appearsInMobileNav: false, appearsInDesktopNav: true, desktopNavOrder: 55, futureNotes: ['Provider-specific formats and account connections are separate integrations.'],
  },
  {
    id: 'more', path: '/more', label: 'More', icon: 'grip',
    surfaceClass: 'shared', primaryFeatureSections: [27, 30],
    mobileRole: 'Reach every secondary workspace and account control.', desktopRole: 'Browse workspace destinations.',
    mobileComplexity: 'low', desktopComplexity: 'low',
    mobileBehavior: ['Keep the primary tab bar at five destinations without hiding other workspaces.'],
    desktopBehavior: ['Use the same route inventory as the sidebar.'],
    appearsInMobileNav: true, appearsInDesktopNav: false, mobileNavOrder: 50,
    mobileActivePathPrefixes: ['/welcome', '/cases', '/onboarding', '/case-map', '/reports', '/calculator', '/briefcase', '/trust-center', '/export-prep', '/advisor', '/filings', '/forms', '/import', '/patterns', '/practitioners', '/safety', '/settings'],
    futureNotes: [],
  },
] as const;

export type SurfaceRoute = SurfaceRouteDefinition;
export type SurfaceNavRoute = SurfaceRoute & {
  mobileNavOrder?: number;
  desktopNavOrder?: number;
};

export function getSurfaceRoute(routeId: SurfaceRouteId) {
  return SURFACE_ROUTES.find((route) => route.id === routeId);
}

export function getSurfaceNavRoutes(surface: SurfaceId): SurfaceNavRoute[] {
  const isMobile = surface === 'mobile';
  const navKey = isMobile ? 'appearsInMobileNav' : 'appearsInDesktopNav';
  const orderKey = isMobile ? 'mobileNavOrder' : 'desktopNavOrder';

  return SURFACE_ROUTES.filter((route) => route[navKey])
    .slice()
    .sort((left, right) => (left[orderKey] ?? 999) - (right[orderKey] ?? 999));
}

export function isSurfaceRouteActive(pathname: string, route: SurfaceRoute, surface: SurfaceId) {
  if (route.path === '/') return pathname === '/';
  if (pathname === route.path || pathname.startsWith(`${route.path}/`)) return true;

  const activePrefixes =
    surface === 'mobile' ? route.mobileActivePathPrefixes : route.desktopActivePathPrefixes;

  return Boolean(activePrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(prefix)));
}

/**
 * All routes whose `surfaceClass` matches the given class.
 * Useful for answering "which routes are mobile-primary?" without
 * iterating manually.
 */
export function getRoutesByClass(surfaceClass: SurfaceClass): SurfaceRoute[] {
  return SURFACE_ROUTES.filter((route) => route.surfaceClass === surfaceClass);
}

/**
 * All routes that declare the given feature section as a primary
 * concern. Section numbers reference
 * `docs/family-bench-complete-feature-list.md`.
 */
export function getRoutesByFeatureSection(sectionId: FeatureSectionId): SurfaceRoute[] {
  return SURFACE_ROUTES.filter((route) =>
    route.primaryFeatureSections.includes(sectionId),
  );
}

/**
 * Should this route be visible/featured on the given surface based on
 * its surface class? Independent of `appearsInMobileNav` /
 * `appearsInDesktopNav` (those still govern nav menus). Use this when
 * answering product questions like "should we surface filings on
 * mobile?" (no — desktop-primary) versus nav-rendering questions.
 */
export function isRouteFeaturedOnSurface(
  route: Pick<SurfaceRouteDefinition, 'surfaceClass'>,
  surface: SurfaceId,
): boolean {
  switch (route.surfaceClass) {
    case 'mobile-only':
      return surface === 'mobile';
    case 'desktop-only':
      return surface === 'desktop';
    case 'mobile-primary':
    case 'desktop-primary':
    case 'shared':
      return true;
  }
}
