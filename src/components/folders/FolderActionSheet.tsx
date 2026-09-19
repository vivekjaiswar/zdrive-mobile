import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import FileActionRow from '@/components/files/FileActionRow';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { ZDriveFolder } from '@/types/folder';

interface Props {
  folder: ZDriveFolder | null;
  deleting?: boolean;
  downloadingZip?: boolean;
  onClose: () => void;
  onRename: (folder: ZDriveFolder) => void;
  onDelete: (folder: ZDriveFolder) => void;
  onDownloadZip?: (folder: ZDriveFolder) => void;
}

export default function FolderActionSheet({
  folder,
  deleting,
  downloadingZip = false,
  onClose,
  onRename,
  onDelete,
  onDownloadZip,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

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
            {onDownloadZip && (
              <FileActionRow
                icon="folder-zip-outline"
                label="Download Zip Archive"
                loading={downloadingZip}
                onPress={() => folder && onDownloadZip(folder)}
              />
            )}
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
