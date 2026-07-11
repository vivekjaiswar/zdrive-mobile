import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
        {selectionMode ? (
          <View style={[styles.checkbox, selected && styles.checkboxChecked]}>
            {selected && (
              <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
            )}
          </View>
        ) : (
          <MaterialCommunityIcons name={icon(file.mimeType) as any} size={24} color={colors.primary} />
        )}
      </View>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>{file.name}</Text>
        <Text style={styles.meta}>{formatSize(file.size)}</Text>
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
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
    },
    content: { flex: 1, marginLeft: 14 },
    name: { fontSize: 15, fontWeight: '600', color: colors.text },
    meta: { marginTop: 3, fontSize: 12.5, color: colors.textSecondary },
  });
}
