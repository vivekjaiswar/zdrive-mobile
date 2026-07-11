import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { SharedFileEntry } from '@/types/file';

interface Props {
  entry: SharedFileEntry;
  revoking?: boolean;
  sharing?: boolean;
  onPress: () => void;
  onShareAgain: () => void;
  onRevoke: () => void;
}

function formatSize(size: string) {
  const bytes = Number(size) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default function SharedFileRow({
  entry,
  revoking,
  sharing,
  onPress,
  onShareAgain,
  onRevoke,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.icon}>
        <MaterialCommunityIcons name="link-variant" size={22} color={colors.primary} />
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>{entry.file.name}</Text>
        <Text style={styles.meta}>
          {formatSize(entry.file.size)} · Shared {new Date(entry.createdAt).toLocaleDateString()}
        </Text>
      </View>

      <Pressable
        hitSlop={10}
        onPress={onShareAgain}
        disabled={sharing || revoking}
        style={styles.actionButton}
      >
        {sharing ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <MaterialCommunityIcons name="share-variant-outline" size={20} color={colors.primary} />
        )}
      </Pressable>

      <Pressable
        hitSlop={10}
        onPress={onRevoke}
        disabled={sharing || revoking}
        style={styles.actionButton}
      >
        {revoking ? (
          <ActivityIndicator size="small" color={colors.danger} />
        ) : (
          <MaterialCommunityIcons name="link-off" size={20} color={colors.danger} />
        )}
      </Pressable>
    </Pressable>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 14,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: {
      opacity: 0.85,
    },
    icon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      marginLeft: 14,
    },
    name: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    meta: {
      marginTop: 3,
      fontSize: 12,
      color: colors.textSecondary,
    },
    actionButton: {
      paddingHorizontal: 6,
    },
  });
}
