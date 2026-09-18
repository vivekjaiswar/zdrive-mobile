import { StyleSheet, View, useWindowDimensions } from 'react-native';

import Skeleton from '@/components/common/Skeleton';
import { GlassTheme, useGlass } from '@/theme/glass';

const GAP = 8;
const COLUMNS = 3;

export default function GridSkeleton() {
  const g = useGlass();
  const styles = getStyles(g);
  const { width } = useWindowDimensions();

  const cellSize = (width - 48 - GAP * (COLUMNS - 1)) / COLUMNS;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Skeleton width={100} height={24} borderRadius={8} />
      </View>

      <View style={styles.grid}>
        {Array.from({ length: 12 }).map((_, index) => (
          <Skeleton
            key={index}
            width={cellSize}
            height={cellSize}
            borderRadius={16}
          />
        ))}
      </View>
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
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: GAP,
    },
  });
}
