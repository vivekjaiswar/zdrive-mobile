import { StyleSheet, View } from 'react-native';

import Skeleton from '@/components/common/Skeleton';
import GlassCard from '@/components/glass/GlassCard';
import { GlassTheme, useGlass } from '@/theme/glass';

interface Props {
  count?: number;
  showSearchBar?: boolean;
  showHeader?: boolean;
}

export default function ListSkeleton({
  count = 5,
  showSearchBar = false,
  showHeader = true,
}: Props) {
  const g = useGlass();
  const styles = getStyles(g);

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Skeleton width={140} height={28} borderRadius={10} />
          <Skeleton width={36} height={36} borderRadius={18} />
        </View>
      )}

      {showSearchBar && (
        <Skeleton width="100%" height={46} borderRadius={16} style={{ marginBottom: 16 }} />
      )}

      <GlassCard strong padding={6} radius={22}>
        <View style={styles.list}>
          {Array.from({ length: count }).map((_, index) => (
            <View key={index} style={styles.row}>
              <Skeleton width={42} height={42} borderRadius={14} />
              <View style={styles.rowContent}>
                <Skeleton
                  width={`${Math.floor(Math.random() * 30) + 50}%`}
                  height={15}
                  borderRadius={6}
                  style={{ marginBottom: 6 }}
                />
                <Skeleton width="40%" height={12} borderRadius={4} />
              </View>
              <Skeleton width={18} height={18} borderRadius={9} />
            </View>
          ))}
        </View>
      </GlassCard>
    </View>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    container: {
      paddingTop: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    list: {
      paddingVertical: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    rowContent: {
      flex: 1,
    },
  });
}
