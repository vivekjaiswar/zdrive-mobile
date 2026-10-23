import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';

import { useGlass } from '@/theme/glass';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  strong?: boolean;
  padding?: number;
  radius?: number;
}

export default function GlassCard({
  children,
  style,
  contentStyle,
  strong = false,
  padding = 20,
  radius = 24,
}: Props) {
  const g = useGlass();
  const flatStyle = StyleSheet.flatten(style) as ViewStyle | undefined;
  const isFlex = flatStyle?.flex !== undefined;

  return (
    <View
      style={[
        styles.wrap,
        {
          borderRadius: radius,
          borderColor: g.glassBorder,
          borderTopColor: g.glassHighlight,
          shadowColor: g.shadow,
        },
        style,
      ]}
    >
      <BlurView
        intensity={g.blurIntensity}
        tint={g.blurTint}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: strong ? g.glassFillStrong : g.glassFill },
        ]}
      />
      {/* Specular hairline top reflection */}
      <View
        style={[
          styles.topHighlight,
          { backgroundColor: g.glassHighlight, opacity: 0.6 },
        ]}
      />
      <View style={[{ padding }, isFlex && { flex: 1 }, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 1,
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
  },
});
