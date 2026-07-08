import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '@/theme/colors';
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
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <MaterialCommunityIcons name="file-outline" size={24} color="#94A3B8" />
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
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <MaterialCommunityIcons name="restore" size={22} color={Colors.primary} />
        )}
      </Pressable>

      <Pressable
        hitSlop={10}
        onPress={onDeleteForever}
        disabled={restoring || deleting}
        style={styles.actionButton}
      >
        {deleting ? (
          <ActivityIndicator size="small" color={Colors.danger} />
        ) : (
          <MaterialCommunityIcons name="trash-can-outline" size={22} color={Colors.danger} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
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
    color: Colors.text,
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actionButton: {
    paddingHorizontal: 8,
  },
});
