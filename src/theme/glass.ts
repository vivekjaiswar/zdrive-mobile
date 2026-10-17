import { useColorScheme } from 'react-native';

export interface GlassTheme {
  scheme: 'light' | 'dark';
  gradient: readonly [string, string, ...string[]];
  orbA: string;
  orbB: string;
  orbC: string;
  blurTint: 'light' | 'dark' | 'default';
  blurIntensity: number;
  glassFill: string;
  glassFillStrong: string;
  glassBorder: string;
  glassHighlight: string;
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
  gradient: ['#120803', '#1A0C06', '#251208'],
  orbA: 'rgba(255, 106, 0, 0.35)',
  orbB: 'rgba(216, 86, 4, 0.28)',
  orbC: 'rgba(196, 32, 0, 0.22)',
  blurTint: 'dark',
  blurIntensity: 65,
  glassFill: 'rgba(255, 255, 255, 0.06)',
  glassFillStrong: 'rgba(32, 16, 8, 0.76)',
  glassBorder: 'rgba(255, 120, 40, 0.18)',
  glassHighlight: 'rgba(255, 255, 255, 0.25)',
  accent: '#FF6A00',
  accentGradient: ['#FF6A00', '#D85604'],
  accentSoft: 'rgba(255, 106, 0, 0.22)',
  onAccent: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#CBB8AC',
  textFaint: '#8D776C',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  shadow: 'rgba(0, 0, 0, 0.55)',
  statusBarStyle: 'light',
};

const light: GlassTheme = {
  scheme: 'light',
  gradient: ['#FAF7F5', '#F5EDE8', '#EFE4DC'],
  orbA: 'rgba(255, 106, 0, 0.24)',
  orbB: 'rgba(255, 140, 50, 0.20)',
  orbC: 'rgba(255, 214, 186, 0.40)',
  blurTint: 'light',
  blurIntensity: 55,
  glassFill: 'rgba(255, 255, 255, 0.65)',
  glassFillStrong: 'rgba(255, 255, 255, 0.84)',
  glassBorder: 'rgba(255, 255, 255, 0.88)',
  glassHighlight: 'rgba(255, 255, 255, 0.95)',
  accent: '#FF6A00',
  accentGradient: ['#FF6A00', '#D85604'],
  accentSoft: 'rgba(255, 106, 0, 0.14)',
  onAccent: '#FFFFFF',
  text: '#2E1408',
  textSecondary: '#6E5144',
  textFaint: '#A68D81',
  danger: '#DC2626',
  success: '#059669',
  warning: '#D97706',
  shadow: 'rgba(46, 20, 8, 0.09)',
  statusBarStyle: 'dark',
};

export function useGlass(): GlassTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

export { dark as darkGlass, light as lightGlass };
