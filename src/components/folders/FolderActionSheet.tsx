import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import FileActionRow from '@/components/files/FileActionRow';
import Colors from '@/theme/colors';
import { ZDriveFolder } from '@/types/folder';

interface Props {
  folder: ZDriveFolder | null;
  deleting?: boolean;
  onClose: () => void;
  onRename: (folder: ZDriveFolder) => void;
  onDelete: (folder: ZDriveFolder) => void;
}

// Deliberately just Rename/Delete - the backend has no folder-move
// endpoint (UpdateFolderDto only accepts `name`), so there's no
// "Move" action to offer here, unlike FileActionSheet.
export default function FolderActionSheet({
  folder,
  deleting,
  onClose,
  onRename,
  onDelete,
}: Props) {
  return (
    <Modal
      visible={!!folder}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          {folder && (
            <Text style={styles.title} numberOfLines={1}>
              {folder.name}
            </Text>
          )}

          <View style={styles.rows}>
            <FileActionRow
              icon="pencil-outline"
              label="Rename"
              onPress={() => folder && onRename(folder)}
            />
            <FileActionRow
              icon="trash-can-outline"
              label="Delete"
              loading={deleting}
              destructive
              onPress={() => folder && onDelete(folder)}
            />
          </View>

          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },

  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
  },

  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    marginBottom: 16,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },

  rows: {
    marginTop: 4,
  },

  cancelButton: {
    marginTop: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },

  cancelText: {
    fontWeight: '700',
    color: Colors.textSecondary,
    fontSize: 16,
  },
});
