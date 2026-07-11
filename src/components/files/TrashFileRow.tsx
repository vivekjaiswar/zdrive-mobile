import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { ZDriveFile } from '@/types/file';

interface Props {
  file: ZDriveFile;
  restoring?: boolean;
  deleting?: boolean;
  onRestore: () => void;
  onDeleteForever: () => void;
}

function formatSize(size: string) {
  const bytes = Number(size) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

// Trash rows deliberately skip tap-to-preview and the long-press
// action sheet used elsewhere - Share/Rename/Move don't make sense
// for a trashed file, so Restore and Delete Forever are just always
// visible instead of hidden behind a menu.
export default function TrashFileRow({
  file,
  restoring,
  deleting,
  onRestore,
  onDeleteForever,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <MaterialCommunityIcons name="file-outline" size={24} color={colors.textSecondary} />
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>{file.name}</Text>
        <Text style={styles.meta}>{formatSize(file.size)}</Text>
      </View>

      <Pressable
        hitSlop={10}
        onPress={onRestore}
        disabled={restoring || deleting}
        style={styles.actionButton}
      >
        {restoring ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <MaterialCommunityIcons name="restore" size={22} color={colors.primary} />
        )}
      </Pressable>

      <Pressable
        hitSlop={10}
        onPress={onDeleteForever}
        disabled={restoring || deleting}
        style={styles.actionButton}
      >
        {deleting ? (
          <ActivityIndicator size="small" color={colors.danger} />
        ) : (
          <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.danger} />
        )}
      </Pressable>
    </View>
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
    icon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.surfaceAlt,
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
      fontSize: 12.5,
      color: colors.textSecondary,
    },
    actionButton: {
      paddingHorizontal: 8,
    },
  });
}
