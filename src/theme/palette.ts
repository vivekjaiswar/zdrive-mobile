// Refined-blue direction: #2563EB stays the brand anchor, but
// backgrounds/borders/shadows move from the old blue-tinted values
// (#F4F8FF, #DCE8F8, #B8D2FF) to neutral slate tones - that's what
// actually reads as "premium" rather than "default Tailwind blue
// starter template." Both palettes share the same key set so any
// component can swap between them with zero structural change.
export interface ColorPalette {
  primary: string;
  primaryDark: string;
  // Soft tint for icon circles/chips/badges - replaces the scattered
  // hardcoded '#EEF5FF' literals that were copy-pasted across
  // components with no single source of truth.
  primarySoft: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  background: string;
  surface: string;
  // A step above `surface` for nested/secondary panels (e.g. a chip
  // inside a card) - previously improvised per-component.
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  border: string;
  // Shadow color for elevated cards. Neutral dark, not brand-colored -
  // colored shadows (the old '#2563EB'/'#B8D2FF') read as a bit dated;
  // a neutral shadow with low opacity is what most modern native apps
  // actually use for "premium" elevation.
  shadow: string;
  progressBackground: string;
  progressFill: string;
  // For expo-status-bar's `style` prop.
  statusBarStyle: 'dark' | 'light';
}

export const lightColors: ColorPalette = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primarySoft: '#EEF4FF',
  secondary: '#3B82F6',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  shadow: '#0F172A',
  progressBackground: '#E7EDF5',
  progressFill: '#2563EB',
  statusBarStyle: 'dark',
};

export const darkColors: ColorPalette = {
  primary: '#3B82F6',
  primaryDark: '#60A5FA',
  primarySoft: 'rgba(59, 130, 246, 0.16)',
  secondary: '#60A5FA',
  success: '#22C55E',
  warning: '#FBBF24',
  danger: '#F87171',
  // Same near-black navy already used for the image-preview backdrop
  // (ZoomableImage's '#0B1120') - intentional continuity rather than
  // a second, different "dark" invented from scratch.
  background: '#0B1120',
  surface: '#161F30',
  surfaceAlt: '#1E293B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#25324A',
  shadow: '#000000',
  progressBackground: '#25324A',
  progressFill: '#3B82F6',
  statusBarStyle: 'light',
};
