import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Kept in one place because both the tab bar itself
// ((tabs)/_layout.tsx) and every screen that scrolls under it need
// to agree on the same numbers - otherwise content either gets
// clipped by the tab bar or leaves an ugly gap above it.
export const TAB_BAR_CONTENT_HEIGHT = 56;
export const TAB_BAR_VERTICAL_PADDING = 16;

// Total on-screen height of the bottom tab bar, including the
// device's own bottom safe-area inset (gesture nav bar / home
// indicator). Use this to size the tab bar itself and to pad any
// scrollable screen content that sits above it.
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();

  return (
    TAB_BAR_CONTENT_HEIGHT +
    TAB_BAR_VERTICAL_PADDING +
    insets.bottom
  );
}
