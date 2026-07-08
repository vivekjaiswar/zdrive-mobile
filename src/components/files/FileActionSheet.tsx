import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import FileActionRow from './FileActionRow';
import Colors from '@/theme/colors';
import { ZDriveFile } from '@/types/file';

interface Props {
  file: ZDriveFile | null;
  downloading?: boolean;
  sharing?: boolean;
  deleting?: boolean;
  onClose: () => void;
  onDownload: (file: ZDriveFile) => void;
  onShare: (file: ZDriveFile) => void;
  onRename: (file: ZDriveFile) => void;
  onMove: (file: ZDriveFile) => void;
  onDelete: (file: ZDriveFile) => void;
}

export default function FileActionSheet({
  file,
  downloading,
  sharing,
  deleting,
  onClose,
  onDownload,
  onShare,
  onRename,
  onMove,
  onDelete,
}: Props) {
  return (
    <Modal
      visible={!!file}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          {file && (
            <Text style={styles.title} numberOfLines={1}>
              {file.name}
            </Text>
          )}

          <View style={styles.rows}>
            <FileActionRow
              icon="download-outline"
              label="Download"
              loading={downloading}
              onPress={() => file && onDownload(file)}
            />
            <FileActionRow
              icon="share-variant-outline"
              label="Share"
              loading={sharing}
              onPress={() => file && onShare(file)}
            />
            <FileActionRow
              icon="pencil-outline"
              label="Rename"
              onPress={() => file && onRename(file)}
            />
            <FileActionRow
              icon="folder-move-outline"
              label="Move"
              onPress={() => file && onMove(file)}
            />
            <FileActionRow
              icon="trash-can-outline"
              label="Delete"
              loading={deleting}
              destructive
              onPress={() => file && onDelete(file)}
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
