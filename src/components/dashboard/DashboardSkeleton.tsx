import { StyleSheet, View } from 'react-native';

import Skeleton from '@/components/common/Skeleton';
import GlassCard from '@/components/glass/GlassCard';
import { GlassTheme, useGlass } from '@/theme/glass';

export default function DashboardSkeleton() {
  const g = useGlass();
  const styles = getStyles(g);

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Skeleton width={90} height={13} style={{ marginBottom: 6 }} />
          <Skeleton width={160} height={26} borderRadius={10} />
        </View>
        <Skeleton width={44} height={44} borderRadius={22} />
      </View>

      {/* Storage Card Skeleton */}
      <GlassCard radius={26} padding={22} style={styles.block}>
        <View style={styles.cardHeader}>
          <Skeleton width={110} height={13} />
          <Skeleton width={48} height={22} borderRadius={12} />
        </View>
        <Skeleton width={220} height={26} borderRadius={10} style={{ marginTop: 10 }} />
        <Skeleton width="100%" height={8} borderRadius={4} style={{ marginTop: 18, marginBottom: 18 }} />
        <View style={styles.metricsRow}>
          <Skeleton width={60} height={14} />
          <Skeleton width={60} height={14} />
          <Skeleton width={60} height={14} />
        </View>
      </GlassCard>

      {/* Quick Actions Skeleton */}
      <View style={styles.block}>
        <View style={styles.sectionHeader}>
          <Skeleton width={90} height={12} />
          <Skeleton width={90} height={32} borderRadius={14} />
        </View>

        <View style={styles.grid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.gridItem}>
              <GlassCard radius={22} padding={16}>
                <Skeleton width={42} height={42} borderRadius={14} style={{ marginBottom: 12 }} />
                <Skeleton width={90} height={15} borderRadius={6} style={{ marginBottom: 6 }} />
                <Skeleton width={60} height={12} borderRadius={4} />
              </GlassCard>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity Skeleton */}
      <View style={styles.block}>
        <View style={styles.sectionHeaderSimple}>
          <Skeleton width={110} height={12} />
          <Skeleton width={50} height={12} />
        </View>

        <GlassCard strong padding={8} radius={24}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.row}>
              <Skeleton width={40} height={40} borderRadius={14} />
              <View style={styles.rowText}>
                <Skeleton width={140} height={14} borderRadius={6} style={{ marginBottom: 6 }} />
                <Skeleton width={90} height={12} borderRadius={4} />
              </View>
            </View>
          ))}
        </GlassCard>
      </View>
    </View>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    container: {
      paddingTop: 8,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    headerLeft: {
      flex: 1,
    },
    block: {
      marginBottom: 22,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    metricsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    sectionHeaderSimple: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    gridItem: {
      width: '48%',
      flexGrow: 1,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    rowText: {
      flex: 1,
    },
  });
}
