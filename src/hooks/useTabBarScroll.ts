import { createContext, useCallback, useContext, useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SharedValue, withTiming } from 'react-native-reanimated';

// Shared "is the tab bar visible" value (1 = shown, 0 = hidden), created once
// at the tabs layout and consumed by both the AnimatedTabBar (to slide it in/
// out) and every tab screen's scroll handler below.
export const TabBarVisibility = createContext<SharedValue<number> | null>(null);

// Attach the returned onScroll to a tab screen's ScrollView/FlatList (with
// scrollEventThrottle={16}) to get the Instagram-style behaviour: the bar
// slides away when you scroll down and comes back when you scroll up or hit
// the top. Plain JS handler (not a worklet) so it works on any ScrollView/
// FlatList without swapping them to Animated.* - it just writes the shared
// value, and the actual animation runs on the UI thread in AnimatedTabBar.
export function useTabBarScrollHandler() {
  const visible = useContext(TabBarVisibility);
  const lastY = useRef(0);

  return useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!visible) return;
      const y = e.nativeEvent.contentOffset.y;
      const dy = y - lastY.current;

      if (y <= 4) {
        visible.value = withTiming(1, { duration: 200 });
      } else if (dy > 8) {
        visible.value = withTiming(0, { duration: 200 });
      } else if (dy < -8) {
        visible.value = withTiming(1, { duration: 200 });
      }

      lastY.current = y;
    },
    [visible],
  );
}
