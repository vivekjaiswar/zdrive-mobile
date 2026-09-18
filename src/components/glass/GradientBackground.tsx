import { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useGlass } from '@/theme/glass';

// The app-wide backdrop every glass screen sits on: a full-screen gradient
// plus two soft colour "orbs" for depth (reusing the existing logo-glow
// radial PNG, tinted - cheaper and softer than stacking extra BlurViews).
export default function GradientBackground({ children }: { children?: ReactNode }) {
  const g = useGlass();

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={g.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Image
        source={require('../../../assets/images/logo-glow.png')}
        style={[styles.orb, styles.orbTop]}
        tintColor={g.orbA}
        resizeMode="contain"
      />
      <Image
        source={require('../../../assets/images/logo-glow.png')}
        style={[styles.orb, styles.orbBottom]}
        tintColor={g.orbB}
        resizeMode="contain"
      />

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  orb: {
    position: 'absolute',
    width: 360,
    height: 360,
    opacity: 0.9,
  },
  orbTop: { top: -120, left: -110 },
  orbBottom: { bottom: -140, right: -120 },
});
