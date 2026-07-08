import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Colors from '@/theme/colors';
import FileCard from '@/components/files/FileCard';
import SearchBar from '@/components/files/SearchBar';
import EmptyFiles from '@/components/files/EmptyFiles';
import UploadFAB from '@/components/files/UploadFAB';
import filesService from '@/services/files.service';
import { ZDriveFile } from '@/types/file';

export default function FilesScreen() {
  const [files, setFiles] = useState<ZDriveFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<ZDriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');

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

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loading}>Loading files...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Files</Text>

      <SearchBar value={query} onChangeText={setQuery} />

      <FlatList
        data={filteredFiles}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 20 }}
        contentContainerStyle={
          filteredFiles.length === 0
            ? { flexGrow: 1, justifyContent: 'center', paddingBottom: 100 }
            : { paddingBottom: 100 }
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

      <UploadFAB onPress={() => console.log('Upload')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FF',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F8FF',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
  loading: {
    marginTop: 16,
    color: Colors.textSecondary,
  },
});
