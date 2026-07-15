import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Screen from '@/components/Layout/Screen';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import SearchBar from '@/components/files/SearchBar';
import UploadFAB from '@/components/files/UploadFAB';
import FileActionSheet from '@/components/files/FileActionSheet';
import TextPromptModal from '@/components/common/TextPromptModal';
import FolderPickerModal from '@/components/files/FolderPickerModal';
import FolderContents from '@/components/folders/FolderContents';
import FolderActionSheet from '@/components/folders/FolderActionSheet';
import SelectionBar from '@/components/files/SelectionBar';
import filesService from '@/services/files.service';
import foldersService from '@/services/folders.service';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useFileActions } from '@/hooks/useFileActions';
import { useFolderActions } from '@/hooks/useFolderActions';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useFilePreviewStore } from '@/store/filePreview.store';
import { ZDriveFile } from '@/types/file';
import { ZDriveFolder } from '@/types/folder';

export default function FilesScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = getStyles(colors);
  const params = useLocalSearchParams<{ createFolder?: string }>();

  const [folders, setFolders] = useState<ZDriveFolder[]>([]);
  const [files, setFiles] = useState<ZDriveFile[]>([]);
  const [searchResults, setSearchResults] = useState<ZDriveFile[] | null>(null);
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
  const [bulkMoveVisible, setBulkMoveVisible] = useState(false);

  // Same, but for folders.
  const [actionFolder, setActionFolder] = useState<ZDriveFolder | null>(null);
  const [renameFolder, setRenameFolder] = useState<ZDriveFolder | null>(null);
  const [renamingFolder, setRenamingFolder] = useState(false);
  const [createFolderVisible, setCreateFolderVisible] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);

  const { uploading, progress, pickAndUpload } = useFileUpload();
  const tabBarHeight = useTabBarHeight();
  const setPreviewFileIds = useFilePreviewStore((state) => state.setFileIds);

  const {
    download,
    share,
    rename,
    move,
    confirmDelete,
    confirmBulkDelete,
    bulkMove,
    bulkShare,
    bulkDownload,
    bulkBusy,
    downloadingId,
    sharingId,
    deletingId,
  } = useFileActions(loadContents);

  const {
    rename: renameFolderAction,
    confirmDelete: confirmDeleteFolder,
    deletingId: deletingFolderId,
  } = useFolderActions(loadContents);

  const {
    selectionMode,
    selectedIds,
    enter: enterSelection,
    toggle: toggleSelection,
    clear: clearSelection,
  } = useMultiSelect();

  // Refresh every time this tab regains focus - not just on first
  // mount - so a rename/move/delete/create or an upload from the
  // Dashboard is reflected here without a manual pull-to-refresh.
  useFocusEffect(
    useCallback(() => {
      loadContents();
    }, []),
  );

  // The Dashboard's "Folder" quick action navigates here with
  // ?createFolder=1 so the create sheet opens immediately instead of
  // making the user find the button themselves. Clear the param
  // straight away (router.setParams, not a ref-based "handled" flag)
  // - the Files tab screen stays mounted across tab switches, so a
  // ref guard would only ever fire once for the app's whole lifetime
  // and silently do nothing on the second, third, etc. tap of the
  // Dashboard action.
  useEffect(() => {
    if (params.createFolder) {
      setCreateFolderVisible(true);
      router.setParams({ createFolder: undefined });
    }
  }, [params.createFolder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim()) {
        setSearchResults(null);
        return;
      }
      searchFiles(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  async function loadContents() {
    try {
      const [folderList, fileList] = await Promise.all([
        foldersService.list(),
        filesService.list(),
      ]);

      setFolders(folderList);
      // GET /files returns every file regardless of folder - there's
      // no backend endpoint for "root files only," so filter for
      // folderId === null client-side to build the root view.
      setFiles(fileList.filter((file) => !file.folderId));
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
      setSearchResults(data);
    } catch (e) {
      console.error(e);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadContents();
  }, []);

  async function handleUpload() {
    const result = await pickAndUpload();

    if (result && result.uploaded.length > 0) {
      await loadContents();
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

  // Selected ids are matched against whichever list is actually on
  // screen right now (search results while searching, root files
  // otherwise) - the ids alone don't carry enough info for the bulk
  // delete/move/share confirmations, which need name/mimeType.
  function getSelectedFiles(): ZDriveFile[] {
    const source = isSearching ? searchResults ?? [] : files;
    return source.filter((file) => selectedIds.has(file.id));
  }

  function handleBulkDelete() {
    confirmBulkDelete(getSelectedFiles(), clearSelection);
  }

  async function handleBulkMove(folderId: string | undefined) {
    await bulkMove(getSelectedFiles(), folderId);
    setBulkMoveVisible(false);
    clearSelection();
  }

  async function handleBulkShare() {
    await bulkShare(getSelectedFiles());
  }

  async function handleBulkDownload() {
    await bulkDownload(getSelectedFiles());
  }

  async function handleConfirmRenameFolder(name: string) {
    if (!renameFolder) return;

    setRenamingFolder(true);
    const ok = await renameFolderAction(renameFolder, name);
    setRenamingFolder(false);

    if (ok) setRenameFolder(null);
  }

  async function handleCreateFolder(name: string) {
    try {
      setCreatingFolder(true);
      await foldersService.create(name);
      setCreateFolderVisible(false);
      await loadContents();
    } catch (error: any) {
      // Leave the sheet open so the user can fix the name and retry.
      Alert.alert(
        'Create Folder Failed',
        error?.response?.data?.message ?? 'Unable to create this folder.',
      );
    } finally {
      setCreatingFolder(false);
    }
  }

  if (loading) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loadingSpinner} />
        <Text style={styles.loading}>Loading files...</Text>
      </Screen>
    );
  }

  const isSearching = searchResults !== null;

  return (
    <Screen edges={['top', 'left', 'right']}>
      {selectionMode ? (
        <SelectionBar
          count={selectedIds.size}
          busy={bulkBusy}
          onCancel={clearSelection}
          onMove={() => setBulkMoveVisible(true)}
          onDownload={handleBulkDownload}
          onShare={handleBulkShare}
          onDelete={handleBulkDelete}
        />
      ) : (
        <View style={styles.header}>
          <Text style={styles.title}>Files</Text>

          <View style={styles.headerActions}>
            <Pressable
              hitSlop={12}
              onPress={() => router.push('/trash')}
              style={styles.newFolderButton}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.text} />
            </Pressable>

            <Pressable
              hitSlop={12}
              onPress={() => setCreateFolderVisible(true)}
              style={styles.newFolderButton}
            >
              <MaterialCommunityIcons name="folder-plus-outline" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </View>
      )}

      <SearchBar value={query} onChangeText={setQuery} />

      <FolderContents
        folders={isSearching ? [] : folders}
        files={isSearching ? searchResults! : files}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onFolderPress={(folder) => router.push(`/folders/${folder.id}`)}
        onFolderLongPress={(folder) => setActionFolder(folder)}
        onFilePress={(file) => {
          // Whichever list is actually visible right now (search
          // results or the normal root list) becomes the swipe order
          // on the preview screen - see filePreview.store.ts.
          const list = isSearching ? searchResults! : files;
          setPreviewFileIds(list.map((f) => f.id));
          router.push(`/files/${file.id}`);
        }}
        onFileLongPress={(file) => enterSelection(file.id)}
        onFileToggleSelect={(file) => toggleSelection(file.id)}
        onFileMenuPress={(file) => setActionFile(file)}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        bottomSpacing={tabBarHeight + 88}
      />

      <UploadFAB onPress={handleUpload} loading={uploading} progress={progress} />

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

      <FolderActionSheet
        folder={actionFolder}
        deleting={actionFolder?.id === deletingFolderId}
        onClose={() => setActionFolder(null)}
        onRename={(folder) => {
          setActionFolder(null);
          setRenameFolder(folder);
        }}
        onDelete={(folder) => {
          setActionFolder(null);
          confirmDeleteFolder(folder);
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

      <TextPromptModal
        visible={!!renameFolder}
        title="Rename Folder"
        initialValue={renameFolder?.name ?? ''}
        confirmLabel="Rename"
        loading={renamingFolder}
        onCancel={() => setRenameFolder(null)}
        onConfirm={handleConfirmRenameFolder}
      />

      <TextPromptModal
        visible={createFolderVisible}
        title="New Folder"
        placeholder="Folder name"
        confirmLabel="Create"
        loading={creatingFolder}
        onCancel={() => setCreateFolderVisible(false)}
        onConfirm={handleCreateFolder}
      />

      <FolderPickerModal
        visible={!!moveFile}
        submitting={moving}
        onCancel={() => setMoveFile(null)}
        onSelect={handleConfirmMove}
      />

      <FolderPickerModal
        visible={bulkMoveVisible}
        submitting={bulkBusy}
        onCancel={() => setBulkMoveVisible(false)}
        onSelect={handleBulkMove}
      />
    </Screen>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      marginBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      letterSpacing: -0.5,
      color: colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 10,
    },
    newFolderButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingSpinner: {
      marginTop: 60,
    },
    loading: {
      marginTop: 16,
      textAlign: 'center',
      color: colors.textSecondary,
    },
  });
}
