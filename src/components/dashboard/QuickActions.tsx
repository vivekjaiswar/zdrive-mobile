import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import GlassCard from '@/components/glass/GlassCard';
import { GlassTheme, useGlass } from '@/theme/glass';

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

  // Dribbox Folder Cards
  const folderCards = [
    {
      title: 'All Files',
      subtitle: `${fileCount} items`,
      icon: 'folder' as const,
      color: '#38BDF8',
      bgColor: 'rgba(56, 189, 248, 0.14)',
      onPress: () => router.push('/(tabs)/files'),
    },
    {
      title: 'Photos',
      subtitle: 'Media gallery',
      icon: 'image-multiple' as const,
      color: '#A855F7',
      bgColor: 'rgba(168, 85, 247, 0.14)',
      onPress: () => router.push('/photos'),
    },
    {
      title: 'Shared Links',
      subtitle: `${sharedCount} links`,
      icon: 'share-variant' as const,
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.14)',
      onPress: () => router.push('/(tabs)/shared'),
    },
    {
      title: 'Trash',
      subtitle: 'Deleted items',
      icon: 'trash-can' as const,
      color: '#EC4899',
      bgColor: 'rgba(236, 72, 153, 0.14)',
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

      {/* Dribbox-style 2x2 Folder Cards Grid */}
      <View style={styles.grid}>
        {folderCards.map((card) => (
          <Pressable
            key={card.title}
            style={styles.gridCard}
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
      fontWeight: '700',
      color: g.textSecondary,
      letterSpacing: 0.6,
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
      fontWeight: '700',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    gridCard: {
      width: '48%',
      flexGrow: 1,
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
      fontWeight: '700',
      color: g.text,
      letterSpacing: -0.2,
    },
    cardSubtitle: {
      marginTop: 3,
      fontSize: 12,
      color: g.textSecondary,
    },
  });
}
