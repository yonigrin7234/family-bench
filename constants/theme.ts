// Design tokens from Doc 2 (Verified Design Spec)
// Source of truth: .claude/skills/family-bench.md

export const colors = {
  light: {
    page: '#F5F5F0',
    surface: '#FFFFFF',
    userBubble: '#DDD9CE',
    textPrimary: '#1A1A18',
    textMuted: '#6B6A68',
    textPlaceholder: '#9A9893',
    border: 'rgba(0,0,0,0.08)',
    accent: '#2563EB',
    accentHover: '#1D4ED8',
    accentLight: '#DBEAFE',
    accentLighter: '#EFF6FF',
    success: '#059669',
    successLight: '#ECFDF5',
    warning: '#D97706',
    warningLight: '#FFFBEB',
    danger: '#DC2626',
    dangerLight: '#FEF2F2',
  },
  dark: {
    page: '#2B2A27',
    surface: '#1F1E1B',
    surfaceHover: '#333330',
    textPrimary: '#EEEEEE',
    textMuted: '#9A9893',
    border: 'rgba(255,255,255,0.08)',
    accent: '#3B82F6',
    // Semantic colors same as light
    success: '#059669',
    successLight: '#064E3B',
    warning: '#D97706',
    warningLight: '#78350F',
    danger: '#DC2626',
    dangerLight: '#7F1D1D',
  },
} as const;

// Typography: Georgia serif for headings, system sans for body
// Max weight: 600. NEVER 700+.
export const typography = {
  display:    { size: 28, weight: '600' as const, family: 'Georgia' },
  title:      { size: 22, weight: '600' as const, family: 'Georgia' },
  heading:    { size: 18, weight: '600' as const, family: 'Georgia' },
  subheading: { size: 16, weight: '500' as const, family: 'System' },
  body:       { size: 15, weight: '400' as const, family: 'System' },
  label:      { size: 14, weight: '500' as const, family: 'System' },
  caption:    { size: 13, weight: '400' as const, family: 'System' },
  badge:      { size: 11, weight: '500' as const, family: 'System' },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const radius = {
  card: 12,
  button: 12,
  input: 12,
  modal: 16,
  badge: 6,
  full: 9999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.035,
    shadowRadius: 20,
    elevation: 2,
  },
} as const;

// Entry type badge colors
export const entryBadgeColors = {
  journal:      { bg: 'bg-accent-lighter', text: 'text-accent' },
  pickup_dropoff: { bg: 'bg-accent-lighter', text: 'text-accent' },
  incident:     { bg: 'bg-warning-light', text: 'text-warning' },
  visit_denied: { bg: 'bg-danger-light', text: 'text-danger' },
  expense:      { bg: 'bg-success-light', text: 'text-success' },
  medical:      { bg: 'bg-accent-lighter', text: 'text-accent' },
  child_statement: { bg: 'bg-warning-light', text: 'text-warning' },
  communication: { bg: 'bg-page', text: 'text-text-muted' },
  compliance:   { bg: 'bg-page', text: 'text-text-muted' },
  witness:      { bg: 'bg-page', text: 'text-text-muted' },
} as const;

// Entry type display labels
export const entryTypeLabels: Record<string, string> = {
  journal: 'Journal',
  pickup_dropoff: 'Exchange',
  visit_denied: 'Denied Visit',
  expense: 'Expense',
  medical: 'Medical',
  child_statement: 'Child Statement',
  communication: 'Communication',
  incident: 'Incident',
  compliance: 'Compliance',
  witness: 'Witness',
};
