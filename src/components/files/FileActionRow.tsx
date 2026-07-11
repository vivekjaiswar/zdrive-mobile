import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  loading?: boolean;
  destructive?: boolean;
}

export default function FileActionRow({
  icon,
  label,
  onPress,
  loading = false,
  destructive = false,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const color = destructive ? colors.danger : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons name={icon} size={21} color={color} />

      <Text style={[styles.label, destructive && { color: colors.danger }]}>
        {label}
      </Text>

      {loading && (
        <ActivityIndicator size="small" color={color} style={styles.spinner} />
      )}
    </Pressable>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    pressed: { opacity: 0.6 },

    label: {
      marginLeft: 16,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },

    spinner: { marginLeft: 'auto' },
  });
}
