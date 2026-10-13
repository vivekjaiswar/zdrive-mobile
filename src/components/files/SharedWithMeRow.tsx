import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { SharedWithMeFile } from '@/types/file';
import { SharedWithMeFolder } from '@/types/folder';

interface Props {
  item: (SharedWithMeFile & { type: 'file' }) | (SharedWithMeFolder & { type: 'folder'; size?: string });
  onPress: () => void;
}

function formatSize(size?: string) {
  if (!size) return '';
  const bytes = Number(size) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default function SharedWithMeRow({ item, onPress }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const isFolder = item.type === 'folder';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={[styles.icon, isFolder && styles.folderIcon]}>
        <MaterialCommunityIcons
          name={isFolder ? 'folder-account-outline' : 'file-account-outline'}
          size={24}
          color={isFolder ? '#F59E0B' : colors.primary}
        />
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          By {item.ownerEmail} · {isFolder ? 'Folder' : formatSize(item.size)}
        </Text>
      </View>

      <View style={[styles.badge, item.role === 'EDITOR' ? styles.editorBadge : styles.viewerBadge]}>
        <Text style={[styles.badgeText, item.role === 'EDITOR' ? styles.editorBadgeText : styles.viewerBadgeText]}>
          {item.role}
        </Text>
      </View>
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
    pressed: {
      opacity: 0.85,
    },
    icon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    folderIcon: {
      backgroundColor: 'rgba(245, 158, 11, 0.15)',
    },
    content: {
      flex: 1,
      marginLeft: 14,
      marginRight: 8,
    },
    name: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    meta: {
      marginTop: 3,
      fontSize: 12,
      color: colors.textSecondary,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    editorBadge: {
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    viewerBadge: {
      backgroundColor: colors.surfaceAlt,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    editorBadgeText: {
      color: '#10B981',
    },
    viewerBadgeText: {
      color: colors.textSecondary,
    },
  });
}
