export interface ColorPalette {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  border: string;
  shadow: string;
  progressBackground: string;
  progressFill: string;
  statusBarStyle: 'dark' | 'light';
}

export const lightColors: ColorPalette = {
  primary: '#635BFF',
  primaryDark: '#4F46E5',
  primarySoft: 'rgba(99,91,255,0.12)',
  secondary: '#4F46E5',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  background: 'transparent',
  surface: 'rgba(255,255,255,0.72)',
  surfaceAlt: 'rgba(255,255,255,0.5)',
  text: '#0F172A',
  textSecondary: '#475569',
  border: 'rgba(226,232,240,0.8)',
  shadow: 'rgba(15,23,42,0.08)',
  progressBackground: 'rgba(226,232,240,0.8)',
  progressFill: '#635BFF',
  statusBarStyle: 'dark',
};

export const darkColors: ColorPalette = {
  primary: '#635BFF',
  primaryDark: '#4F46E5',
  primarySoft: 'rgba(99,91,255,0.18)',
  secondary: '#818CF8',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: 'transparent',
  surface: 'rgba(11,15,25,0.75)',
  surfaceAlt: 'rgba(255,255,255,0.05)',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  border: 'rgba(255,255,255,0.12)',
  shadow: '#000000',
  progressBackground: 'rgba(255,255,255,0.12)',
  progressFill: '#635BFF',
  statusBarStyle: 'light',
};
