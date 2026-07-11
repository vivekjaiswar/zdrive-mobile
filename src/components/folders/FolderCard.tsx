import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';
import { ZDriveFolder } from '@/types/folder';

interface Props {
  folder: ZDriveFolder;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function FolderCard({ folder, onPress, onLongPress }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
    >
      <View style={styles.icon}>
        <MaterialCommunityIcons name="folder" size={22} color={colors.primary} />
      </View>

      <Text numberOfLines={1} style={styles.name}>
        {folder.name}
      </Text>

      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
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
    icon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
    },
    name: {
      flex: 1,
      marginLeft: 14,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
  });
}
