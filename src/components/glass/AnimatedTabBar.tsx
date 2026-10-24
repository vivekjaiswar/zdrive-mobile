import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassTheme, useGlass } from '@/theme/glass';
import { fonts } from '@/theme/typography';

export const TAB_BAR_HEIGHT = 64;

interface Props {
  state: any;
  descriptors: any;
  navigation?: any;
  navigateToTab?: (routeKey: string) => void;
  emitter?: any;
  visible?: SharedValue<number>;
}

export default function AnimatedTabBar(props: Props) {
  const { state, descriptors, navigation, navigateToTab, visible } = props;
  const g = useGlass();
  const insets = useSafeAreaInsets();
  const isDark = g.scheme === 'dark';

  const bottomOffset = insets.bottom > 0 ? insets.bottom + 6 : 16;
  const styles = getStyles(g, bottomOffset);

  const animStyle = useAnimatedStyle(() => {
    if (!visible) return {};

    // Instagram / iOS Dynamic Capsule Scroll Shrink
    const scale = interpolate(
      visible.value,
      [0, 1],
      [0.82, 1],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      visible.value,
      [0, 1],
      [TAB_BAR_HEIGHT + bottomOffset + 24, 0],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      visible.value,
      [0, 0.4, 1],
      [0, 0.6, 1],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <Animated.View style={[styles.capsuleWrap, animStyle]} pointerEvents="auto">
        {/* iOS 27 Liquid Glass Background */}
        <View style={styles.glassContainer}>
          <BlurView
            intensity={Platform.OS === 'ios' ? 85 : 40}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? 'rgba(28, 28, 30, 0.85)'
                  : 'rgba(255, 255, 255, 0.88)',
              },
            ]}
          />

          {/* Hairline Glass Highlight Border */}
          <View
            style={[
              styles.glassBorder,
              {
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.16)'
                  : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          />

          {/* Tabs Content */}
          <View style={styles.tabsRow}>
            {state.routes.map((route: { key: string; name: string }, index: number) => {
              const { options } = descriptors[route.key];
              const focused = state.index === index;
              const color = focused ? g.accent : (isDark ? '#8E8E93' : '#6C6C70');
              const label = (options.title ?? route.name) as string;

              const onPress = () => {
                if (navigateToTab) {
                  navigateToTab(route.key);
                } else if (navigation) {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!focused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }
              };

              return (
                <Pressable
                  key={route.key}
                  style={({ pressed }) => [
                    styles.tab,
                    pressed && styles.tabPressed,
                  ]}
                  onPress={onPress}
                  hitSlop={8}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      focused && {
                        backgroundColor: isDark
                          ? 'rgba(255, 94, 30, 0.16)'
                          : 'rgba(255, 94, 30, 0.10)',
                      },
                    ]}
                  >
                    {options.tabBarIcon?.({ focused, color, size: 23 })}
                  </View>
                  <Text
                    style={[
                      styles.label,
                      {
                        color,
                        fontFamily: focused ? fonts.semiBold : fonts.medium,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function getStyles(g: GlassTheme, bottomOffset: number) {
  const isDark = g.scheme === 'dark';

  return StyleSheet.create({
    outerContainer: {
      position: 'absolute',
      bottom: bottomOffset,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    capsuleWrap: {
      width: '92%',
      maxWidth: 420,
      height: TAB_BAR_HEIGHT,
      borderRadius: 32,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 18,
      elevation: 10,
    },
    glassContainer: {
      flex: 1,
      borderRadius: 32,
      overflow: 'hidden',
    },
    glassBorder: {
      ...StyleSheet.absoluteFill,
      borderRadius: 32,
      borderWidth: 1,
      pointerEvents: 'none',
    },
    tabsRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 8,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    },
    tabPressed: {
      transform: [{ scale: 0.92 }],
      opacity: 0.85,
    },
    iconWrap: {
      width: 44,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    label: {
      fontSize: 10.5,
      letterSpacing: -0.1,
    },
  });
}
