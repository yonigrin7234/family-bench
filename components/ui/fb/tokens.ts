import { StyleSheet } from 'react-native';

export const fbColors = {
  paper: '#F7F6F3',
  paperDeep: '#EFEDE7',
  paperEdge: '#E4E1D9',
  surface: '#FFFFFF',

  ink: '#14181F',
  inkSoft: '#2B323D',
  inkMute: 'rgba(20,24,31,0.58)',
  inkFaint: 'rgba(20,24,31,0.34)',

  rule: 'rgba(20,24,31,0.10)',
  ruleSoft: 'rgba(20,24,31,0.06)',

  ox: '#B44028',
  oxDeep: '#842E1C',
  oxWash: '#F4E3DE',

  sand: '#C9B892',
  sandDeep: '#8A7647',
  sandWash: '#F0EADA',

  forest: '#2F5A3A',
  forestWash: '#DEE8DD',

  amber: '#A76A14',
  amberWash: '#F3E6CE',

  urgentBg: '#0A0B0F',
  urgentFg: '#FFFFFF',
  urgentRed: '#E5484D',
} as const;

export const fbSpacing = {
  x1: 4,
  x2: 8,
  x3: 12,
  x4: 16,
  x5: 20,
  x6: 24,
  x8: 32,
  x10: 40,
} as const;

export const fbRadii = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 18,
  pill: 9999,
} as const;

export const fbFonts = {
  sansRegular: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
  serifRegular: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  monoRegular: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoSemi: 'JetBrainsMono_600SemiBold',
} as const;

export const fbWeights = {
  regular: '400',
  medium: '500',
  semi: '600',
} as const;

export const fbType = {
  display: 38,
  displaySm: 28,
  h1: 24,
  h2: 18,
  body: 14,
  small: 12,
  micro: 10.5,
  displayDesktop: 44,
  h1Desktop: 32,
  h2Desktop: 22,
} as const;

export const fbBorder = {
  hairline: StyleSheet.hairlineWidth,
  selected: 1,
  focus: 1.5,
} as const;

export const fbTouch = {
  min: 44,
  primary: 52,
  capture: 60,
  bottomNavHeight: 66,
} as const;

export const fbAlpha = {
  pressed: 0.88,
  pressedSubtle: 0.94,
  disabled: 0.45,
} as const;

export const fbMoodColors = {
  calm: '#6E9E7A',
  happy: '#C99B3E',
  quiet: '#8896A8',
  anxious: '#C99B3E',
  upset: '#B48338',
  distressed: fbColors.ox,
  angry: fbColors.oxDeep,
} as const;

export const fbLegalCopy = {
  legalInformationNotAdvice: 'This is legal information, not advice.',
} as const;

export const fb = {
  colors: fbColors,
  spacing: fbSpacing,
  radii: fbRadii,
  fonts: fbFonts,
  weights: fbWeights,
  type: fbType,
  border: fbBorder,
  touch: fbTouch,
  alpha: fbAlpha,
  moods: fbMoodColors,
  copy: fbLegalCopy,
} as const;

export type FBColorName = keyof typeof fbColors;
