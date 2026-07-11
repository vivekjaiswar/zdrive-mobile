import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  loading?: boolean;
  destructive?: boolean;
  showChevron?: boolean;
}

export default function SettingsRow({
  icon,
  label,
  value,
  onPress,
  loading = false,
  destructive = false,
  showChevron = true,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const color = destructive ? colors.danger : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || loading}
      style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}
    >
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={19} color={color} />
      </View>

      <Text style={[styles.label, destructive && { color: colors.danger }]}>
        {label}
      </Text>

      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}

      {onPress && showChevron && !loading && (
        <MaterialCommunityIcons name="chevron-right" size={19} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },

    pressed: {
      opacity: 0.6,
    },

    iconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
    },

    label: {
      flex: 1,
      fontSize: 14.5,
      fontWeight: '600',
      color: colors.text,
    },

    value: {
      fontSize: 13.5,
      color: colors.textSecondary,
      maxWidth: 140,
    },
  });
}
