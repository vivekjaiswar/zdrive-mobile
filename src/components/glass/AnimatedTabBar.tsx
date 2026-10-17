import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassTheme, useGlass } from '@/theme/glass';
import { fonts } from '@/theme/typography';

const BAR_HEIGHT = 62;

interface Props {
  state: any;
  descriptors: any;
  navigation: any;
  visible: SharedValue<number>;
}

export default function AnimatedTabBar({ state, descriptors, navigation, visible }: Props) {
  const g = useGlass();
  const insets = useSafeAreaInsets();
  const isDark = g.scheme === 'dark';

  // Generous clearance for Android 3-button navigation (42dp bar) and gesture insets
  const navBarOffset = Math.max(insets.bottom, Platform.OS === 'android' ? 46 : 20) + 10;
  const styles = getStyles(g, navBarOffset);

  const animStyle = useAnimatedStyle(() => {
    // When scrolling down, navbar smoothly shrinks in scale and slides down
    const scale = interpolate(
      visible.value,
      [0, 1],
      [0.78, 1],
      Extrapolation.CLAMP,
    );
    const translateY = interpolate(
      visible.value,
      [0, 1],
      [BAR_HEIGHT + navBarOffset + 30, 0],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      visible.value,
      [0, 0.35, 1],
      [0, 0.5, 1],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <Animated.View style={[styles.wrap, animStyle]} pointerEvents="auto">
        {/* Instagram-Style Sunset Gradient Border */}
        <LinearGradient
          colors={['#FF6A00', '#FF385C', '#D85604', '#FFA000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.8 }}
          style={styles.gradientBorder}
        >
          {/* Inner Content with opaque background to prevent text bleed-through */}
          <View
            style={[
              styles.innerContent,
              {
                backgroundColor: isDark
                  ? 'rgba(20, 10, 5, 0.98)'
                  : 'rgba(255, 255, 255, 0.98)',
              },
            ]}
          >
            {state.routes.map((route: { key: string; name: string }, index: number) => {
              const { options } = descriptors[route.key];
              const focused = state.index === index;
              const color = focused ? g.accent : g.textFaint;
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
                <Pressable
                  key={route.key}
                  style={styles.tab}
                  onPress={onPress}
                  hitSlop={8}
                >
                  <View style={styles.iconWrap}>
                    {options.tabBarIcon?.({ focused, color, size: 22 })}
                  </View>
                  <Text
                    style={[
                      styles.label,
                      {
                        color: focused ? g.accent : g.textFaint,
                        fontFamily: focused ? fonts.bold : fonts.medium,
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
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

function getStyles(g: GlassTheme, bottomOffset: number = 0) {
  return StyleSheet.create({
    outerContainer: {
      position: 'absolute',
      bottom: bottomOffset,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    wrap: {
      width: '92%',
      maxWidth: 440,
      height: BAR_HEIGHT,
      shadowColor: '#FF6A00',
      shadowOpacity: 0.22,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 6 },
      elevation: 10,
    },
    gradientBorder: {
      flex: 1,
      borderRadius: 36,
      padding: 1.8,
    },
    innerContent: {
      flex: 1,
      borderRadius: 34.2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 8,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
      height: '100%',
    },
    iconWrap: {
      width: 44,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: 10.5,
      letterSpacing: 0.1,
    },
  });
}
