import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import FileActionRow from './FileActionRow';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
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
  const colors = useColors();
  const styles = getStyles(colors);

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

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(8, 12, 22, 0.5)',
      justifyContent: 'flex-end',
    },

    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 32,
    },

    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 3,
      backgroundColor: colors.border,
      marginBottom: 16,
    },

    title: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 6,
    },

    rows: { marginTop: 4 },

    cancelButton: {
      marginTop: 16,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 16,
      backgroundColor: colors.surfaceAlt,
    },

    cancelText: {
      fontWeight: '700',
      color: colors.textSecondary,
      fontSize: 15,
    },
  });
}
