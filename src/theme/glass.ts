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
  gradient: ['#000000', '#000000'],
  orbA: 'transparent',
  orbB: 'transparent',
  orbC: 'transparent',
  blurTint: 'dark',
  blurIntensity: 80,
  glassFill: 'rgba(28, 28, 30, 0.78)',
  glassFillStrong: 'rgba(44, 44, 46, 0.88)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassHighlight: 'rgba(255, 255, 255, 0.20)',
  accent: '#FF5E1E',
  accentGradient: ['#FF5E1E', '#FF3B30'],
  accentSoft: 'rgba(255, 94, 30, 0.16)',
  onAccent: '#FFFFFF',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textFaint: '#636366',
  danger: '#FF453A',
  success: '#30D158',
  warning: '#FFD60A',
  shadow: 'rgba(0, 0, 0, 0.40)',
  statusBarStyle: 'light',
};

const light: GlassTheme = {
  scheme: 'light',
  gradient: ['#F2F2F7', '#F2F2F7'],
  orbA: 'transparent',
  orbB: 'transparent',
  orbC: 'transparent',
  blurTint: 'light',
  blurIntensity: 80,
  glassFill: 'rgba(255, 255, 255, 0.82)',
  glassFillStrong: '#FFFFFF',
  glassBorder: 'rgba(0, 0, 0, 0.06)',
  glassHighlight: 'rgba(255, 255, 255, 0.95)',
  accent: '#FF5E1E',
  accentGradient: ['#FF5E1E', '#FF3B30'],
  accentSoft: 'rgba(255, 94, 30, 0.12)',
  onAccent: '#FFFFFF',
  text: '#000000',
  textSecondary: '#6C6C70',
  textFaint: '#8E8E93',
  danger: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  shadow: 'rgba(0, 0, 0, 0.05)',
  statusBarStyle: 'dark',
};

export function useGlass(): GlassTheme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

export { dark as darkGlass, light as lightGlass };
