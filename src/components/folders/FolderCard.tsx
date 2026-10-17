import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { fonts } from '@/theme/typography';
import { ZDriveFolder } from '@/types/folder';

interface Props {
  folder: ZDriveFolder;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
  variant?: 'grid' | 'list';
  width?: number;
}

export default function FolderCard({
  folder,
  onPress,
  onLongPress,
  onMenuPress,
  variant = 'grid',
  width,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  if (variant === 'list') {
    return (
      <Pressable
        style={({ pressed }) => [styles.listCard, pressed && styles.pressed]}
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={350}
      >
        <View style={styles.listIconWrap}>
          <MaterialCommunityIcons name="folder" size={24} color="#FF6A00" />
        </View>

        <View style={styles.listTextWrap}>
          <Text numberOfLines={1} style={styles.listName}>
            {folder.name}
          </Text>
          <Text style={styles.listMeta}>Folder</Text>
        </View>

        <Pressable
          style={styles.menuBtn}
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

      <Text style={styles.gridMeta}>Folder</Text>
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
      shadowColor: '#FF6A00',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    gridTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    gridIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: 'rgba(255, 106, 0, 0.12)',
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
    gridMeta: {
      fontSize: 11.5,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },

    // List Row Styles
    listCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 1,
    },
    listIconWrap: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 106, 0, 0.12)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    listTextWrap: {
      flex: 1,
      marginLeft: 12,
    },
    listName: {
      fontSize: 14.5,
      fontFamily: fonts.semiBold,
      color: colors.text,
      letterSpacing: -0.2,
    },
    listMeta: {
      marginTop: 2,
      fontSize: 11.5,
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
