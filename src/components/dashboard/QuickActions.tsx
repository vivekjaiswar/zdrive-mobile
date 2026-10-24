import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import GlassCard from '@/components/glass/GlassCard';
import { GlassTheme, useGlass } from '@/theme/glass';
import { fonts } from '@/theme/typography';

interface Props {
  uploading: boolean;
  onUpload: () => void;
  fileCount: number;
  sharedCount: number;
}

export default function QuickActions({
  uploading,
  onUpload,
  fileCount,
  sharedCount,
}: Props) {
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);

  // Apple iOS 27 System Folder Cards
  const folderCards = [
    {
      title: 'All Files',
      subtitle: `${fileCount} items`,
      icon: 'folder' as const,
      color: '#007AFF',
      bgColor: 'rgba(0, 122, 255, 0.12)',
      onPress: () => router.push('/(tabs)/files'),
    },
    {
      title: 'Photos',
      subtitle: 'Media gallery',
      icon: 'image-multiple' as const,
      color: '#FF2D55',
      bgColor: 'rgba(255, 45, 85, 0.12)',
      onPress: () => router.push('/photos'),
    },
    {
      title: 'Shared Links',
      subtitle: `${sharedCount} links`,
      icon: 'share-variant' as const,
      color: '#AF52DE',
      bgColor: 'rgba(175, 82, 222, 0.12)',
      onPress: () => router.push('/(tabs)/shared'),
    },
    {
      title: 'Trash',
      subtitle: 'Deleted items',
      icon: 'trash-can' as const,
      color: '#FF9500',
      bgColor: 'rgba(255, 149, 0, 0.12)',
      onPress: () => router.push('/trash'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Upload Primary Action Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>MY STORAGE</Text>
        <Pressable
          style={styles.uploadBtn}
          onPress={onUpload}
          disabled={uploading}
          hitSlop={6}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          )}
          <Text style={styles.uploadBtnText}>
            {uploading ? 'Uploading...' : 'Upload File'}
          </Text>
        </Pressable>
      </View>

      {/* 2x2 Folder Cards Grid */}
      <View style={styles.grid}>
        {folderCards.map((card) => (
          <Pressable
            key={card.title}
            style={({ pressed }) => [styles.gridCard, pressed && styles.cardPressed]}
            onPress={card.onPress}
          >
            <GlassCard radius={22} padding={16}>
              <View style={styles.cardHeader}>
                <View style={[styles.folderIconBadge, { backgroundColor: card.bgColor }]}>
                  <MaterialCommunityIcons name={card.icon} size={22} color={card.color} />
                </View>
                <MaterialCommunityIcons name="dots-vertical" size={18} color={g.textFaint} />
              </View>

              <Text style={styles.cardTitle} numberOfLines={1}>
                {card.title}
              </Text>
              <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            </GlassCard>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    container: {
      marginBottom: 22,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 11.5,
      fontFamily: fonts.bold,
      color: g.textSecondary,
      letterSpacing: 0.8,
    },
    uploadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: g.accent,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 14,

      shadowColor: g.accent,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    uploadBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontFamily: fonts.bold,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    gridCard: {
      flexBasis: '47%',
      flexGrow: 1,
    },
    cardPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.97 }],
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    folderIconBadge: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: {
      fontSize: 15,
      fontFamily: fonts.bold,
      color: g.text,
      letterSpacing: -0.2,
    },
    cardSubtitle: {
      marginTop: 3,
      fontSize: 12,
      fontFamily: fonts.medium,
      color: g.textSecondary,
    },
  });
}
