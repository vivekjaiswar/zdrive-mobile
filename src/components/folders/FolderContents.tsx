import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import FolderCard from './FolderCard';
import FileCard from '@/components/files/FileCard';
import EmptyFiles from '@/components/files/EmptyFiles';
import Colors from '@/theme/colors';
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
  bottomSpacing,
}: Props) {
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
          tintColor={Colors.primary}
        />
      }
      ListHeaderComponent={
        folders.length > 0 ? (
          <View style={styles.foldersSection}>
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onPress={() => onFolderPress(folder)}
                onLongPress={() => onFolderLongPress(folder)}
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
          onPress={() => onFilePress(item)}
          onLongPress={() => onFileLongPress(item)}
        />
      )}
      ListEmptyComponent={<EmptyFiles />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 12,
  },

  foldersSection: {
    marginBottom: 4,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },
});
