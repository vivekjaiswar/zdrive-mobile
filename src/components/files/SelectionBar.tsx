import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  count: number;
  busy?: boolean;
  onCancel: () => void;
  onMove: () => void;
  onShare: () => void;
  onDelete: () => void;
}

// Replaces the screen's normal title row while multi-select is
// active. Deliberately reuses the same "card" visual language
// (surface + border) as everything else in Files/Folder Explorer
// rather than a floating action bar, so it doesn't look bolted on.
export default function SelectionBar({
  count,
  busy = false,
  onCancel,
  onMove,
  onShare,
  onDelete,
}: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.bar}>
      <Pressable hitSlop={12} onPress={onCancel} disabled={busy}>
        <MaterialCommunityIcons name="close" size={22} color={colors.text} />
      </Pressable>

      <Text style={styles.count}>{count} selected</Text>

      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <View style={styles.actions}>
          <Pressable hitSlop={10} onPress={onMove}>
            <MaterialCommunityIcons name="folder-move-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable hitSlop={10} onPress={onShare}>
            <MaterialCommunityIcons name="share-variant-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable hitSlop={10} onPress={onDelete}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.danger} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      marginBottom: 20,
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.primary,
    },

    count: {
      flex: 1,
      marginLeft: 16,
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },

    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
    },
  });
}
