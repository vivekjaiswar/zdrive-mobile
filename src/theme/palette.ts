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
  primary: '#FF6A00',
  primaryDark: '#D85604',
  primarySoft: 'rgba(255, 106, 0, 0.12)',
  secondary: '#D85604',
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
  background: 'transparent',
  surface: 'rgba(255, 255, 255, 0.70)',
  surfaceAlt: 'rgba(255, 255, 255, 0.48)',
  text: '#2E1408',
  textSecondary: '#6E5144',
  border: 'rgba(255, 255, 255, 0.85)',
  shadow: 'rgba(255, 106, 0, 0.08)',
  progressBackground: 'rgba(239, 228, 220, 0.8)',
  progressFill: '#FF6A00',
  statusBarStyle: 'dark',
};

export const darkColors: ColorPalette = {
  primary: '#FF6A00',
  primaryDark: '#D85604',
  primarySoft: 'rgba(255, 106, 0, 0.18)',
  secondary: '#FF8833',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: 'transparent',
  surface: 'rgba(32, 16, 8, 0.70)',
  surfaceAlt: 'rgba(255, 255, 255, 0.05)',
  text: '#FFFFFF',
  textSecondary: '#CBB8AC',
  border: 'rgba(255, 120, 40, 0.16)',
  shadow: 'rgba(0, 0, 0, 0.5)',
  progressBackground: 'rgba(255, 255, 255, 0.12)',
  progressFill: '#FF6A00',
  statusBarStyle: 'light',
};
