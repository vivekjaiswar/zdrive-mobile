import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
} from 'react-native';

import Screen from '@/components/Layout/Screen';
import Colors from '@/theme/colors';
import FileCard from '@/components/files/FileCard';
import SearchBar from '@/components/files/SearchBar';
import EmptyFiles from '@/components/files/EmptyFiles';
import UploadFAB from '@/components/files/UploadFAB';
import filesService from '@/services/files.service';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { ZDriveFile } from '@/types/file';

export default function FilesScreen() {
  const [files, setFiles] = useState<ZDriveFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<ZDriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

  const { uploading, pickAndUpload } = useFileUpload();
  const tabBarHeight = useTabBarHeight();

  useEffect(() => {
    loadFiles();
  }, []);

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
            onPress={() => console.log(item.id)}
          />
        )}
        ListEmptyComponent={<EmptyFiles />}
      />

      <UploadFAB onPress={handleUpload} loading={uploading} />
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
