import { useColorScheme } from 'react-native';

// Glassmorphism design tokens - the visual language for the redesign.
// Deliberately a separate layer from palette.ts (the old flat theme):
// glass surfaces are translucent and sit over a gradient backdrop, so
// they need blur tint/intensity + rgba fills the flat palette never had.
// Dark is the hero (frosted glass reads best over a dark gradient); light
// is a soft, airy variant.
export interface GlassTheme {
  scheme: 'light' | 'dark';
  // Full-screen background gradient stops (top -> bottom).
  gradient: readonly [string, string, ...string[]];
  // Two decorative blurred colour orbs for depth behind the glass.
  orbA: string;
  orbB: string;
  // BlurView config.
  blurTint: 'light' | 'dark' | 'default';
  blurIntensity: number;
  // Translucent overlay painted on top of the blur to give the glass its
  // body + a faint border/highlight for the frosted edge.
  glassFill: string;
  glassFillStrong: string; // for dense content panels (more opaque = legible)
  glassBorder: string;
  glassHighlight: string;
  // Brand + content colours.
  accent: string;
  accentGradient: readonly [string, string];
  accentSoft: string;
  onAccent: string;
  text: string;
  textSecondary: string;
  textFaint: string;
  danger: string;
  success: string;
  warning: string;
  shadow: string;
  statusBarStyle: 'light' | 'dark';
}

const dark: GlassTheme = {
  scheme: 'dark',
  gradient: ['#0A1026', '#0E1B3E', '#151038'],
  orbA: 'rgba(59,130,246,0.45)',
  orbB: 'rgba(139,92,246,0.38)',
  blurTint: 'dark',
  blurIntensity: 52,
  glassFill: 'rgba(255,255,255,0.07)',
  glassFillStrong: 'rgba(20,28,52,0.66)',
  glassBorder: 'rgba(255,255,255,0.14)',
  glassHighlight: 'rgba(255,255,255,0.22)',
  accent: '#4C8DFF',
  accentGradient: ['#4C8DFF', '#7C6BFF'],
  accentSoft: 'rgba(76,141,255,0.18)',
  onAccent: '#FFFFFF',
  text: '#F4F7FF',
  textSecondary: '#AEB8D4',
  textFaint: '#7C86A3',
  danger: '#FF6B6B',
  success: '#34D399',
  warning: '#FBBF24',
  shadow: '#000000',
  statusBarStyle: 'light',
};

const light: GlassTheme = {
  scheme: 'light',
  // Richer, more saturated blue->lavender so the pale washed-out look is
  // gone and white cards visibly lift off the backdrop.
  gradient: ['#CFE0FF', '#DAD2FF', '#E9F0FF'],
  orbA: 'rgba(76,141,255,0.45)',
  orbB: 'rgba(139,92,246,0.38)',
  blurTint: 'light',
  blurIntensity: 44,
  // Clean, near-opaque white cards - crisper than translucent glass on a
  // light backdrop (translucent-white-on-light just reads as muddy/cheap).
  glassFill: 'rgba(255,255,255,0.78)',
  glassFillStrong: 'rgba(255,255,255,0.92)',
  glassBorder: 'rgba(120,130,165,0.22)',
  glassHighlight: 'rgba(255,255,255,0.95)',
  accent: '#2F6BFF',
  accentGradient: ['#2F6BFF', '#6C4CFF'],
  accentSoft: 'rgba(47,107,255,0.12)',
  onAccent: '#FFFFFF',
  text: '#111A33',
  textSecondary: '#55618A',
  textFaint: '#8A93B2',
  danger: '#E23D3D',
  success: '#10B981',
  warning: '#D97706',
  shadow: '#1A2340',
  statusBarStyle: 'dark',
};

export function useGlass(): GlassTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

export { dark as darkGlass, light as lightGlass };
