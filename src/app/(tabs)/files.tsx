import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Screen from '@/components/Layout/Screen';
import ListSkeleton from '@/components/common/ListSkeleton';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import SearchBar from '@/components/files/SearchBar';
import UploadFAB from '@/components/files/UploadFAB';
import FileActionSheet from '@/components/files/FileActionSheet';
import TextPromptModal from '@/components/common/TextPromptModal';
import FolderPickerModal from '@/components/files/FolderPickerModal';
import FolderContents, { SortKey, SortDir } from '@/components/folders/FolderContents';
import FolderActionSheet from '@/components/folders/FolderActionSheet';
import SelectionBar from '@/components/files/SelectionBar';
import filesService from '@/services/files.service';
import foldersService from '@/services/folders.service';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useFileActions } from '@/hooks/useFileActions';
import { useFolderActions } from '@/hooks/useFolderActions';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useTabBarScrollHandler } from '@/hooks/useTabBarScroll';
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
  // 'keyword' = substring filename match (GET /files/search); 'smart' =
  // AI semantic search across image content + PDF text (the two new
  // backend endpoints), results merged into one list.
  const [searchMode, setSearchMode] = useState<'keyword' | 'smart'>('keyword');
  const [searching, setSearching] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'tile'>('grid');

  // Tapping a sort chip: switch to that key (default ascending), or flip
  // direction if it's already the active key.
  function chooseSort(key: SortKey) {
    if (key === sortBy) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  }

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

  const { uploading, progress, pickAndUpload, pickPhotosAndUpload } = useFileUpload();
  const tabBarHeight = useTabBarHeight();
  const onScroll = useTabBarScrollHandler();
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
    downloadFolderZip,
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

  // Re-runs when the query OR the mode changes, so toggling Keyword/Smart
  // with text already entered re-searches immediately.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim()) {
        setSearchResults(null);
        return;
      }
      searchFiles(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchMode]);

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
    } catch (e: any) {
      console.error('Failed to load files/folders:', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function searchFiles(text: string) {
    try {
      setSearching(true);

      if (searchMode === 'keyword') {
        setSearchResults(await filesService.search(text));
        return;
      }

      // Smart search: the backend keeps image and document semantic
      // search as two separate endpoints (different embedding models
      // that can't be ranked on one scale), so run both and concatenate
      // - images first, then documents - deduping by id rather than
      // claiming a single unified relevance order across the two.
      const [images, documents] = await Promise.all([
        filesService.searchSemantic(text),
        filesService.searchSemanticDocuments(text),
      ]);

      const seen = new Set<string>();
      const merged: ZDriveFile[] = [];
      for (const file of [...images, ...documents]) {
        if (seen.has(file.id)) continue;
        seen.add(file.id);
        merged.push(file);
      }
      setSearchResults(merged);
    } catch (e: any) {
      console.error('Search failed:', e?.message ?? 'Unknown error');
      // Surface an empty result set rather than leaving stale results
      // from a previous query/mode on screen after a failure.
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadContents();
  }, []);

  function handleUpload() {
    Alert.alert('Upload', 'Choose a source', [
      {
        text: 'Photos',
        onPress: async () => {
          const result = await pickPhotosAndUpload();
          if (result && result.uploaded.length > 0) await loadContents();
        },
      },
      {
        text: 'Files',
        onPress: async () => {
          const result = await pickAndUpload();
          if (result && result.uploaded.length > 0) await loadContents();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
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
        <ListSkeleton count={6} showSearchBar />
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

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={
          searchMode === 'smart'
            ? "Describe it — 'beach photos', 'invoice'…"
            : 'Search files, or try Smart search'
        }
      />

      {isSearching && (
        <View style={styles.searchModeRow}>
          {(['keyword', 'smart'] as const).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setSearchMode(mode)}
              style={[
                styles.searchModePill,
                searchMode === mode && styles.searchModePillActive,
              ]}
            >
              <MaterialCommunityIcons
                name={mode === 'smart' ? 'star-four-points-outline' : 'magnify'}
                size={14}
                color={searchMode === mode ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.searchModeText,
                  searchMode === mode && styles.searchModeTextActive,
                ]}
              >
                {mode === 'smart' ? 'Smart' : 'Keyword'}
              </Text>
            </Pressable>
          ))}

          {searching && (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.searchSpinner}
            />
          )}
        </View>
      )}

      {isSearching && searchMode === 'smart' && (
        <Text style={styles.smartHint}>
          AI search finds photos and document contents by meaning — not just
          file names.
        </Text>
      )}

      {!isSearching && (
        <View style={styles.searchModeRow}>
          {(['name', 'date', 'size'] as const).map((key) => {
            const active = sortBy === key;
            return (
              <Pressable
                key={key}
                onPress={() => chooseSort(key)}
                style={[styles.searchModePill, active && styles.searchModePillActive]}
              >
                <Text
                  style={[styles.searchModeText, active && styles.searchModeTextActive]}
                >
                  {key === 'name' ? 'Name' : key === 'date' ? 'Date' : 'Size'}
                </Text>
                {active && (
                  <MaterialCommunityIcons
                    name={sortDir === 'asc' ? 'arrow-up' : 'arrow-down'}
                    size={13}
                    color="#FFFFFF"
                  />
                )}
              </Pressable>
            );
          })}

          <View style={{ flex: 1 }} />

          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['grid', 'list', 'tile'] as const).map((mode) => {
              const active = viewMode === mode;
              const iconName =
                mode === 'grid'
                  ? 'view-grid-outline'
                  : mode === 'list'
                    ? 'format-list-bulleted'
                    : 'view-module-outline';
              return (
                <Pressable
                  key={mode}
                  hitSlop={6}
                  onPress={() => setViewMode(mode)}
                  style={[
                    styles.viewToggle,
                    active && { backgroundColor: colors.primary },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={iconName}
                    size={18}
                    color={active ? '#FFFFFF' : colors.primary}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <FolderContents
        folders={isSearching ? [] : folders}
        files={isSearching ? searchResults! : files}
        sortBy={sortBy}
        sortDir={sortDir}
        viewMode={viewMode}
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
        onScroll={onScroll}
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
        downloadingZip={bulkBusy}
        onClose={() => setActionFolder(null)}
        onDownloadZip={(folder) => {
          setActionFolder(null);
          downloadFolderZip(folder);
        }}
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
    searchModeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },
    searchModePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchModePillActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    searchModeText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    searchModeTextActive: {
      color: '#FFFFFF',
    },
    searchSpinner: {
      marginLeft: 'auto',
    },
    viewToggle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    smartHint: {
      marginTop: 8,
      fontSize: 12,
      lineHeight: 17,
      color: colors.textSecondary,
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
