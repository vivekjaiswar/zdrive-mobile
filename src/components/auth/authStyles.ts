import { StyleSheet } from 'react-native';

// Shared footer-text styles for the (auth) screens (login, register,
// forgot/reset password, verify email). Lives outside src/app/ on
// purpose - Expo Router scans every file inside app/ as a potential
// route regardless of an underscore prefix (only _layout, (group),
// [dynamic], and +not-found/+html/+api are special-cased), so a plain
// helper file with no default export placed inside app/ triggers a
// "missing the required default export" warning.
export const authStyles = StyleSheet.create({
  bottomText: {
    color: '#64748B',
    fontSize: 15,
  },

  link: {
    marginLeft: 5,
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 15,
  },

  linkStandalone: {
    color: '#2563EB',
    fontWeight: '600',
    textAlign: 'center',
  },
});
