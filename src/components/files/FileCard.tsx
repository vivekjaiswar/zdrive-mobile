import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import filesService from '@/services/files.service';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { ZDriveFile } from '@/types/file';

interface Props {
  file: ZDriveFile;
  onPress: () => void;
  onLongPress?: () => void;
  // Long-press elsewhere in the list already entered selection mode -
  // shows a checkbox instead of the file-type icon and swaps the tap
  // behavior to "toggle selection" (handled by the parent's onPress).
  selectionMode?: boolean;
  selected?: boolean;
  // Selection mode hides this row's own kebab menu (no per-item
  // actions while bulk-selecting), so this is only ever called when
  // selectionMode is false.
  onMenuPress?: () => void;
}

function formatSize(size: string) {
  const bytes = Number(size) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
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
  const isFlagged = file.moderationStatus === 'FLAGGED';
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  // The list endpoint (GET /files, /folders/:id/explorer) doesn't return
  // a preview URL - only the single-file details() call does (it mints a
  // short-lived signed content ticket - see files.service.ts). So each
  // image row fetches its own thumbnail URL individually on mount.
  // Known limitation: a folder with many images means one extra request
  // per image row, all firing roughly at once when the list first
  // renders - fine at the scale this app runs at today, but a real
  // per-row network cost worth revisiting (e.g. a batched thumbnail
  // endpoint) if folders start regularly holding dozens of photos.
  useEffect(() => {
    if (!isImage) return;

    let cancelled = false;

    filesService
      .details(file.id)
      .then((details) => {
        if (!cancelled) setThumbUrl(details.previewUrl);
      })
      .catch(() => {
        // Silent - falls back to the generic file-type icon below,
        // no need to surface a thumbnail-load failure to the user.
      });

    return () => {
      cancelled = true;
    };
  }, [isImage, file.id]);

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
        {isImage && thumbUrl ? (
          <Image
            source={{ uri: thumbUrl }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <MaterialCommunityIcons name={icon(file.mimeType) as any} size={24} color={colors.primary} />
        )}

        {/* Checkbox overlays the thumbnail/icon instead of replacing
            it, so image thumbnails stay visible while multi-selecting
            (matches the Photos-app pattern of a small corner badge). */}
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
          <Text style={styles.meta}>{formatSize(file.size)}</Text>
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
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    thumbnail: {
      width: '100%',
      height: '100%',
    },
    // Small corner badge overlaid on top of the thumbnail/icon during
    // selection mode - deliberately does NOT replace the thumbnail
    // (that was the bug: image previews used to vanish behind a
    // full-size checkbox as soon as you started multi-selecting).
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
    name: { fontSize: 15, fontWeight: '600', color: colors.text },
    meta: { marginTop: 3, fontSize: 12.5, color: colors.textSecondary },
    flaggedRow: {
      marginTop: 3,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    flaggedText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.danger,
    },
  });
}
