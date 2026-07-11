import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  loading?: boolean;
}

export default function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
  loading = false,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        loading && styles.disabled,
      ]}
    >
      <View style={styles.iconCircle}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
        )}
      </View>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 20,
      paddingVertical: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,

      shadowColor: colors.shadow,
      shadowOpacity: 0.04,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },

    pressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },

    disabled: {
      opacity: 0.6,
    },

    iconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
    },

    title: {
      marginTop: 12,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },

    subtitle: {
      marginTop: 3,
      color: colors.textSecondary,
      fontSize: 12.5,
    },
  });
}
