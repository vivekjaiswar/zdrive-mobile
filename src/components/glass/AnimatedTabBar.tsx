import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassTheme, useGlass } from '@/theme/glass';

const BAR_HEIGHT = 58;

interface Props {
  state: any;
  descriptors: any;
  navigation: any;
  visible: SharedValue<number>;
}

// Instagram-style subtle floating bottom bar
export default function AnimatedTabBar({ state, descriptors, navigation, visible }: Props) {
  const g = useGlass();
  const insets = useSafeAreaInsets();
  const styles = getStyles(g);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - visible.value) * (BAR_HEIGHT + insets.bottom + 20) }],
    opacity: 0.2 + visible.value * 0.8,
  }));

  return (
    <Animated.View
      style={[styles.wrap, { bottom: insets.bottom + 8 }, animStyle]}
      pointerEvents="box-none"
    >
      <BlurView
        intensity={g.blurIntensity + 15}
        tint={g.blurTint}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: g.scheme === 'dark' ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: g.glassBorder,
            borderWidth: 1,
            borderRadius: 32,
          },
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
          <Pressable key={route.key} style={styles.tab} onPress={onPress} hitSlop={8}>
            {options.tabBarIcon?.({ focused, color, size: 22 })}
            <Text
              style={[
                styles.label,
                { color: focused ? g.accent : g.textFaint, fontWeight: focused ? '700' : '500' },
              ]}
              numberOfLines={1}
            >
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
      left: 20,
      right: 20,
      height: BAR_HEIGHT,
      borderRadius: 32,
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',

      shadowColor: '#000000',
      shadowOpacity: 0.15,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      height: '100%',
    },
    label: {
      fontSize: 10.5,
      letterSpacing: 0.1,
    },
  });
}
