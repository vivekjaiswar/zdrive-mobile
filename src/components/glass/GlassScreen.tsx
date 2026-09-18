import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import GradientBackground from './GradientBackground';
import { useGlass } from '@/theme/glass';

interface Props {
  children: ReactNode;
  edges?: readonly Edge[];
  // Screens inside the bottom tab navigator pad their own content to the
  // tab bar height, so they exclude 'bottom' here to avoid double inset.
  padded?: boolean;
}

// Root wrapper for every redesigned screen: gradient backdrop + safe area
// + the correct status-bar style for the current theme. Replaces the old
// flat <Screen>.
export default function GlassScreen({
  children,
  edges = ['top', 'left', 'right', 'bottom'],
  padded = true,
}: Props) {
  const g = useGlass();

  return (
    <GradientBackground>
      <StatusBar style={g.statusBarStyle} />
      <SafeAreaView style={styles.safe} edges={edges}>
        <View style={[styles.content, padded && styles.padded]}>{children}</View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1 },
  padded: { paddingHorizontal: 20 },
});
