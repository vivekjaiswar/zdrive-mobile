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
  primary: '#FF5E1E',
  primaryDark: '#E04A0E',
  primarySoft: 'rgba(255, 94, 30, 0.10)',
  secondary: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F8F9FA',
  text: '#000000',
  textSecondary: '#6C6C70',
  border: 'rgba(0, 0, 0, 0.08)',
  shadow: 'rgba(0, 0, 0, 0.05)',
  progressBackground: '#E5E5EA',
  progressFill: '#FF5E1E',
  statusBarStyle: 'dark',
};

export const darkColors: ColorPalette = {
  primary: '#FF5E1E',
  primaryDark: '#E04A0E',
  primarySoft: 'rgba(255, 94, 30, 0.16)',
  secondary: '#FF453A',
  success: '#30D158',
  warning: '#FFD60A',
  danger: '#FF453A',
  background: '#000000',
  surface: '#1C1C1E',
  surfaceAlt: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: 'rgba(255, 255, 255, 0.10)',
  shadow: 'rgba(0, 0, 0, 0.40)',
  progressBackground: '#3A3A3C',
  progressFill: '#FF5E1E',
  statusBarStyle: 'light',
};
