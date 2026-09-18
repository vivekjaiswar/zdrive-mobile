import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassTheme, useGlass } from '@/theme/glass';

const BAR_HEIGHT = 62;

// The navigator (expo-router / react-navigation bottom tabs) passes the
// standard BottomTabBarProps; those types aren't cleanly importable here, so
// the nav-shaped props are typed loosely and only `visible` is strict.
interface Props {
  state: any;
  descriptors: any;
  navigation: any;
  visible: SharedValue<number>;
}

// Instagram-style floating pill tab bar: a frosted rounded bar that slides
// down out of view on scroll-down and back up on scroll-up (driven by the
// `visible` shared value, animated on the UI thread). Custom bar rather than
// the default so we can animate its position and give it the pill shape.
export default function AnimatedTabBar({ state, descriptors, navigation, visible }: Props) {
  const g = useGlass();
  const insets = useSafeAreaInsets();
  const styles = getStyles(g);

  const animStyle = useAnimatedStyle(() => ({
    // Slide fully off-screen (bar height + its bottom offset) when hidden.
    transform: [{ translateY: (1 - visible.value) * (BAR_HEIGHT + insets.bottom + 30) }],
    opacity: 0.35 + visible.value * 0.65,
  }));

  return (
    <Animated.View
      style={[styles.wrap, { bottom: insets.bottom + 10 }, animStyle]}
      pointerEvents="box-none"
    >
      <BlurView
        intensity={g.blurIntensity + 20}
        tint={g.blurTint}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: g.glassFillStrong, borderColor: g.glassBorder, borderWidth: 1, borderRadius: 30 },
        ]}
      />

      {state.routes.map((route: { key: string; name: string }, index: number) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? g.accent : g.textSecondary;
        const label = (options.title ?? route.name) as string;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} style={styles.tab} onPress={onPress} hitSlop={6}>
            {options.tabBarIcon?.({ focused, color, size: 23 })}
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 16,
      right: 16,
      height: BAR_HEIGHT,
      borderRadius: 30,
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      shadowColor: '#000',
      shadowOpacity: 0.28,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 12,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      height: '100%',
    },
    label: { fontSize: 11, fontWeight: '600' },
  });
}
