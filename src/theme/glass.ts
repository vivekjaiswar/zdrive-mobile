import { useColorScheme } from 'react-native';

export interface GlassTheme {
  scheme: 'light' | 'dark';
  gradient: readonly [string, string, ...string[]];
  orbA: string;
  orbB: string;
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
  gradient: ['#090D16', '#0B0F19', '#101628'],
  orbA: 'rgba(99, 91, 255, 0.25)',
  orbB: 'rgba(129, 140, 248, 0.2)',
  blurTint: 'dark',
  blurIntensity: 60,
  glassFill: 'rgba(255, 255, 255, 0.05)',
  glassFillStrong: 'rgba(11, 15, 25, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassHighlight: 'rgba(255, 255, 255, 0.22)',
  accent: '#635BFF',
  accentGradient: ['#635BFF', '#4F46E5'],
  accentSoft: 'rgba(99, 91, 255, 0.18)',
  onAccent: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  textFaint: '#64748B',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  shadow: '#000000',
  statusBarStyle: 'light',
};

const light: GlassTheme = {
  scheme: 'light',
  gradient: ['#F8FAFC', '#F1F5F9', '#EFF6FF'],
  orbA: 'rgba(99, 91, 255, 0.15)',
  orbB: 'rgba(147, 197, 253, 0.2)',
  blurTint: 'light',
  blurIntensity: 45,
  glassFill: 'rgba(255, 255, 255, 0.72)',
  glassFillStrong: 'rgba(255, 255, 255, 0.88)',
  glassBorder: 'rgba(226, 232, 240, 0.8)',
  glassHighlight: 'rgba(255, 255, 255, 0.95)',
  accent: '#635BFF',
  accentGradient: ['#635BFF', '#4F46E5'],
  accentSoft: 'rgba(99, 91, 255, 0.12)',
  onAccent: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textFaint: '#94A3B8',
  danger: '#DC2626',
  success: '#059669',
  warning: '#D97706',
  shadow: 'rgba(15, 23, 42, 0.08)',
  statusBarStyle: 'dark',
};

export function useGlass(): GlassTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

export { dark as darkGlass, light as lightGlass };
