import { useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import FolderCard from './FolderCard';
import FileCard from '@/components/files/FileCard';
import FileGridCell from '@/components/files/FileGridCell';
import EmptyFiles from '@/components/files/EmptyFiles';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { ZDriveFile } from '@/types/file';
import { ZDriveFolder } from '@/types/folder';

export type SortKey = 'name' | 'date' | 'size';
export type SortDir = 'asc' | 'desc';

function sortItems<T extends { name: string; createdAt: string; size?: string }>(
  items: T[],
  key: SortKey,
  dir: SortDir,
): T[] {
  const factor = dir === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    let cmp: number;
    if (key === 'date') {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (key === 'size') {
      // Folders have no size - fall back to name so they order sensibly.
      cmp = (Number(a.size) || 0) - (Number(b.size) || 0);
      if (cmp === 0) cmp = a.name.localeCompare(b.name);
    } else {
      cmp = a.name.localeCompare(b.name);
    }
    return cmp * factor;
  });
}

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
  // Optional scroll handler (used to drive the collapsing tab bar).
  onScroll?: (e: import('react-native').NativeSyntheticEvent<import('react-native').NativeScrollEvent>) => void;
  sortBy?: SortKey;
  sortDir?: SortDir;
  viewMode?: 'list' | 'grid';
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
  onScroll,
  sortBy = 'name',
  sortDir = 'asc',
  viewMode = 'list',
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const { width } = useWindowDimensions();
  const isGrid = viewMode === 'grid';
  // 2-col grid inside the Screen's 24px horizontal padding, 14px gutter.
  const cellWidth = (width - 48 - 14) / 2;

  const sortedFolders = useMemo(
    () => sortItems(folders, sortBy, sortDir),
    [folders, sortBy, sortDir],
  );
  const sortedFiles = useMemo(
    () => sortItems(files, sortBy, sortDir),
    [files, sortBy, sortDir],
  );

  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <FlatList
      // Remount when switching layouts - FlatList can't change numColumns
      // on the fly.
      key={viewMode}
      data={sortedFiles}
      keyExtractor={(item) => item.id}
      style={styles.list}
      numColumns={isGrid ? 2 : 1}
      columnWrapperStyle={isGrid ? { justifyContent: 'space-between' } : undefined}
      onScroll={onScroll}
      scrollEventThrottle={16}
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
            {sortedFolders.map((folder) => (
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
      renderItem={({ item }) => {
        const onPress = () =>
          selectionMode ? onFileToggleSelect?.(item) : onFilePress(item);
        const onLongPress = () => {
          if (!selectionMode) onFileLongPress(item);
        };
        return isGrid ? (
          <FileGridCell
            file={item}
            width={cellWidth}
            selectionMode={selectionMode}
            selected={selectedIds?.has(item.id) ?? false}
            onPress={onPress}
            onLongPress={onLongPress}
            onMenuPress={() => onFileMenuPress?.(item)}
          />
        ) : (
          <FileCard
            file={item}
            selectionMode={selectionMode}
            selected={selectedIds?.has(item.id) ?? false}
            onPress={onPress}
            onLongPress={onLongPress}
            onMenuPress={() => onFileMenuPress?.(item)}
          />
        );
      }}
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
