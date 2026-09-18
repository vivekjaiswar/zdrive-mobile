import { StyleSheet, View } from 'react-native';

import Skeleton from '@/components/common/Skeleton';
import GlassCard from '@/components/glass/GlassCard';
import { GlassTheme, useGlass } from '@/theme/glass';

export default function AuthSkeleton() {
  const g = useGlass();
  const styles = getStyles(g);

  return (
    <View style={styles.container}>
      <View style={styles.logoWrap}>
        <Skeleton width={52} height={52} borderRadius={26} />
      </View>

      <GlassCard padding={24} radius={28}>
        <Skeleton width={160} height={26} borderRadius={10} style={{ alignSelf: 'center', marginBottom: 8 }} />
        <Skeleton width={220} height={14} borderRadius={6} style={{ alignSelf: 'center', marginBottom: 24 }} />

        <View style={styles.form}>
          <Skeleton width="100%" height={52} borderRadius={16} />
          <Skeleton width="100%" height={52} borderRadius={16} />
          <Skeleton width="100%" height={52} borderRadius={16} style={{ marginTop: 10 }} />
          <Skeleton width="100%" height={52} borderRadius={16} />
        </View>
      </GlassCard>
    </View>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: 40,
    },
    logoWrap: {
      alignItems: 'center',
      marginBottom: 28,
    },
    form: {
      gap: 15,
    },
  });
}
