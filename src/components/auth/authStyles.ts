import { StyleSheet } from 'react-native';

import { ColorPalette } from '@/theme/palette';

// Shared footer-text styles for the (auth) screens (login, register,
// forgot/reset password, verify email). Lives outside src/app/ on
// purpose - Expo Router scans every file inside app/ as a potential
// route regardless of an underscore prefix (only _layout, (group),
// [dynamic], and +not-found/+html/+api are special-cased), so a plain
// helper file with no default export placed inside app/ triggers a
// "missing the required default export" warning.
export function getAuthStyles(colors: ColorPalette) {
  return StyleSheet.create({
    bottomText: {
      color: colors.textSecondary,
      fontSize: 15,
    },

    link: {
      marginLeft: 5,
      color: colors.primary,
      fontWeight: '700',
      fontSize: 15,
    },

    linkStandalone: {
      color: colors.primary,
      fontWeight: '600',
      textAlign: 'center',
    },

    hint: {
      marginTop: -6,
      marginBottom: 4,
      fontSize: 12,
      color: colors.textSecondary,
    },

    legalText: {
      marginTop: 4,
      fontSize: 12.5,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },

    legalLink: {
      color: colors.primary,
      fontWeight: '600',
    },
  });
}
