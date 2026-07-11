import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

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
  const colors = useColors();
  const styles = getStyles(colors);

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
            <MaterialCommunityIcons name="camera" size={13} color="#FFFFFF" />
          )}
        </View>
      </Pressable>

      <Pressable onPress={onEditName} style={styles.nameRow}>
        <Text style={styles.name} numberOfLines={1}>
          {name?.trim() || 'Add your name'}
        </Text>
        <MaterialCommunityIcons name="pencil-outline" size={15} color={colors.textSecondary} />
      </Pressable>

      <Text style={styles.email} numberOfLines={1}>
        {email}
      </Text>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingVertical: 24,
    },

    avatarWrap: {
      width: 92,
      height: 92,
    },

    avatar: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: colors.primarySoft,
    },

    avatarFallback: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },

    initials: {
      fontSize: 30,
      fontWeight: '700',
      color: '#FFFFFF',
    },

    editBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.background,
    },

    nameRow: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    name: {
      fontSize: 19,
      fontWeight: '700',
      color: colors.text,
      maxWidth: 220,
    },

    email: {
      marginTop: 4,
      fontSize: 13.5,
      color: colors.textSecondary,
    },
  });
}
