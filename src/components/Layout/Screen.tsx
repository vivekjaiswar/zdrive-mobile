import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useColors } from '@/theme/useColors';

interface Props {
  children: ReactNode;
  // Screens that live inside the bottom tab navigator already get an
  // explicit paddingBottom sized to the real tab bar height (see
  // useTabBarHeight) - for those, exclude 'bottom' here so the safe
  // area inset isn't reserved twice (once by this SafeAreaView, once
  // by the content padding).
  edges?: readonly Edge[];
}

// NOTE: this no longer renders its own <StatusBar> - it used to,
// alongside the root layout's expo-status-bar <StatusBar>, which
// meant two different StatusBar implementations (react-native's and
// expo-status-bar's) were both fighting to control the same native
// module. The root layout is now the single source of truth for
// status bar style, driven by the same useColors() theme.
export default function Screen({
  children,
  edges = ['top', 'left', 'right', 'bottom'],
}: Props) {
  const colors = useColors();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={edges}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
});
