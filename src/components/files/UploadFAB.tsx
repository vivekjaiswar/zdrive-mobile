import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  onPress: () => void;
  loading?: boolean;
  progress?: { current: number; total: number } | null;
}

export default function UploadFAB({ onPress, loading = false, progress }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  const label = loading
    ? progress && progress.total > 1
      ? `Uploading ${progress.current}/${progress.total}`
      : 'Uploading...'
    : 'Upload';

  return (
    <Pressable
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
        loading && styles.disabled,
      ]}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
      )}

      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    button: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      height: 54,
      borderRadius: 27,
      paddingHorizontal: 22,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',

      shadowColor: colors.shadow,
      shadowOpacity: 0.25,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    },

    disabled: { opacity: 0.7 },

    text: {
      marginLeft: 9,
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15.5,
    },
  });
}
