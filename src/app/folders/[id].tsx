import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Screen from '@/components/Layout/Screen';
import UploadFAB from '@/components/files/UploadFAB';
import FileActionSheet from '@/components/files/FileActionSheet';
import TextPromptModal from '@/components/common/TextPromptModal';
import FolderPickerModal from '@/components/files/FolderPickerModal';
import FolderContents from '@/components/folders/FolderContents';
import FolderActionSheet from '@/components/folders/FolderActionSheet';
import SelectionBar from '@/components/files/SelectionBar';
import foldersService from '@/services/folders.service';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useFileActions } from '@/hooks/useFileActions';
import { useFolderActions } from '@/hooks/useFolderActions';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { ZDriveFile } from '@/types/file';
import { ZDriveFolder } from '@/types/folder';

export default function FolderExplorerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const styles = getStyles(colors);

  const [folder, setFolder] = useState<ZDriveFolder | null>(null);
  const [childFolders, setChildFolders] = useState<ZDriveFolder[]>([]);
  const [files, setFiles] = useState<ZDriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [actionFile, setActionFile] = useState<ZDriveFile | null>(null);
  const [renameFile, setRenameFile] = useState<ZDriveFile | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [moveFile, setMoveFile] = useState<ZDriveFile | null>(null);
  const [moving, setMoving] = useState(false);
  const [bulkMoveVisible, setBulkMoveVisible] = useState(false);

  const [actionChildFolder, setActionChildFolder] = useState<ZDriveFolder | null>(null);
  const [renameChildFolder, setRenameChildFolder] = useState<ZDriveFolder | null>(null);
  const [renamingChildFolder, setRenamingChildFolder] = useState(false);
  const [createFolderVisible, setCreateFolderVisible] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Menu for the folder currently being viewed (not a child row). Its
  // Rename action reuses the renameChildFolder modal state below -
  // renameFolderAction() works on any folder object, current or
  // child, so there's no need for a separate modal/state pair.
  const [showCurrentFolderMenu, setShowCurrentFolderMenu] = useState(false);

  const { uploading, progress, pickAndUpload } = useFileUpload();

  const {
    download,
    share,
    rename,
    move,
    confirmDelete,
    confirmBulkDelete,
    bulkMove,
    bulkShare,
    bulkBusy,
    downloadingId,
    sharingId,
    deletingId,
  } = useFileActions(loadExplorer);

  const {
    rename: renameFolderAction,
    confirmDelete: confirmDeleteFolder,
    deletingId: deletingFolderId,
  } = useFolderActions(loadExplorer);

  const {
    selectionMode,
    selectedIds,
    enter: enterSelection,
    toggle: toggleSelection,
    clear: clearSelection,
  } = useMultiSelect();

  useFocusEffect(
    useCallback(() => {
      loadExplorer();
    }, [id]),
  );

  async function loadExplorer() {
    if (!id) return;

    try {
      const data = await foldersService.explorer(id);
      setFolder(data.folder);
      setChildFolders(data.folders);
      setFiles(data.files);
    } catch (error: any) {
      Alert.alert(
        'Unable to load folder',
        error?.response?.data?.message ?? 'This folder may have been removed.',
      );
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadExplorer();
  }, [id]);

  async function handleUpload() {
    if (!id) return;

    const result = await pickAndUpload(id);

    if (result && result.uploaded.length > 0) {
      await loadExplorer();
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

  function getSelectedFiles(): ZDriveFile[] {
    return files.filter((file) => selectedIds.has(file.id));
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

  async function handleConfirmRenameChildFolder(name: string) {
    if (!renameChildFolder) return;

    setRenamingChildFolder(true);
    const ok = await renameFolderAction(renameChildFolder, name);
    setRenamingChildFolder(false);

    if (ok) setRenameChildFolder(null);
  }

  async function handleCreateFolder(name: string) {
    if (!id) return;

    try {
      setCreatingFolder(true);
      await foldersService.create(name, id);
      setCreateFolderVisible(false);
      await loadExplorer();
    } catch (error: any) {
      Alert.alert(
        'Create Folder Failed',
        error?.response?.data?.message ?? 'Unable to create this folder.',
      );
    } finally {
      setCreatingFolder(false);
    }
  }

  function handleDeleteCurrentFolder() {
    if (!folder) return;

    setShowCurrentFolderMenu(false);

    // Not reusing useFolderActions.confirmDelete here: that hook's
    // onChanged fires-and-forgets into loadExplorer(), but there's
    // nothing to reload once this folder itself is gone - we need to
    // know the delete actually succeeded before navigating back,
    // otherwise a "folder not empty" rejection would strand the user
    // on a screen for a folder that (correctly) still exists.
    Alert.alert(
      'Delete Folder?',
      `"${folder.name}" will be permanently deleted. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await foldersService.delete(folder.id);
              router.back();
            } catch (error: any) {
              Alert.alert(
                'Delete Failed',
                error?.response?.data?.message ??
                  'Unable to delete this folder.',
              );
            }
          },
        },
      ],
    );
  }

  if (loading || !folder) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {selectionMode ? (
        <SelectionBar
          count={selectedIds.size}
          busy={bulkBusy}
          onCancel={clearSelection}
          onMove={() => setBulkMoveVisible(true)}
          onShare={handleBulkShare}
          onDelete={handleBulkDelete}
        />
      ) : (
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text} />
          </Pressable>

          <Text style={styles.topBarTitle} numberOfLines={1}>
            {folder.name}
          </Text>

          <View style={styles.headerActions}>
            <Pressable hitSlop={10} onPress={() => setCreateFolderVisible(true)}>
              <MaterialCommunityIcons name="folder-plus-outline" size={24} color={colors.primary} />
            </Pressable>

            <Pressable hitSlop={10} onPress={() => setShowCurrentFolderMenu(true)}>
              <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>
      )}

      <FolderContents
        folders={childFolders}
        files={files}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onFolderPress={(child) => router.push(`/folders/${child.id}`)}
        onFolderLongPress={(child) => setActionChildFolder(child)}
        onFilePress={(file) => router.push(`/files/${file.id}`)}
        onFileLongPress={(file) => enterSelection(file.id)}
        onFileToggleSelect={(file) => toggleSelection(file.id)}
        onFileMenuPress={(file) => setActionFile(file)}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        bottomSpacing={112}
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
        folder={actionChildFolder}
        deleting={actionChildFolder?.id === deletingFolderId}
        onClose={() => setActionChildFolder(null)}
        onRename={(child) => {
          setActionChildFolder(null);
          setRenameChildFolder(child);
        }}
        onDelete={(child) => {
          setActionChildFolder(null);
          confirmDeleteFolder(child);
        }}
      />

      <FolderActionSheet
        folder={showCurrentFolderMenu ? folder : null}
        deleting={folder.id === deletingFolderId}
        onClose={() => setShowCurrentFolderMenu(false)}
        onRename={() => {
          // Reuse the same rename sheet, pre-filled for this folder.
          setShowCurrentFolderMenu(false);
          setRenameChildFolder(folder);
        }}
        onDelete={handleDeleteCurrentFolder}
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
        visible={!!renameChildFolder}
        title="Rename Folder"
        initialValue={renameChildFolder?.name ?? ''}
        confirmLabel="Rename"
        loading={renamingChildFolder}
        onCancel={() => setRenameChildFolder(null)}
        onConfirm={handleConfirmRenameChildFolder}
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
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 12,
    },

    topBarTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: -0.3,
      color: colors.text,
    },

    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
  });
}
