import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import GradientBackground from '@/components/glass/GradientBackground';
import { useGlass } from '@/theme/glass';

interface Props {
  children: ReactNode;
  // Screens inside the bottom tab navigator pad their own content to the
  // tab bar height, so they exclude 'bottom' here to avoid double inset.
  edges?: readonly Edge[];
}

// GLASS REDESIGN: the base screen wrapper now renders the gradient backdrop
// (GradientBackground) so every screen that already used <Screen> flips to
// the glass look automatically - no per-screen change needed. Content sits
// on the gradient; cards/rows use the (now translucent) palette surfaces.
export default function Screen({
  children,
  edges = ['top', 'left', 'right', 'bottom'],
}: Props) {
  const g = useGlass();

  return (
    <GradientBackground>
      <StatusBar style={g.statusBarStyle} />
      <SafeAreaView style={styles.safeArea} edges={edges}>
        <View style={styles.container}>{children}</View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24 },
});
