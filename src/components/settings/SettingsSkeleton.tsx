import { StyleSheet, View } from 'react-native';

import Skeleton from '@/components/common/Skeleton';
import GlassCard from '@/components/glass/GlassCard';
import { GlassTheme, useGlass } from '@/theme/glass';

export default function SettingsSkeleton() {
  const g = useGlass();
  const styles = getStyles(g);

  return (
    <View style={styles.container}>
      {/* Profile Header Skeleton */}
      <View style={styles.profileHeader}>
        <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 12 }} />
        <Skeleton width={140} height={20} borderRadius={8} style={{ marginBottom: 6 }} />
        <Skeleton width={180} height={14} borderRadius={6} />
      </View>

      {/* Settings Card Skeletons */}
      {[1, 2, 3].map((section) => (
        <View key={section} style={styles.section}>
          <Skeleton width={90} height={12} style={{ marginBottom: 8 }} />
          <GlassCard strong padding={8} radius={20}>
            {[1, 2].map((row) => (
              <View key={row} style={styles.row}>
                <Skeleton width={24} height={24} borderRadius={12} />
                <Skeleton width={120} height={15} borderRadius={6} style={{ flex: 1 }} />
                <Skeleton width={16} height={16} borderRadius={8} />
              </View>
            ))}
          </GlassCard>
        </View>
      ))}
    </View>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    container: {
      paddingTop: 16,
    },
    profileHeader: {
      alignItems: 'center',
      marginBottom: 28,
    },
    section: {
      marginBottom: 20,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 12,
    },
  });
}
