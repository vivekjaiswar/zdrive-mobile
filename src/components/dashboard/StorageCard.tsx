import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import GlassCard from '@/components/glass/GlassCard';
import { GlassTheme, useGlass } from '@/theme/glass';

interface Props {
  storageUsed: string | number;
  storageLimit: string | number;
  usagePercentage: number;
  fileCount: number;
  folderCount: number;
  sharedCount: number;
}

function formatBytes(value: string | number) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export default function StorageCard({
  storageUsed,
  storageLimit,
  usagePercentage,
  fileCount,
  folderCount,
  sharedCount,
}: Props) {
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);

  const pct = Math.min(Math.max(usagePercentage || 0, 0), 100);

  // Segment colors inspired by Dribbox UI Kit
  const segments = [
    { label: 'Files', count: fileCount, color: '#38BDF8', widthPct: Math.max(pct * 0.55, 4) },
    { label: 'Folders', count: folderCount, color: '#F59E0B', widthPct: Math.max(pct * 0.30, 3) },
    { label: 'Shared', count: sharedCount, color: '#A855F7', widthPct: Math.max(pct * 0.15, 2) },
  ];

  return (
    <Pressable onPress={() => router.push('/(tabs)/settings')}>
      <GlassCard radius={26} padding={22} style={styles.card}>
        {/* Top Header Row */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.label}>STORAGE DETAILS</Text>
            <Text style={styles.usedText}>
              {formatBytes(storageUsed)}
              <Text style={styles.limitText}> / {formatBytes(storageLimit)}</Text>
            </Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pct}%</Text>
          </View>
        </View>

        {/* Dribbox-style Segmented Progress Bar */}
        <View style={styles.segmentTrack}>
          {segments.map((seg, idx) => (
            <View
              key={idx}
              style={[
                styles.segmentFill,
                { width: `${seg.widthPct}%`, backgroundColor: seg.color },
              ]}
            />
          ))}
          <View style={{ flex: 1, backgroundColor: g.glassBorder }} />
        </View>

        {/* Category Legend Pills */}
        <View style={styles.legendRow}>
          {segments.map((seg, idx) => (
            <View key={idx} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: seg.color }]} />
              <Text style={styles.legendLabel}>
                {seg.label} <Text style={styles.legendCount}>({seg.count})</Text>
              </Text>
            </View>
          ))}

          <MaterialCommunityIcons name="chevron-right" size={18} color={g.textFaint} />
        </View>
      </GlassCard>
    </Pressable>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    card: {
      marginBottom: 22,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    label: {
      fontSize: 11.5,
      fontWeight: '700',
      color: g.textSecondary,
      letterSpacing: 0.6,
    },
    usedText: {
      marginTop: 6,
      fontSize: 24,
      fontWeight: '800',
      color: g.text,
      letterSpacing: -0.5,
    },
    limitText: {
      fontSize: 14,
      fontWeight: '600',
      color: g.textSecondary,
    },
    badge: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 14,
      backgroundColor: g.accentSoft,
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    badgeText: {
      fontSize: 13,
      fontWeight: '800',
      color: g.accent,
    },
    segmentTrack: {
      flexDirection: 'row',
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: 18,
      marginBottom: 18,
      gap: 3,
    },
    segmentFill: {
      height: '100%',
      borderRadius: 2,
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendLabel: {
      fontSize: 12.5,
      fontWeight: '600',
      color: g.text,
    },
    legendCount: {
      fontSize: 12,
      fontWeight: '500',
      color: g.textSecondary,
    },
  });
}
