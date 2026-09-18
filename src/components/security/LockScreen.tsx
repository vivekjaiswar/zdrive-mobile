import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import GradientBackground from '@/components/glass/GradientBackground';
import GlassButton from '@/components/glass/GlassButton';
import Logo from '@/components/glass/Logo';
import biometricService from '@/services/biometric.service';
import { GlassTheme, useGlass } from '@/theme/glass';

interface Props {
  onUnlock: () => void;
}

// Full-screen security gate on top of the whole app. CRITICAL: it must be
// fully OPAQUE so real content (and the OS app-switcher snapshot) is hidden
// while locked - it renders its own gradient backdrop rather than relying on
// a theme background colour (which is now transparent, and previously left
// this overlay see-through). Auto-prompts on mount.
export default function LockScreen({ onUnlock }: Props) {
  const g = useGlass();
  const styles = getStyles(g);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    attemptUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function attemptUnlock() {
    if (authenticating) return;
    try {
      setAuthenticating(true);
      const success = await biometricService.authenticate();
      if (success) onUnlock();
    } finally {
      setAuthenticating(false);
    }
  }

  return (
    <View style={styles.overlay}>
      <GradientBackground>
        <View style={styles.center}>
          <View style={styles.logoWrap}>
            <Logo size={44} />
          </View>

          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="fingerprint" size={44} color={g.accent} />
          </View>

          <Text style={styles.title}>ZDrive is Locked</Text>
          <Text style={styles.subtitle}>
            Unlock with Face ID or fingerprint to continue.
          </Text>

          <GlassButton
            title={authenticating ? 'Waiting…' : 'Unlock'}
            icon="lock-open-outline"
            loading={authenticating}
            onPress={attemptUnlock}
            style={styles.button}
          />
        </View>
      </GradientBackground>
    </View>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      // Opaque base under the gradient as a belt-and-suspenders guarantee
      // that nothing behind can ever show through the lock screen.
      backgroundColor: g.scheme === 'dark' ? '#0A1026' : '#E8F0FF',
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    logoWrap: { marginBottom: 48 },
    iconCircle: {
      width: 92,
      height: 92,
      borderRadius: 46,
      backgroundColor: g.accentSoft,
      borderWidth: 1,
      borderColor: g.glassBorder,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 26,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: g.text,
      textAlign: 'center',
      letterSpacing: -0.4,
    },
    subtitle: {
      marginTop: 8,
      fontSize: 14.5,
      color: g.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
      maxWidth: 260,
    },
    button: { marginTop: 36, paddingHorizontal: 40, alignSelf: 'center' },
  });
}
