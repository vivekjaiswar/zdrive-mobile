import { useColorScheme } from 'react-native';

import { darkColors, lightColors } from './palette';

// app.json already declares userInterfaceStyle: "automatic" - this
// hook is what actually makes the UI honor that instead of just the
// OS-level chrome. No manual in-app toggle/context needed: RN's
// useColorScheme() already reflects the device's current light/dark
// setting and updates live if the user changes it while the app is
// open.
export function useColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? darkColors : lightColors;
}
