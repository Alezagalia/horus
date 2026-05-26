/**
 * Horus Mobile — Cobalt Design Tokens
 * Fuente: design_handoff_horus_mobile_cobalt/tokens.ts
 */

export const Colors = {
  // Bases neutrales
  black: '#0A0E1F',
  deep: '#1A2547',
  ink: '#0F1530',
  muted: '#6B7796',
  line: 'rgba(31, 45, 90, 0.10)',

  // Ceil scale
  ceilLight: '#B7C7E5',
  ceil: '#7B92C9',
  ceilDark: '#4F6BB0',
  ice: '#DCE6F7',

  // Acento vivo ⚡
  vivid: '#1E6BFF',
  vividLight: '#5BA0FF',

  // Fondos
  surfaceGlass: 'rgba(255, 255, 255, 0.78)',
  surfaceSolid: '#FFFFFF',
  bgTop: '#F0F4FB',
  bgMid: '#E8EEF9',
  bgBottom: '#F4F7FC',

  // Roles semánticos
  action: '#1E6BFF',
  authority: '#0A0E1F',
  display: '#1A2547',
  text: '#0F1530',
  textMuted: '#6B7796',
  priorityHigh: '#1E6BFF',
  priorityMid: '#4F6BB0',
  priorityLow: '#7B92C9',
} as const;

export const Gradients = {
  hero: ['#0A0E1F', '#1A2547', '#4F6BB0', '#1E6BFF'] as const,
  nudge: ['#0A0E1F', '#1A2547'] as const,
  moneyHero: ['#0A0E1F', '#1A2547', '#1E6BFF'] as const,
  progressBar: ['#1A2547', '#1E6BFF', '#5BA0FF'] as const,
} as const;

export const Radius = {
  xs: 6,
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 22,
  '3xl': 24,
  pill: 999,
  nav: 32,
  fab: 26,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  screenX: 18,
  screenTop: 64,
  screenBottom: 100,
} as const;

export const Typography = {
  displayXl: { fontSize: 32, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -1 },
  displayLg: { fontSize: 28, fontWeight: '700' as const, lineHeight: 29, letterSpacing: -0.5 },
  displayMd: { fontSize: 26, fontWeight: '700' as const, lineHeight: 29, letterSpacing: -0.5 },
  displaySm: { fontSize: 22, fontWeight: '700' as const, lineHeight: 24, letterSpacing: -0.3 },
  bodyLg: { fontSize: 18, fontWeight: '700' as const, lineHeight: 22 },
  body: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  bodyStrong: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 17 },
  meta: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14 },
  metaStrong: { fontSize: 11, fontWeight: '700' as const, lineHeight: 13 },
  micro: { fontSize: 10, fontWeight: '500' as const, lineHeight: 12 },
  overline: { fontSize: 10, fontWeight: '600' as const, lineHeight: 10, letterSpacing: 0.6 },
  tabLabel: { fontSize: 10, fontWeight: '500' as const, lineHeight: 10 },
} as const;

export const Shadows = {
  card: {
    shadowColor: 'rgba(31, 45, 90, 1)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  nav: {
    shadowColor: 'rgba(31, 45, 90, 1)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  fab: {
    shadowColor: '#0A0E1F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 16,
  },
  cta: {
    shadowColor: '#1E6BFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  account: {
    shadowColor: 'rgba(31, 45, 90, 1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
} as const;

export const Motion = {
  fast: 150,
  base: 200,
  slow: 280,
} as const;

export const Layout = {
  tabBarHeight: 64,
  tabBarOffset: 22,
  tabBarSide: 14,
  fabSize: 50,
} as const;
