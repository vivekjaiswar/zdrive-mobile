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
  onPress: () => void;
  onLongPress?: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onMenuPress?: () => void;
}

function formatSize(size: string) {
  const bytes = Number(size) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getFormatBadge(name: string, mime?: string): { label: string; color: string } {
  const ext = name.split('.').pop()?.toUpperCase() || '';
  if (mime?.includes('pdf') || ext === 'PDF') return { label: 'PDF', color: '#EF4444' };
  if (mime?.includes('image') || ['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF'].includes(ext)) {
    return { label: ext && ext.length <= 4 ? ext : 'IMG', color: '#FF6A00' };
  }
  if (mime?.includes('video') || ['MP4', 'MOV', 'MKV'].includes(ext)) {
    return { label: ext && ext.length <= 4 ? ext : 'VID', color: '#8B5CF6' };
  }
  if (mime?.includes('audio') || ['MP3', 'WAV', 'AAC', 'M4A'].includes(ext)) {
    return { label: ext && ext.length <= 4 ? ext : 'AUD', color: '#EC4899' };
  }
  if (mime?.includes('zip') || ['ZIP', 'TAR', 'GZ', '7Z', 'RAR'].includes(ext)) {
    return { label: ext && ext.length <= 4 ? ext : 'ZIP', color: '#F59E0B' };
  }
  if (mime?.includes('text') || ['TXT', 'MD', 'JSON', 'JS', 'TS', 'PY'].includes(ext)) {
    return { label: ext && ext.length <= 4 ? ext : 'TXT', color: '#0EA5E9' };
  }
  return { label: ext && ext.length <= 4 ? ext : 'DOC', color: '#64748B' };
}

function icon(mime?: string) {
  if (!mime) return 'file-outline';
  if (mime.includes('pdf')) return 'file-pdf-box';
  if (mime.includes('image')) return 'file-image';
  if (mime.includes('video')) return 'file-video';
  if (mime.includes('audio')) return 'file-music';
  if (mime.includes('zip')) return 'folder-zip';
  return 'file-outline';
}

export default function FileCard({
  file,
  onPress,
  onLongPress,
  selectionMode = false,
  selected = false,
  onMenuPress,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  const isImage = file.mimeType?.startsWith('image/') ?? false;
  const isVideo =
    file.mimeType?.startsWith('video/') ||
    /\.(mp4|mov|mkv|webm|avi|3gp|m4v)$/i.test(file.name);
  const isVisualMedia = isImage || isVideo;
  const isFlagged = file.moderationStatus === 'FLAGGED';
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const badge = getFormatBadge(file.name, file.mimeType);

  useEffect(() => {
    if (!isVisualMedia) return;

    let cancelled = false;

    filesService
      .details(file.id)
      .then((details) => {
        if (!cancelled && details.previewUrl) setThumbUrl(details.previewUrl);
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
        pressed && styles.pressed,
        selected && styles.cardSelected,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
    >
      <View style={styles.icon}>
        {thumbUrl ? (
          <View style={StyleSheet.absoluteFill}>
            <Image
              source={{ uri: thumbUrl }}
              style={styles.thumbnail}
              contentFit="cover"
              transition={150}
            />
            {isVideo && (
              <View style={styles.videoPlayOverlay}>
                <View style={styles.videoPlayPill}>
                  <MaterialCommunityIcons name="play" size={12} color="#FFFFFF" />
                </View>
              </View>
            )}
          </View>
        ) : (
          <MaterialCommunityIcons name={icon(file.mimeType) as any} size={24} color={badge.color} />
        )}

        {/* Checkbox overlays thumbnail when in selection mode */}
        {selectionMode && (
          <View style={[styles.checkboxBadge, selected && styles.checkboxChecked]}>
            {selected && (
              <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
            )}
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>{file.name}</Text>
        {isFlagged ? (
          <View style={styles.flaggedRow}>
            <MaterialCommunityIcons name="alert-circle-outline" size={13} color={colors.danger} />
            <Text style={styles.flaggedText}>Flagged · sharing disabled</Text>
          </View>
        ) : (
          <View style={styles.metaRow}>
            <View style={[styles.formatPill, { backgroundColor: badge.color + '18' }]}>
              <Text style={[styles.formatText, { color: badge.color }]}>{badge.label}</Text>
            </View>
            <Text style={styles.meta}>{badge.label} • {formatSize(file.size)}</Text>
            {Boolean(file.createdAt) && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.meta}>{formatDate(file.createdAt)}</Text>
              </>
            )}
          </View>
        )}
      </View>

      {selectionMode ? null : (
        <Pressable
          hitSlop={12}
          onPress={(e) => {
            e.stopPropagation();
            onMenuPress?.();
          }}
        >
          <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.textSecondary} />
        </Pressable>
      )}
    </Pressable>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 14,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.85 },
    cardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    icon: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    thumbnail: {
      width: '100%',
      height: '100%',
    },
    videoPlayOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.22)',
    },
    videoPlayPill: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: 'rgba(255, 106, 0, 0.90)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxBadge: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      backgroundColor: 'rgba(255,255,255,0.35)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    content: { flex: 1, marginLeft: 14 },
    name: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
      letterSpacing: -0.2,
    },
    metaRow: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    formatPill: {
      paddingHorizontal: 6,
      paddingVertical: 1.5,
      borderRadius: 6,
    },
    formatText: {
      fontSize: 10,
      fontFamily: fonts.bold,
      letterSpacing: 0.5,
    },
    meta: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    metaDot: {
      fontSize: 11,
      color: colors.textSecondary,
      opacity: 0.6,
    },
    flaggedRow: {
      marginTop: 3,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    flaggedText: {
      fontSize: 12,
      fontFamily: fonts.semiBold,
      color: colors.danger,
    },
  });
}
