import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import filesService from '@/services/files.service';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { fonts } from '@/theme/typography';
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

function getFormatBadge(name: string, mime?: string): { label: string; color: string } {
  const ext = name.split('.').pop()?.toUpperCase() || '';
  if (mime?.includes('pdf') || ext === 'PDF') return { label: 'PDF', color: '#EF4444' };
  if (mime?.includes('image') || ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'HEIC'].includes(ext)) {
    return { label: ext && ext.length <= 4 ? ext : 'IMG', color: '#FF6A00' };
  }
  if (mime?.includes('video') || ['MP4', 'MOV', 'MKV', 'WEBM', 'AVI'].includes(ext)) {
    return { label: ext && ext.length <= 4 ? ext : 'VID', color: '#8B5CF6' };
  }
  if (mime?.includes('audio') || ['MP3', 'WAV', 'AAC', 'M4A', 'OGG'].includes(ext)) {
    return { label: ext && ext.length <= 4 ? ext : 'AUD', color: '#EC4899' };
  }
  if (mime?.includes('zip') || ['ZIP', 'TAR', 'GZ', '7Z', 'RAR'].includes(ext)) {
    return { label: ext && ext.length <= 4 ? ext : 'ZIP', color: '#F59E0B' };
  }
  if (mime?.includes('text') || ['TXT', 'MD', 'JSON', 'JS', 'TS', 'PY', 'CSV'].includes(ext)) {
    return { label: ext && ext.length <= 4 ? ext : 'TXT', color: '#0EA5E9' };
  }
  return { label: ext && ext.length <= 4 ? ext : 'DOC', color: '#64748B' };
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

export default function FileGridCell({
  file,
  width,
  onPress,
  onLongPress,
  onMenuPress,
  selectionMode = false,
  selected = false,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const isImage = file.mimeType?.startsWith('image/') ?? false;
  const isVideo =
    file.mimeType?.startsWith('video/') ||
    /\.(mp4|mov|mkv|webm|avi|3gp|m4v)$/i.test(file.name);
  const isVisualMedia = isImage || isVideo;
  const isFlagged = file.moderationStatus === 'FLAGGED';
  const [thumb, setThumb] = useState<string | null>(null);
  const badge = getFormatBadge(file.name, file.mimeType);
  const isCompactTile = width < 140;

  useEffect(() => {
    if (!isVisualMedia) return;
    let cancelled = false;
    filesService
      .details(file.id)
      .then((d) => {
        if (!cancelled && d.previewUrl) setThumb(d.previewUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isVisualMedia, file.id]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { width },
        pressed && styles.pressed,
        selected && styles.cardSelected,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
    >
      <View style={[styles.previewBox, isCompactTile && styles.previewBoxCompact]}>
        {thumb ? (
          <>
            <Image
              source={{ uri: thumb }}
              style={styles.thumbImage}
              contentFit="cover"
              transition={150}
            />
            {isVideo && (
              <View style={styles.videoPlayOverlay}>
                <View style={styles.videoPlayPill}>
                  <MaterialCommunityIcons name="play" size={16} color="#FFFFFF" />
                </View>
              </View>
            )}
          </>
        ) : (
          <View style={styles.iconPlaceholder}>
            <MaterialCommunityIcons
              name={icon(file.mimeType)}
              size={isCompactTile ? 28 : 36}
              color={badge.color}
            />
          </View>
        )}

        <View style={[styles.badgeTag, { backgroundColor: badge.color }]}>
          <Text style={styles.badgeText}>{badge.label}</Text>
        </View>

        {selectionMode ? (
          <View style={[styles.checkbox, selected && styles.checkboxOn]}>
            {selected && <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />}
          </View>
        ) : (
          <Pressable
            style={styles.menuBtn}
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

      <View style={styles.infoBox}>
        <Text style={[styles.name, isCompactTile && styles.nameCompact]} numberOfLines={1}>
          {file.name}
        </Text>
        <View style={styles.metaRow}>
          <Text
            style={[
              styles.meta,
              isCompactTile && styles.metaCompact,
              isFlagged && { color: colors.danger },
            ]}
            numberOfLines={1}
          >
            {isFlagged ? 'Flagged' : `${badge.label} • ${formatSize(file.size)}`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 8,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
    cardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    previewBox: {
      width: '100%',
      height: 106,
      borderRadius: 12,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    },
    previewBoxCompact: {
      height: 74,
    },
    thumbImage: {
      width: '100%',
      height: '100%',
    },
    iconPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    videoPlayOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.22)',
    },
    videoPlayPill: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 106, 0, 0.9)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingLeft: 2,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.7)',
    },
    badgeTag: {
      position: 'absolute',
      bottom: 5,
      left: 5,
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 5,
    },
    badgeText: {
      fontSize: 9,
      fontFamily: fonts.bold,
      color: '#FFFFFF',
      letterSpacing: 0.5,
    },
    checkbox: {
      position: 'absolute',
      top: 5,
      left: 5,
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.25)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxOn: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    menuBtn: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(0, 0, 0, 0.38)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoBox: {
      paddingHorizontal: 4,
      paddingTop: 8,
      paddingBottom: 2,
    },
    name: {
      fontSize: 13.5,
      fontFamily: fonts.semiBold,
      color: colors.text,
      letterSpacing: -0.2,
    },
    nameCompact: {
      fontSize: 12,
    },
    metaRow: {
      marginTop: 2,
    },
    meta: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    metaCompact: {
      fontSize: 10,
    },
  });
}
