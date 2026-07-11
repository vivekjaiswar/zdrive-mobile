import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import biometricService from '@/services/biometric.service';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  onUnlock: () => void;
}

// Full-screen gate rendered as an absolutely-positioned sibling on
// top of the Stack navigator (see _layout.tsx for when this actually
// mounts) - covers real content on cold start and whenever the app
// resumes from the background. Auto-prompts on mount so most users
// never have to tap anything; the button below only matters if the
// OS prompt was dismissed or cancelled.
export default function LockScreen({ onUnlock }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    attemptUnlock();
    // Only ever auto-run once per mount - re-running on every render
    // would re-trigger the OS prompt in a loop.
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
      <Image
        source={require('../../../assets/logo.png')}
        resizeMode="contain"
        style={styles.logo}
      />

      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="fingerprint" size={40} color={colors.primary} />
      </View>

      <Text style={styles.title}>ZDrive is Locked</Text>
      <Text style={styles.subtitle}>
        Unlock with Face ID or fingerprint to continue.
      </Text>

      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={attemptUnlock}
        disabled={authenticating}
      >
        <Text style={styles.buttonText}>
          {authenticating ? 'Waiting...' : 'Unlock'}
        </Text>
      </Pressable>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },

    logo: {
      width: 180,
      height: 60,
      marginBottom: 56,
    },

    iconCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.primarySoft,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },

    title: {
      fontSize: 21,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },

    subtitle: {
      marginTop: 8,
      fontSize: 14.5,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 21,
      maxWidth: 260,
    },

    button: {
      marginTop: 36,
      height: 50,
      paddingHorizontal: 36,
      borderRadius: 14,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',

      shadowColor: colors.shadow,
      shadowOpacity: 0.16,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },

    buttonPressed: {
      opacity: 0.9,
    },

    buttonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 15,
    },
  });
}
