import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import Screen from '@/components/Layout/Screen';
import filesService from '@/services/files.service';
import { useFilePreviewStore } from '@/store/filePreview.store';
import { GlassTheme, useGlass } from '@/theme/glass';
import { ZDriveFile } from '@/types/file';

const GAP = 4;
const COLUMNS = 3;

// One grid cell - fetches its own thumbnail (the list endpoint doesn't
// return preview URLs; only details() mints a signed one, same pattern as
// FileCard). Square, cover-cropped, like a native photos grid.
function PhotoCell({
  file,
  size,
  onPress,
}: {
  file: ZDriveFile;
  size: number;
  onPress: () => void;
}) {
  const g = useGlass();
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    filesService
      .details(file.id)
      .then((d) => {
        if (!cancelled) setUri(d.previewUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [file.id]);

  return (
    <Pressable
      onPress={onPress}
      style={{ width: size, height: size, margin: GAP / 2, borderRadius: 12, overflow: 'hidden', backgroundColor: g.accentSoft }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={150} />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="image-outline" size={22} color={g.textFaint} />
        </View>
      )}
    </Pressable>
  );
}

export default function PhotosScreen() {
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);
  const { width } = useWindowDimensions();
  const setPreviewFileIds = useFilePreviewStore((state) => state.setFileIds);

  const [photos, setPhotos] = useState<ZDriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Screen has 24px horizontal padding (Screen container); fit COLUMNS
  // squares with GAP between them.
  const cellSize = (width - 48 - GAP * COLUMNS) / COLUMNS;

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  async function load() {
    try {
      const all = await filesService.list();
      setPhotos(all.filter((f) => f.mimeType?.startsWith('image/')));
    } catch (e: any) {
      console.error('Failed to load photos:', e?.message ?? 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, []);

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={g.accent} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={g.text} />
        </Pressable>
        <Text style={styles.title}>Photos</Text>
        <View style={{ width: 26 }} />
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={COLUMNS}
        contentContainerStyle={
          photos.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : { paddingBottom: 40 }
        }
        columnWrapperStyle={{ marginHorizontal: -GAP / 2 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={g.accent} />
        }
        renderItem={({ item }) => (
          <PhotoCell
            file={item}
            size={cellSize}
            onPress={() => {
              setPreviewFileIds(photos.map((p) => p.id));
              router.push(`/files/${item.id}`);
            }}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="image-multiple-outline" size={48} color={g.textFaint} />
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySub}>Images you upload will appear here.</Text>
          </View>
        }
      />
    </Screen>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    title: { fontSize: 18, fontWeight: '700', color: g.text },
    empty: { alignItems: 'center', gap: 6 },
    emptyText: { marginTop: 12, fontSize: 16, fontWeight: '700', color: g.text },
    emptySub: { fontSize: 13.5, color: g.textSecondary },
  });
}
