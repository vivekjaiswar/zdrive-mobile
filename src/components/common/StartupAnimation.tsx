import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View, Pressable, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useGlass } from '@/theme/glass';
import { fonts } from '@/theme/typography';

interface Props {
  onFinish?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StartupAnimation({ onFinish }: Props) {
  const g = useGlass();
  const [visible, setVisible] = useState(true);

  const scale = useSharedValue(0.6);
  const glowScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0.2);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(12);
  const screenOpacity = useSharedValue(1);
  const screenTranslateY = useSharedValue(0);

  const finishCallback = () => {
    setVisible(false);
    onFinish?.();
  };

  const handleComplete = () => {
    screenTranslateY.value = withTiming(
      -SCREEN_HEIGHT,
      { duration: 380, easing: Easing.bezier(0.22, 1, 0.36, 1) },
      (finished) => {
        if (finished) {
          runOnJS(finishCallback)();
        }
      },
    );
    screenOpacity.value = withDelay(
      120,
      withTiming(0, { duration: 260, easing: Easing.in(Easing.ease) }),
    );
  };

  useEffect(() => {
    // 1. Logo mark scale and fade in
    logoOpacity.value = withTiming(1, { duration: 400 });
    scale.value = withSpring(1, { damping: 12, stiffness: 120 });

    // 2. Ambient warm glow pulsation
    glowOpacity.value = withSequence(
      withTiming(0.7, { duration: 600, easing: Easing.out(Easing.ease) }),
      withTiming(0.4, { duration: 600 }),
    );
    glowScale.value = withSequence(
      withTiming(1.3, { duration: 600 }),
      withTiming(1.15, { duration: 600 }),
    );

    // 3. Text entrance
    textOpacity.value = withDelay(250, withTiming(1, { duration: 500 }));
    textTranslateY.value = withDelay(
      250,
      withSpring(0, { damping: 14, stiffness: 100 }),
    );

    // 4. Smooth curtain slide-up exit after ~1.6s
    const timer = setTimeout(() => {
      screenTranslateY.value = withTiming(
        -SCREEN_HEIGHT,
        { duration: 520, easing: Easing.bezier(0.22, 1, 0.36, 1) },
        (finished) => {
          if (finished) {
            runOnJS(finishCallback)();
          }
        },
      );
      screenOpacity.value = withDelay(
        220,
        withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) }),
      );
    }, 1600);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: logoOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const screenAnimatedStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ translateY: screenTranslateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.container, screenAnimatedStyle]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Pressable
        style={[StyleSheet.absoluteFill, styles.centerWrapper]}
        onPress={handleComplete}
      >
        <LinearGradient
          colors={g.gradient as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />

        {/* Ambient Warm Gradient Orbs */}
        <View
          style={[
            styles.orb,
            {
              backgroundColor: g.orbA,
              top: '25%',
              left: '15%',
              width: 260,
              height: 260,
            },
          ]}
        />
        <View
          style={[
            styles.orb,
            {
              backgroundColor: g.orbB,
              bottom: '25%',
              right: '15%',
              width: 280,
              height: 280,
            },
          ]}
        />

        <View style={styles.centerContent}>
          {/* Pulsing Sunburst Glow behind emblem */}
          <Animated.View
            style={[
              styles.glowRing,
              { backgroundColor: g.accent },
              glowAnimatedStyle,
            ]}
          />

          {/* OJI Emblem */}
          <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
            <Image
              source={require('../../../assets/images/oji-mark.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* OJI DRIVE Wordmark */}
          <Animated.View style={[styles.textWrapper, textAnimatedStyle]}>
            <Text style={[styles.title, { color: g.text }]}>
              <Text style={{ color: g.accent }}>OJI </Text>
              <Text style={{ color: g.text }}>DRIVE</Text>
            </Text>
            <Text style={[styles.subtitle, { color: g.textSecondary }]}>
              COMMUNITY CONVENIENCE
            </Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 99999,
  },
  centerWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    filter: 'blur(60px)',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  glowRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    filter: 'blur(32px)',
  },
  logoWrapper: {
    width: 116,
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6A00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  logoImage: {
    width: 116,
    height: 116,
  },
  textWrapper: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 34,
    letterSpacing: 2.5,
  },
  subtitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
