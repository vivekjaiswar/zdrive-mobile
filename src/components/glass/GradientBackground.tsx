import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useGlass } from '@/theme/glass';

export default function GradientBackground({ children }: { children?: ReactNode }) {
  const g = useGlass();

  return (
    <View style={[styles.root, { backgroundColor: g.gradient[0] }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
