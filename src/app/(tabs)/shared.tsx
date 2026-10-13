import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import Screen from '@/components/Layout/Screen';
import ListSkeleton from '@/components/common/ListSkeleton';
import SharedFileRow from '@/components/files/SharedFileRow';
import SharedWithMeRow from '@/components/files/SharedWithMeRow';
import EmptyFiles from '@/components/files/EmptyFiles';
import filesService from '@/services/files.service';
import foldersService from '@/services/folders.service';
import { WEB_BASE_URL } from '@/services/api';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useTabBarScrollHandler } from '@/hooks/useTabBarScroll';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { SharedFileEntry, SharedWithMeFile } from '@/types/file';
import { SharedWithMeFolder } from '@/types/folder';

type ActiveTab = 'links' | 'with-me';
type SharedWithMeItem =
  | (SharedWithMeFile & { type: 'file' })
  | (SharedWithMeFolder & { type: 'folder'; size?: string });

export default function SharedScreen() {
  const router = useRouter();
  const tabBarHeight = useTabBarHeight();
  const onScroll = useTabBarScrollHandler();
  const colors = useColors();
  const styles = getStyles(colors);

  const [activeTab, setActiveTab] = useState<ActiveTab>('links');
  const [entries, setEntries] = useState<SharedFileEntry[]>([]);
  const [withMeItems, setWithMeItems] = useState<SharedWithMeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [activeTab]),
  );

  async function loadData() {
    try {
      if (activeTab === 'links') {
        const data = await filesService.shared();
        setEntries(data);
      } else {
        const [files, folders] = await Promise.all([
          filesService.sharedWithMe().catch(() => []),
          foldersService.sharedWithMe().catch(() => []),
        ]);
        const formattedFiles: SharedWithMeItem[] = files.map((f) => ({ ...f, type: 'file' }));
        const formattedFolders: SharedWithMeItem[] = folders.map((f) => ({ ...f, type: 'folder' }));
        setWithMeItems([...formattedFolders, ...formattedFiles]);
      }
    } catch (e: any) {
      console.error('Failed to load shared items:', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [activeTab]);

  async function handleShareAgain(entry: SharedFileEntry) {
    try {
      setSharingId(entry.id);
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
              await loadData();
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
        <ListSkeleton count={5} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Text style={styles.title}>Shared</Text>

      {/* Segment Switcher */}
      <View style={styles.segmentContainer}>
        <Pressable
          style={[styles.segmentButton, activeTab === 'links' && styles.segmentActive]}
          onPress={() => {
            if (activeTab !== 'links') {
              setActiveTab('links');
              setLoading(true);
            }
          }}
        >
          <Text style={[styles.segmentText, activeTab === 'links' && styles.segmentTextActive]}>
            Public Links
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentButton, activeTab === 'with-me' && styles.segmentActive]}
          onPress={() => {
            if (activeTab !== 'with-me') {
              setActiveTab('with-me');
              setLoading(true);
            }
          }}
        >
          <Text style={[styles.segmentText, activeTab === 'with-me' && styles.segmentTextActive]}>
            Shared With Me
          </Text>
        </Pressable>
      </View>

      {activeTab === 'links' ? (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={
            entries.length === 0
              ? { flexGrow: 1, justifyContent: 'center', paddingBottom: tabBarHeight + 40 }
              : { paddingBottom: tabBarHeight + 24 }
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
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
              subtitle="Files you share with a link will appear here."
            />
          }
        />
      ) : (
        <FlatList
          data={withMeItems}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={
            withMeItems.length === 0
              ? { flexGrow: 1, justifyContent: 'center', paddingBottom: tabBarHeight + 40 }
              : { paddingBottom: tabBarHeight + 24 }
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <SharedWithMeRow
              item={item}
              onPress={() => {
                if (item.type === 'folder') {
                  router.push(`/folders/${item.id}`);
                } else {
                  router.push(`/files/${item.id}`);
                }
              }}
            />
          )}
          ListEmptyComponent={
            <EmptyFiles
              icon="account-group-outline"
              title="Nothing Shared With You"
              subtitle="Files and folders other users share with your account will appear here."
            />
          }
        />
      )}
    </Screen>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    title: {
      fontSize: 32,
      fontWeight: '800',
      color: colors.text,
      marginTop: 12,
      marginBottom: 16,
    },
    segmentContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14,
      padding: 4,
      marginBottom: 16,
    },
    segmentButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
    },
    segmentActive: {
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    segmentTextActive: {
      color: colors.text,
      fontWeight: '700',
    },
  });
}
