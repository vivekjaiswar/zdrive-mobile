import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Screen from '@/components/Layout/Screen';
import TrashFileRow from '@/components/files/TrashFileRow';
import EmptyFiles from '@/components/files/EmptyFiles';
import filesService from '@/services/files.service';
import { useFileActions } from '@/hooks/useFileActions';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { ZDriveFile } from '@/types/file';

export default function TrashScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = getStyles(colors);

  const [files, setFiles] = useState<ZDriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const {
    restore,
    confirmPermanentDelete,
    restoringId,
    permanentlyDeletingId,
  } = useFileActions(loadTrash);

  useFocusEffect(
    useCallback(() => {
      loadTrash();
    }, []),
  );

  async function loadTrash() {
    try {
      const data = await filesService.trash();
      setFiles(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTrash();
  }, []);

  if (loading) {
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
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text} />
        </Pressable>

        <Text style={styles.topBarTitle}>Trash</Text>

        <View style={{ width: 26 }} />
      </View>

      {files.length > 0 && (
        <Text style={styles.notice}>
          Items in trash can be restored or deleted forever. Nothing
          here is automatically emptied yet.
        </Text>
      )}

      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={
          files.length === 0
            ? { flexGrow: 1, justifyContent: 'center' }
            : { paddingBottom: 40 }
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <TrashFileRow
            file={item}
            restoring={item.id === restoringId}
            deleting={item.id === permanentlyDeletingId}
            onRestore={() => restore(item)}
            onDeleteForever={() => confirmPermanentDelete(item)}
          />
        )}
        ListEmptyComponent={
          <EmptyFiles
            icon="trash-can-outline"
            title="Trash is Empty"
            subtitle="Files you delete will show up here until you restore or permanently delete them."
          />
        }
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
      justifyContent: 'space-between',
      paddingVertical: 12,
    },

    topBarTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },

    notice: {
      marginTop: 8,
      marginBottom: 12,
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },

    list: {
      marginTop: 4,
    },
  });
}
