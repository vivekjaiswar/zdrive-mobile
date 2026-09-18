import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { GlassTheme, useGlass } from '@/theme/glass';

interface Props {
  onPress: () => void;
  loading?: boolean;
  progress?: { current: number; total: number } | null;
}

export default function UploadFAB({ onPress, loading = false, progress }: Props) {
  const g = useGlass();
  const styles = getStyles(g);
  // Sit above the (now floating/absolute) tab bar - the hook already folds
  // in the device's bottom safe-area inset, so this clears the bar and the
  // gesture nav on any device rather than a fixed guess that overlapped.
  const tabBarHeight = useTabBarHeight();

  const label = loading
    ? progress && progress.total > 1
      ? `Uploading ${progress.current}/${progress.total}`
      : 'Uploading…'
    : 'Upload';

  return (
    <Pressable
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        { bottom: tabBarHeight + 16 },
        pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] },
        loading && styles.disabled,
      ]}
      onPress={onPress}
    >
      <LinearGradient
        colors={g.accentGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
        )}
        <Text style={styles.text}>{label}</Text>
      </View>
    </Pressable>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    button: {
      position: 'absolute',
      right: 20,
      height: 54,
      borderRadius: 27,
      overflow: 'hidden',
      justifyContent: 'center',
      shadowColor: g.accent,
      shadowOpacity: 0.4,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 },
      elevation: 8,
    },
    inner: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 22,
    },
    disabled: { opacity: 0.75 },
    text: {
      marginLeft: 9,
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15.5,
    },
  });
}
