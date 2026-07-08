import { StyleSheet } from 'react-native';

// Shared footer-text styles for the (auth) screens (login, register,
// forgot/reset password, verify email). Prefixed with `_` so Expo
// Router doesn't treat this as a route.
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
