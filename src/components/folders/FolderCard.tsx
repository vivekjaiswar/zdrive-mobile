import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '@/theme/colors';
import { ZDriveFolder } from '@/types/folder';

interface Props {
  folder: ZDriveFolder;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function FolderCard({ folder, onPress, onLongPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
    >
      <View style={styles.icon}>
        <MaterialCommunityIcons name="folder" size={26} color={Colors.primary} />
      </View>

      <Text numberOfLines={1} style={styles.name}>
        {folder.name}
      </Text>

      <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    flex: 1,
    marginLeft: 14,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});
