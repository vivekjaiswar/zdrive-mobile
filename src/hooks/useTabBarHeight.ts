import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TAB_BAR_CONTENT_HEIGHT = 62;
export const TAB_BAR_VERTICAL_PADDING = 20;

// Total on-screen height of the bottom tab bar, including the
// floating offset and safe-area insets. Use this to pad any
// scrollable screen content that sits above it.
export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  const navBarOffset = Math.max(insets.bottom, Platform.OS === 'android' ? 46 : 20) + 10;

  return (
    TAB_BAR_CONTENT_HEIGHT +
    TAB_BAR_VERTICAL_PADDING +
    navBarOffset
  );
}
