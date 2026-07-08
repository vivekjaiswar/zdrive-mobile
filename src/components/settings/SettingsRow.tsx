import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import Colors from '@/theme/colors';

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
  const color = destructive ? Colors.danger : Colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || loading}
      style={({ pressed }) => [styles.row, pressed && onPress && styles.pressed]}
    >
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>

      <Text style={[styles.label, destructive && { color: Colors.danger }]}>
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
        <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F8',
    gap: 12,
  },

  pressed: {
    opacity: 0.6,
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },

  value: {
    fontSize: 14,
    color: Colors.textSecondary,
    maxWidth: 140,
  },
});
