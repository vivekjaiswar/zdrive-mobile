import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '@/theme/colors';

interface Props {
  name: string | null;
  email: string;
  avatarUrl: string | null;
  uploadingAvatar?: boolean;
  onChangeAvatar: () => void;
  onEditName: () => void;
}

export default function ProfileHeader({
  name,
  email,
  avatarUrl,
  uploadingAvatar = false,
  onChangeAvatar,
  onEditName,
}: Props) {
  const initials = (name?.trim() || email)
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      <Pressable onPress={onChangeAvatar} style={styles.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}

        <View style={styles.editBadge}>
          {uploadingAvatar ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialCommunityIcons name="camera" size={14} color="#FFFFFF" />
          )}
        </View>
      </Pressable>

      <Pressable onPress={onEditName} style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>
          {name?.trim() || 'Add your name'}
        </Text>
        <MaterialCommunityIcons name="pencil-outline" size={16} color={Colors.textSecondary} />
      </Pressable>

      <Text style={styles.email} numberOfLines={1}>
        {email}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },

  avatarWrap: {
    width: 96,
    height: 96,
  },

  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EEF5FF',
  },

  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  initials: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EEF6FF',
  },

  nameRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    maxWidth: 220,
  },

  email: {
    marginTop: 4,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
