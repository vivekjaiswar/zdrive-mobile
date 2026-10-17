import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { GlassTheme, useGlass } from '@/theme/glass';
import { fonts } from '@/theme/typography';

interface Props {
  onPress: () => void;
  loading?: boolean;
  progress?: { current: number; total: number } | null;
}

export default function UploadFAB({ onPress, loading = false, progress }: Props) {
  const g = useGlass();
  const styles = getStyles(g);
  const tabBarHeight = useTabBarHeight();

  const [justFinished, setJustFinished] = useState(false);
  const prevLoading = useRef(loading);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    if (loading) {
      // Loop ripple pulse animation while uploading
      pulseScale.value = 1;
      pulseOpacity.value = 0.6;
      pulseScale.value = withRepeat(
        withTiming(1.4, { duration: 1100, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 200 }),
          withTiming(0, { duration: 900, easing: Easing.out(Easing.ease) }),
        ),
        -1,
        false,
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }

    if (prevLoading.current && !loading) {
      // Just completed upload! Trigger celebration pop
      setJustFinished(true);
      buttonScale.value = withSequence(
        withSpring(1.12, { damping: 8, stiffness: 180 }),
        withSpring(1.0, { damping: 12 }),
      );
      const timer = setTimeout(() => {
        setJustFinished(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
    prevLoading.current = loading;
  }, [loading]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const label = loading
    ? progress && progress.total > 1
      ? `Uploading ${progress.current}/${progress.total}`
      : 'Uploading…'
    : justFinished
    ? 'Uploaded!'
    : 'Upload';

  return (
    <View style={[styles.wrapper, { bottom: tabBarHeight + 16 }]} pointerEvents="box-none">
      {/* Animated Ripple Pulse Ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          { backgroundColor: g.accent },
          pulseAnimatedStyle,
        ]}
      />

      <Animated.View style={buttonAnimatedStyle}>
        <Pressable
          disabled={loading}
          style={({ pressed }) => [
            styles.button,
            pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] },
            loading && styles.disabled,
          ]}
          onPress={onPress}
        >
          <LinearGradient
            colors={
              justFinished
                ? ['#10B981', '#059669']
                : g.accentGradient
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.inner}>
            {loading ? (
              <MaterialCommunityIcons name="cloud-upload" size={22} color="#FFFFFF" />
            ) : justFinished ? (
              <MaterialCommunityIcons name="check-circle" size={22} color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
            )}
            <Text style={styles.text}>{label}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    wrapper: {
      position: 'absolute',
      right: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pulseRing: {
      position: 'absolute',
      width: 140,
      height: 54,
      borderRadius: 27,
    },
    button: {
      height: 54,
      borderRadius: 27,
      overflow: 'hidden',
      justifyContent: 'center',
      shadowColor: g.accent,
      shadowOpacity: 0.45,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    inner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 22,
    },
    disabled: { opacity: 0.85 },
    text: {
      marginLeft: 9,
      color: '#FFFFFF',
      fontFamily: fonts.bold,
      fontSize: 15,
      letterSpacing: 0.2,
    },
  });
}
