import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import Colors from '@/theme/colors';

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
  const color = destructive ? Colors.danger : Colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={22} color={color} />

      <Text style={[styles.label, destructive && { color: Colors.danger }]}>
        {label}
      </Text>

      {loading && (
        <ActivityIndicator size="small" color={color} style={styles.spinner} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F8',
  },

  pressed: {
    opacity: 0.6,
  },

  label: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },

  spinner: {
    marginLeft: 'auto',
  },
});
