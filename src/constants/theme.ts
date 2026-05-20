// Tesla — design tokens aligned with Tesla App.html prototype.

const BRAND = '#FF453A';
const BRAND_2 = '#FF6961';
const BRAND_DEEP = '#D93025';

// Branco gelo — ice-white + blue glow light theme
export const LightColors = {
  // legacy aliases ----------------------------------------------------------
  primary: BRAND,
  primaryLight: '#D9E8FF',     // richer blue tint for chips & selections
  primaryDark: BRAND_DEEP,
  danger: '#FF3B30',
  dangerLight: '#FFECE8',
  warning: '#FF9500',
  warningLight: '#FFF3E0',
  success: '#34C759',
  successLight: '#E5F9ED',
  info: '#339AF0',
  infoLight: '#DFF0FF',
  background: '#EEF3FF',       // branco gelo — icy cool white
  surface: '#FFFFFF',          // cards pop crisp on ice bg
  border: 'rgba(0,80,210,.10)',
  text: '#000000',
  textSecondary: 'rgba(30,50,90,.58)',
  textMuted: 'rgba(30,50,90,.32)',
  urgent: '#FF3B30',
  high: '#FF9500',
  medium: BRAND,
  low: '#34C759',

  // iOS tokens --------------------------------------------------------------
  brand: BRAND,
  brand2: BRAND_2,
  brandDeep: BRAND_DEEP,
  brandGlow: 'rgba(255,69,58,.42)',  // stronger glow vs old .35
  bg: '#EEF3FF',
  groupedBg: '#EEF3FF',
  surface2: '#F3F7FF',         // second-level surface (slight blue)
  surface3: '#E4EEFF',         // third-level (chips, selected rows)
  separator: 'rgba(0,80,210,.13)',
  separatorOp: 'rgba(0,80,210,.07)',
  label: '#000000',
  label2: 'rgba(30,50,90,.58)',
  label3: 'rgba(30,50,90,.32)',
  fill: 'rgba(255,69,58,.11)',  // blue-tinted fill
  fill2: 'rgba(255,69,58,.06)',
  tabbar: 'rgba(230,240,255,.94)',  // icy frosted-glass tabbar
  nav: 'rgba(230,240,255,.94)',
  sheetHandle: 'rgba(0,80,210,.22)',
};

export const DarkColors = {
  primary: BRAND,
  primaryLight: '#001A3A',
  primaryDark: BRAND_DEEP,
  danger: '#FF453A',
  dangerLight: '#2D0D0D',
  warning: '#FF9F0A',
  warningLight: '#2D1A00',
  success: '#30D158',
  successLight: '#0A1F0E',
  info: '#64D2FF',
  infoLight: '#081422',
  background: '#000000',
  surface: '#1C1C1E',
  border: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textMuted: '#48484A',
  urgent: '#FF453A',
  high: '#FF9F0A',
  medium: BRAND,
  low: '#30D158',

  brand: BRAND,
  brand2: BRAND_2,
  brandDeep: BRAND_DEEP,
  brandGlow: 'rgba(255,69,58,.55)',
  bg: '#000000',
  groupedBg: '#000000',
  surface2: '#2C2C2E',
  surface3: '#3A3A3C',
  separator: '#2C2C2E',
  separatorOp: 'rgba(255,255,255,.07)',
  label: '#FFFFFF',
  label2: '#8E8E93',
  label3: '#48484A',
  fill: 'rgba(255,69,58,.18)',
  fill2: 'rgba(255,69,58,.18)',
  tabbar: '#111111',
  nav: '#111111',
  sheetHandle: 'rgba(255,255,255,.25)',
};

export const Colors = LightColors;

// Priority tokens — iOS palette.
export const Priority = {
  urgent: { label: 'Urgente', color: '#FF4B41', bg: 'rgba(255,75,65,.22)',   emoji: '🔥' },
  high:   { label: 'Alta',    color: '#FFA020', bg: 'rgba(255,160,32,.22)',  emoji: '⚡' },
  medium: { label: 'Média',   color: '#FF453A', bg: 'rgba(255,69,58,.22)',   emoji: '📌' },
  low:    { label: 'Baixa',   color: '#3DD468', bg: 'rgba(61,212,104,.22)',  emoji: '🌱' },
} as const;

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

// iOS radii: list group 14, card 16, nav chip 10, full pill 999.
export const Radius = { sm: 8, md: 12, lg: 14, xl: 20, full: 9999 };

export const FontSize = { xs: 12, sm: 13, md: 15, lg: 17, xl: 22, xxl: 28, xxxl: 34 };

export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 8 },
  brand: { shadowColor: BRAND, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 30, elevation: 10 },
};
