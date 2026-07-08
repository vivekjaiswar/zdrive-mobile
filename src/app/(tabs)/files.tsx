import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import Screen from '@/components/Layout/Screen';
import Colors from '@/theme/colors';
import FileCard from '@/components/files/FileCard';
import SearchBar from '@/components/files/SearchBar';
import EmptyFiles from '@/components/files/EmptyFiles';
import UploadFAB from '@/components/files/UploadFAB';
import FileActionSheet from '@/components/files/FileActionSheet';
import TextPromptModal from '@/components/common/TextPromptModal';
import FolderPickerModal from '@/components/files/FolderPickerModal';
import filesService from '@/services/files.service';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useFileActions } from '@/hooks/useFileActions';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { ZDriveFile } from '@/types/file';

export default function FilesScreen() {
  const router = useRouter();

  const [files, setFiles] = useState<ZDriveFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<ZDriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  // File currently open in the long-press action sheet, and the
  // follow-on rename/move modals it can launch.
  const [actionFile, setActionFile] = useState<ZDriveFile | null>(null);
  const [renameFile, setRenameFile] = useState<ZDriveFile | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [moveFile, setMoveFile] = useState<ZDriveFile | null>(null);
  const [moving, setMoving] = useState(false);

  const { uploading, pickAndUpload } = useFileUpload();
  const tabBarHeight = useTabBarHeight();

  const {
    download,
    share,
    rename,
    move,
    confirmDelete,
    downloadingId,
    sharingId,
    deletingId,
  } = useFileActions(loadFiles);

  // Refresh every time this tab regains focus - not just on first
  // mount - so a rename/move/delete or an upload from the Dashboard
  // is reflected here without a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      loadFiles();
    }, []),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim()) {
        setFilteredFiles(files);
        return;
      }
      searchFiles(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, files]);

  async function loadFiles() {
    try {
      const data = await filesService.list();
      setFiles(data);
      setFilteredFiles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function searchFiles(text: string) {
    try {
      const data = await filesService.search(text);
      setFilteredFiles(data);
    } catch (e) {
      console.error(e);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFiles();
  }, []);

  async function handleUpload() {
    const uploaded = await pickAndUpload();

    if (uploaded) {
      await loadFiles();
    }
  }

  async function handleConfirmRename(name: string) {
    if (!renameFile) return;

    setRenaming(true);
    const ok = await rename(renameFile, name);
    setRenaming(false);

    if (ok) setRenameFile(null);
  }

  async function handleConfirmMove(folderId: string | undefined) {
    if (!moveFile) return;

    setMoving(true);
    const ok = await move(moveFile, folderId);
    setMoving(false);

    if (ok) setMoveFile(null);
  }

  if (loading) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loadingSpinner} />
        <Text style={styles.loading}>Loading files...</Text>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Files</Text>

      <SearchBar value={query} onChangeText={setQuery} />

      <FlatList
        data={filteredFiles}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 20 }}
        contentContainerStyle={
          filteredFiles.length === 0
            ? {
                flexGrow: 1,
                justifyContent: 'center',
                paddingBottom: tabBarHeight + 40,
              }
            : { paddingBottom: tabBarHeight + 88 }
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item }) => (
          <FileCard
            file={item}
            onPress={() => router.push(`/files/${item.id}`)}
            onLongPress={() => setActionFile(item)}
          />
        )}
        ListEmptyComponent={<EmptyFiles />}
      />

      <UploadFAB onPress={handleUpload} loading={uploading} />

      <FileActionSheet
        file={actionFile}
        downloading={actionFile?.id === downloadingId}
        sharing={actionFile?.id === sharingId}
        deleting={actionFile?.id === deletingId}
        onClose={() => setActionFile(null)}
        onDownload={(file) => download(file)}
        onShare={(file) => share(file)}
        onRename={(file) => {
          setActionFile(null);
          setRenameFile(file);
        }}
        onMove={(file) => {
          setActionFile(null);
          setMoveFile(file);
        }}
        onDelete={(file) => {
          setActionFile(null);
          confirmDelete(file);
        }}
      />

      <TextPromptModal
        visible={!!renameFile}
        title="Rename File"
        initialValue={renameFile?.name ?? ''}
        confirmLabel="Rename"
        loading={renaming}
        onCancel={() => setRenameFile(null)}
        onConfirm={handleConfirmRename}
      />

      <FolderPickerModal
        visible={!!moveFile}
        submitting={moving}
        onCancel={() => setMoveFile(null)}
        onSelect={handleConfirmMove}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 20,
  },
  loadingSpinner: {
    marginTop: 60,
  },
  loading: {
    marginTop: 16,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
});
