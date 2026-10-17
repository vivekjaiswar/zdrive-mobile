import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { fonts } from '@/theme/typography';
import { ZDriveFolder } from '@/types/folder';

interface Props {
  folder: ZDriveFolder;
  itemCount?: number;
  totalBytes?: number;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
  variant?: 'grid' | 'list';
  width?: number;
}

function formatSize(bytes?: number | string): string {
  const n = Number(bytes) || 0;
  if (n === 0) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default function FolderCard({
  folder,
  itemCount,
  totalBytes,
  onPress,
  onLongPress,
  onMenuPress,
  variant = 'grid',
  width,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  const itemsText =
    itemCount !== undefined
      ? itemCount === 0
        ? 'Empty • 0 B'
        : `${itemCount} ${itemCount === 1 ? 'item' : 'items'} • ${formatSize(totalBytes)}`
      : 'Folder';

  if (variant === 'list') {
    return (
      <Pressable
        style={({ pressed }) => [styles.listCard, pressed && styles.pressed]}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
      >
        <View style={styles.listIconWrap}>
          <MaterialCommunityIcons name="folder" size={26} color="#FF6A00" />
        </View>

        <View style={styles.listTextWrap}>
          <Text numberOfLines={1} style={styles.listName}>
            {folder.name}
          </Text>
          <View style={styles.listMetaRow}>
            <View style={styles.folderBadge}>
              <Text style={styles.folderBadgeText}>DIR</Text>
            </View>
            <Text style={styles.listMeta}>{itemsText}</Text>
          </View>
        </View>

        <Pressable
          style={styles.menuBtn}
          hitSlop={12}
          onPress={(e) => {
            e.stopPropagation();
            onMenuPress ? onMenuPress() : onLongPress?.();
          }}
        >
          <MaterialCommunityIcons
            name="dots-vertical"
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
      </Pressable>
    );
  }

  // Grid variant: 2-column modern tile
  return (
    <Pressable
      style={({ pressed }) => [
        styles.gridCard,
        width ? { width } : { width: '48.5%' },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
    >
      <View style={styles.gridTopRow}>
        <View style={styles.gridIconWrap}>
          <MaterialCommunityIcons name="folder" size={22} color="#FF6A00" />
        </View>

        <Pressable
          style={styles.gridMenuBtn}
          hitSlop={10}
          onPress={(e) => {
            e.stopPropagation();
            onMenuPress ? onMenuPress() : onLongPress?.();
          }}
        >
          <MaterialCommunityIcons
            name="dots-vertical"
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      <Text numberOfLines={1} style={styles.gridName}>
        {folder.name}
      </Text>

      <View style={styles.gridMetaRow}>
        <View style={styles.folderBadge}>
          <Text style={styles.folderBadgeText}>DIR</Text>
        </View>
        <Text numberOfLines={1} style={styles.gridMeta}>
          {itemCount !== undefined
            ? itemCount === 0
              ? '0 items • 0 B'
              : `${itemCount} items • ${formatSize(totalBytes)}`
            : 'Folder'}
        </Text>
      </View>
    </Pressable>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },

    // Grid Tile Styles
    gridCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 13,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    gridTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    gridIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridMenuBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gridName: {
      fontSize: 14,
      fontFamily: fonts.semiBold,
      color: colors.text,
      letterSpacing: -0.2,
      marginBottom: 2,
    },
    gridMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 2,
    },
    gridMeta: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      flex: 1,
    },

    // List Row Styles
    listCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      padding: 14,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    listIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listTextWrap: {
      flex: 1,
      marginLeft: 14,
    },
    listName: {
      fontSize: 15,
      fontFamily: fonts.semiBold,
      color: colors.text,
      letterSpacing: -0.2,
    },
    listMetaRow: {
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    folderBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1.5,
      borderRadius: 5,
      backgroundColor: 'rgba(255, 106, 0, 0.14)',
    },
    folderBadgeText: {
      fontSize: 9.5,
      fontFamily: fonts.bold,
      color: '#FF6A00',
      letterSpacing: 0.5,
    },
    listMeta: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    menuBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
