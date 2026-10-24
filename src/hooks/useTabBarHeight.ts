import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const TAB_BAR_CONTENT_HEIGHT = 64;

export function useTabBarHeight() {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom > 0 ? insets.bottom + 6 : 16;
  return TAB_BAR_CONTENT_HEIGHT + bottomOffset;
}
