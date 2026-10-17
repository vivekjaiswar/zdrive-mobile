import { ReactNode } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useGlass } from '@/theme/glass';

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

      {/* Radiant ambient glow orbs for rich glass refraction */}
      <Image
        source={require('../../../assets/images/logo-glow.png')}
        style={[styles.orb, styles.orbTop]}
        tintColor={g.orbA}
        resizeMode="contain"
      />
      <Image
        source={require('../../../assets/images/logo-glow.png')}
        style={[styles.orb, styles.orbMiddle]}
        tintColor={g.orbC}
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
    opacity: 0.95,
  },
  orbTop: {
    top: -100,
    left: -120,
    width: 380,
    height: 380,
  },
  orbMiddle: {
    top: '35%',
    right: -140,
    width: 340,
    height: 340,
  },
  orbBottom: {
    bottom: -120,
    left: -80,
    width: 420,
    height: 420,
  },
});
