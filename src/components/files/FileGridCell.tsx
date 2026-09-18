import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import filesService from '@/services/files.service';
import { GlassTheme, useGlass } from '@/theme/glass';
import { ZDriveFile } from '@/types/file';

interface Props {
  file: ZDriveFile;
  width: number;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
  selectionMode?: boolean;
  selected?: boolean;
}

function formatSize(size: string) {
  const bytes = Number(size) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function icon(mime?: string): keyof typeof MaterialCommunityIcons.glyphMap {
  if (!mime) return 'file-outline';
  if (mime.includes('pdf')) return 'file-pdf-box';
  if (mime.includes('image')) return 'file-image';
  if (mime.includes('video')) return 'file-video';
  if (mime.includes('audio')) return 'file-music';
  if (mime.includes('zip')) return 'folder-zip';
  return 'file-outline';
}

// Grid-mode counterpart to FileCard: a square thumbnail/icon tile with the
// name + size beneath. Fetches its own preview URL for images, same as
// FileCard (the list endpoint doesn't return one).
export default function FileGridCell({
  file,
  width,
  onPress,
  onLongPress,
  onMenuPress,
  selectionMode = false,
  selected = false,
}: Props) {
  const g = useGlass();
  const styles = getStyles(g);
  const isImage = file.mimeType?.startsWith('image/') ?? false;
  const isFlagged = file.moderationStatus === 'FLAGGED';
  const [thumb, setThumb] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage) return;
    let cancelled = false;
    filesService
      .details(file.id)
      .then((d) => {
        if (!cancelled) setThumb(d.previewUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isImage, file.id]);

  return (
    <Pressable
      style={[styles.cell, { width }, selected && styles.selected]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
    >
      <View style={styles.thumbBox}>
        {isImage && thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumb} contentFit="cover" transition={150} />
        ) : (
          <MaterialCommunityIcons name={icon(file.mimeType)} size={34} color={g.accent} />
        )}

        {selectionMode && (
          <View style={[styles.checkbox, selected && styles.checkboxOn]}>
            {selected && <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />}
          </View>
        )}

        {!selectionMode && (
          <Pressable
            style={styles.menu}
            hitSlop={8}
            onPress={(e) => {
              e.stopPropagation();
              onMenuPress?.();
            }}
          >
            <MaterialCommunityIcons name="dots-vertical" size={16} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>{file.name}</Text>
      <Text style={[styles.meta, isFlagged && { color: g.danger }]} numberOfLines={1}>
        {isFlagged ? 'Flagged' : formatSize(file.size)}
      </Text>
    </Pressable>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    cell: { marginBottom: 14 },
    selected: { opacity: 0.9 },
    thumbBox: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 16,
      backgroundColor: g.accentSoft,
      borderWidth: 1,
      borderColor: g.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    thumb: { width: '100%', height: '100%' },
    checkbox: {
      position: 'absolute',
      top: 6,
      left: 6,
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxOn: { backgroundColor: g.accent, borderColor: g.accent },
    menu: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: 'rgba(0,0,0,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: { marginTop: 8, fontSize: 13.5, fontWeight: '600', color: g.text },
    meta: { marginTop: 2, fontSize: 11.5, color: g.textSecondary },
  });
}
