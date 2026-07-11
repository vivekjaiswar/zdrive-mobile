import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import FolderCard from './FolderCard';
import FileCard from '@/components/files/FileCard';
import EmptyFiles from '@/components/files/EmptyFiles';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { ZDriveFile } from '@/types/file';
import { ZDriveFolder } from '@/types/folder';

interface Props {
  folders: ZDriveFolder[];
  files: ZDriveFile[];
  refreshing: boolean;
  onRefresh: () => void;
  onFolderPress: (folder: ZDriveFolder) => void;
  onFolderLongPress: (folder: ZDriveFolder) => void;
  onFilePress: (file: ZDriveFile) => void;
  onFileLongPress: (file: ZDriveFile) => void;
  // Long-press enters selection mode (onFileLongPress above); once
  // active, tapping a row toggles it instead of navigating, and the
  // per-row kebab menu opens the single-file action sheet in its
  // place. Folders are excluded from multi-select entirely - their
  // taps are disabled (not just re-purposed) while selecting.
  onFileToggleSelect?: (file: ZDriveFile) => void;
  onFileMenuPress?: (file: ZDriveFile) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  bottomSpacing: number;
}

// Shared list presentation for the root "My Drive" screen and the
// Folder Explorer screen - both show the same "folders, then files"
// layout, just backed by different API calls.
export default function FolderContents({
  folders,
  files,
  refreshing,
  onRefresh,
  onFolderPress,
  onFolderLongPress,
  onFilePress,
  onFileLongPress,
  onFileToggleSelect,
  onFileMenuPress,
  selectionMode = false,
  selectedIds,
  bottomSpacing,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <FlatList
      data={files}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={
        isEmpty
          ? { flexGrow: 1, justifyContent: 'center', paddingBottom: bottomSpacing }
          : { paddingBottom: bottomSpacing }
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      ListHeaderComponent={
        folders.length > 0 ? (
          <View style={styles.foldersSection}>
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onPress={() => {
                  if (!selectionMode) onFolderPress(folder);
                }}
                onLongPress={() => {
                  if (!selectionMode) onFolderLongPress(folder);
                }}
              />
            ))}

            {files.length > 0 && (
              <Text style={styles.sectionLabel}>Files</Text>
            )}
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <FileCard
          file={item}
          selectionMode={selectionMode}
          selected={selectedIds?.has(item.id) ?? false}
          onPress={() => {
            if (selectionMode) {
              onFileToggleSelect?.(item);
            } else {
              onFilePress(item);
            }
          }}
          onLongPress={() => {
            if (!selectionMode) onFileLongPress(item);
          }}
          onMenuPress={() => onFileMenuPress?.(item)}
        />
      )}
      ListEmptyComponent={<EmptyFiles />}
    />
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    list: {
      marginTop: 8,
    },

    foldersSection: {
      marginBottom: 4,
    },

    sectionLabel: {
      fontSize: 12.5,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
      marginTop: 6,
    },
  });
}
