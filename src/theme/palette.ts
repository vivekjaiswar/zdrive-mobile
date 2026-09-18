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

// GLASS REDESIGN: these values are now aligned to the glassmorphism theme
// (see glass.ts). `background` is transparent because every screen renders
// the gradient backdrop (GradientBackground, via Screen/GlassScreen) behind
// its content; `surface`/`surfaceAlt` are translucent glass fills so the old
// components that predate the glass primitives still read correctly on the
// gradient. Prominent surfaces (cards, sheets, tab bar) additionally use a
// real BlurView for the frosted effect; these tokens are the "glass-lite"
// fallback for everything else. Same key set as before, so no component
// needs structural changes.
export const lightColors: ColorPalette = {
  primary: '#2F6BFF',
  primaryDark: '#6C4CFF',
  primarySoft: 'rgba(47,107,255,0.12)',
  secondary: '#6C4CFF',
  success: '#10B981',
  warning: '#D97706',
  danger: '#E23D3D',
  background: 'transparent',
  surface: 'rgba(255,255,255,0.72)',
  surfaceAlt: 'rgba(255,255,255,0.5)',
  text: '#111A33',
  textSecondary: '#55618A',
  border: 'rgba(120,130,165,0.20)',
  shadow: '#1A2340',
  progressBackground: 'rgba(120,130,165,0.22)',
  progressFill: '#2F6BFF',
  statusBarStyle: 'dark',
};

export const darkColors: ColorPalette = {
  primary: '#4C8DFF',
  primaryDark: '#7C6BFF',
  primarySoft: 'rgba(76,141,255,0.18)',
  secondary: '#7C6BFF',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#FF6B6B',
  background: 'transparent',
  // Translucent frosted panels over the dark gradient - opaque enough to
  // keep content legible even where there's no BlurView behind them.
  surface: 'rgba(20,28,52,0.72)',
  surfaceAlt: 'rgba(255,255,255,0.06)',
  text: '#F4F7FF',
  textSecondary: '#AEB8D4',
  border: 'rgba(255,255,255,0.14)',
  shadow: '#000000',
  progressBackground: 'rgba(255,255,255,0.14)',
  progressFill: '#4C8DFF',
  statusBarStyle: 'light',
};
