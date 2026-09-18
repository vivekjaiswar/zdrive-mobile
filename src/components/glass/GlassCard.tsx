import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { useGlass } from '@/theme/glass';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  // `strong` uses the more opaque fill - use it behind dense/legibility-
  // critical content (file rows, forms). Default (translucent) is for
  // accent cards, headers, and chrome where the frosted look matters more.
  strong?: boolean;
  padding?: number;
  radius?: number;
}

export default function GlassCard({
  children,
  style,
  strong = false,
  padding = 18,
  radius = 22,
}: Props) {
  const g = useGlass();

  return (
    <View
      style={[
        styles.wrap,
        {
          borderRadius: radius,
          borderColor: g.glassBorder,
          shadowColor: g.shadow,
        },
        style,
      ]}
    >
      <BlurView
        intensity={g.blurIntensity}
        tint={g.blurTint}
        // Android needs this to blur real content behind the view rather
        // than falling back to a flat translucent rectangle.
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: strong ? g.glassFillStrong : g.glassFill },
        ]}
      />
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 1,
    // Soft elevation - kept subtle so it reads as "floating glass" not a
    // heavy Material card.
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
});
