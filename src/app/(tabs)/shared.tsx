import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, Share, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import Screen from '@/components/Layout/Screen';
import SharedFileRow from '@/components/files/SharedFileRow';
import EmptyFiles from '@/components/files/EmptyFiles';
import filesService from '@/services/files.service';
import { WEB_BASE_URL } from '@/services/api';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import Colors from '@/theme/colors';
import { SharedFileEntry } from '@/types/file';

export default function SharedScreen() {
  const router = useRouter();
  const tabBarHeight = useTabBarHeight();

  const [entries, setEntries] = useState<SharedFileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadShared();
    }, []),
  );

  async function loadShared() {
    try {
      const data = await filesService.shared();
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadShared();
  }, []);

  async function handleShareAgain(entry: SharedFileEntry) {
    try {
      setSharingId(entry.id);
      // Already have the token/shareUrl from the list response - no
      // need to call the create-share endpoint again (it would just
      // return the same existing share anyway).
      await Share.share({ message: `${WEB_BASE_URL}${entry.shareUrl}` });
    } finally {
      setSharingId(null);
    }
  }

  function confirmRevoke(entry: SharedFileEntry) {
    Alert.alert(
      'Revoke Share Link?',
      `Anyone with the link to "${entry.file.name}" will lose access.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              setRevokingId(entry.id);
              await filesService.revokeShare(entry.id);
              await loadShared();
            } catch (error: any) {
              Alert.alert(
                'Revoke Failed',
                error?.response?.data?.message ?? 'Unable to revoke this share link.',
              );
            } finally {
              setRevokingId(null);
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loadingSpinner} />
        <Text style={styles.loading}>Loading shared files...</Text>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Shared</Text>

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          entries.length === 0
            ? { flexGrow: 1, justifyContent: 'center', paddingBottom: tabBarHeight + 40 }
            : { paddingBottom: tabBarHeight + 24 }
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => (
          <SharedFileRow
            entry={item}
            sharing={item.id === sharingId}
            revoking={item.id === revokingId}
            onPress={() => router.push(`/files/${item.file.id}`)}
            onShareAgain={() => handleShareAgain(item)}
            onRevoke={() => confirmRevoke(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyFiles
            icon="link-variant"
            title="Nothing Shared Yet"
            subtitle="Files you share from the Files tab will show up here with their link."
          />
        }
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
