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
export type ViewMode = 'grid' | 'list' | 'tile';

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
      cmp = (Number(a.size) || 0) - (Number(b.size) || 0);
      if (cmp === 0) cmp = a.name.localeCompare(b.name);
    } else {
      cmp = a.name.localeCompare(b.name);
    }
    return cmp * factor;
  });
}

export interface FolderStat {
  count: number;
  totalBytes: number;
}

interface Props {
  folders: ZDriveFolder[];
  files: ZDriveFile[];
  folderStats?: Record<string, FolderStat>;
  refreshing: boolean;
  onRefresh: () => void;
  onFolderPress: (folder: ZDriveFolder) => void;
  onFolderLongPress: (folder: ZDriveFolder) => void;
  onFolderMenuPress?: (folder: ZDriveFolder) => void;
  onFilePress: (file: ZDriveFile) => void;
  onFileLongPress: (file: ZDriveFile) => void;
  onFileToggleSelect?: (file: ZDriveFile) => void;
  onFileMenuPress?: (file: ZDriveFile) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  bottomSpacing: number;
  onScroll?: (e: import('react-native').NativeSyntheticEvent<import('react-native').NativeScrollEvent>) => void;
  sortBy?: SortKey;
  sortDir?: SortDir;
  viewMode?: ViewMode;
}

export default function FolderContents({
  folders,
  files,
  folderStats,
  refreshing,
  onRefresh,
  onFolderPress,
  onFolderLongPress,
  onFolderMenuPress,
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
  viewMode = 'grid',
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const { width } = useWindowDimensions();

  // Grid (2 cols), Tile (3 cols), List (1 col)
  const isGrid = viewMode === 'grid';
  const isTile = viewMode === 'tile';
  const numColumns = isTile ? 3 : isGrid ? 2 : 1;

  const cellWidth = isTile
    ? (width - 48 - 16) / 3
    : isGrid
      ? (width - 48 - 12) / 2
      : width - 48;

  const folderCardWidth = (width - 48 - 12) / 2;

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
      key={viewMode}
      data={sortedFiles}
      keyExtractor={(item) => item.id}
      style={styles.list}
      numColumns={numColumns}
      columnWrapperStyle={numColumns > 1 ? { justifyContent: 'space-between' } : undefined}
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
            <Text style={styles.sectionLabel}>Folders ({sortedFolders.length})</Text>

            {viewMode === 'list' ? (
              sortedFolders.map((folder) => {
                const stat = folderStats?.[folder.id];
                return (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    itemCount={stat?.count}
                    totalBytes={stat?.totalBytes}
                    variant="list"
                    onPress={() => {
                      if (!selectionMode) onFolderPress(folder);
                    }}
                    onLongPress={() => {
                      if (!selectionMode) onFolderLongPress(folder);
                    }}
                    onMenuPress={() => {
                      if (!selectionMode) onFolderMenuPress ? onFolderMenuPress(folder) : onFolderLongPress(folder);
                    }}
                  />
                );
              })
            ) : (
              <View style={styles.folderGridWrapper}>
                {sortedFolders.map((folder) => {
                  const stat = folderStats?.[folder.id];
                  return (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      itemCount={stat?.count}
                      totalBytes={stat?.totalBytes}
                      variant="grid"
                      width={folderCardWidth}
                      onPress={() => {
                        if (!selectionMode) onFolderPress(folder);
                      }}
                      onLongPress={() => {
                        if (!selectionMode) onFolderLongPress(folder);
                      }}
                      onMenuPress={() => {
                        if (!selectionMode) onFolderMenuPress ? onFolderMenuPress(folder) : onFolderLongPress(folder);
                      }}
                    />
                  );
                })}
              </View>
            )}

            {files.length > 0 && (
              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
                Files ({sortedFiles.length})
              </Text>
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

        if (viewMode === 'list') {
          return (
            <FileCard
              file={item}
              selectionMode={selectionMode}
              selected={selectedIds?.has(item.id) ?? false}
              onPress={onPress}
              onLongPress={onLongPress}
              onMenuPress={() => onFileMenuPress?.(item)}
            />
          );
        }

        return (
          <FileGridCell
            file={item}
            width={cellWidth}
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

import { fonts } from '@/theme/typography';

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    list: {
      marginTop: 8,
    },
    foldersSection: {
      marginBottom: 4,
    },
    folderGridWrapper: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    sectionLabel: {
      fontFamily: fonts.semiBold,
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 10,
      marginTop: 6,
    },
  });
}
