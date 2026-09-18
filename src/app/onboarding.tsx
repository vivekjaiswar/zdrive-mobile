import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import GradientBackground from '@/components/glass/GradientBackground';
import GlassCard from '@/components/glass/GlassCard';
import GlassButton from '@/components/glass/GlassButton';
import Logo from '@/components/glass/Logo';
import { useAuthStore } from '@/store/auth.store';
import { useOnboardingStore } from '@/store/onboarding.store';
import { GlassTheme, useGlass } from '@/theme/glass';

// Shown exactly once per device, right after the consent gate (see
// src/app/index.tsx for the redirect order).
//
// This is an explain-THEN-request primer. The photo card carries a real
// "Allow" button that fires the OS media-library dialog when the user
// chooses to tap it - that's the recommended pattern (contextual, with a
// reason shown first), NOT a blanket dialog thrown on launch. Photos is
// the only permission ZDrive has that produces an OS dialog; biometric
// unlock is an in-app Settings toggle (no runtime dialog on Android),
// so it stays informational here. Whether the user allows or skips,
// "Continue" always lets them proceed - the real upload flow re-checks
// permission at point of use regardless.
export default function OnboardingScreen() {
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);

  const user = useAuthStore((state) => state.user);
  const markSeen = useOnboardingStore((state) => state.markSeen);
  const [continuing, setContinuing] = useState(false);

  // [status, requestPermission] for the media library. `status` starts
  // null until we've asked/checked; `granted` / `canAskAgain` drive the
  // button's three states below.
  const [photoPerm, requestPhotoPerm] = ImagePicker.useMediaLibraryPermissions();
  const [requesting, setRequesting] = useState(false);

  const photoGranted = photoPerm?.granted === true;
  // Denied and the OS won't show the dialog again -> the only way to
  // grant is the system Settings screen.
  const photoBlocked = photoPerm?.granted === false && photoPerm?.canAskAgain === false;

  async function handleAllowPhotos() {
    if (requesting || photoGranted) return;

    if (photoBlocked) {
      // Can't re-prompt; send them to the app's settings page instead.
      Linking.openSettings();
      return;
    }

    setRequesting(true);
    try {
      await requestPhotoPerm();
    } finally {
      setRequesting(false);
    }
  }

  async function handleContinue() {
    if (continuing) return;
    setContinuing(true);
    await markSeen();
    router.replace(user ? '/(tabs)/dashboard' : '/(auth)/login');
  }

  const photoActionLabel = photoGranted
    ? 'Allowed'
    : photoBlocked
      ? 'Open Settings'
      : 'Allow';

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Logo size={40} showTagline={false} />
            <Text style={styles.title}>A quick heads-up</Text>
            <Text style={styles.subtitle}>
              Here's what ZDrive uses. You can allow photo access now, or later
              when you first upload - it's up to you.
            </Text>
          </View>

          <View style={styles.list}>
            {/* Actionable: photo access fires the real OS dialog. */}
            <GlassCard padding={16} radius={20}>
              <View style={styles.cardRow}>
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons
                    name="image-multiple-outline"
                    size={22}
                    color={g.accent}
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>Photos & media</Text>
                  <Text style={styles.cardBody}>
                    So you can upload pictures and videos straight from your
                    gallery.
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleAllowPhotos}
                disabled={requesting || photoGranted}
                style={[
                  styles.allowBtn,
                  photoGranted && styles.allowBtnGranted,
                ]}
                hitSlop={6}
              >
                <MaterialCommunityIcons
                  name={photoGranted ? 'check-circle' : 'shield-key-outline'}
                  size={16}
                  color={photoGranted ? g.success : g.accent}
                />
                <Text
                  style={[
                    styles.allowBtnText,
                    { color: photoGranted ? g.success : g.accent },
                  ]}
                >
                  {photoActionLabel}
                </Text>
              </Pressable>
            </GlassCard>

            {/* Informational: no OS dialog to fire for these. */}
            <GlassCard padding={16} radius={20}>
              <View style={styles.cardRow}>
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons name="fingerprint" size={22} color={g.accent} />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>Biometric unlock</Text>
                  <Text style={styles.cardBody}>
                    Optional. Lock ZDrive behind Face ID or your fingerprint -
                    turn it on anytime in Settings.
                  </Text>
                </View>
              </View>
            </GlassCard>

            <GlassCard padding={16} radius={20}>
              <View style={styles.cardRow}>
                <View style={styles.iconWrap}>
                  <MaterialCommunityIcons
                    name="lock-check-outline"
                    size={22}
                    color={g.accent}
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>Your files stay yours</Text>
                  <Text style={styles.cardBody}>
                    ZDrive only ever accesses what you pick. Nothing is read or
                    uploaded in the background.
                  </Text>
                </View>
              </View>
            </GlassCard>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <GlassButton
            title="Continue"
            onPress={handleContinue}
            loading={continuing}
            icon="arrow-right"
          />
          <Text style={styles.footerNote}>
            You can change these anytime in your phone's Settings.
          </Text>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    safe: { flex: 1 },
    content: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 16 },
    header: { alignItems: 'center', marginBottom: 26 },
    title: {
      marginTop: 22,
      fontSize: 26,
      fontWeight: '800',
      color: g.text,
      letterSpacing: -0.5,
    },
    subtitle: {
      marginTop: 10,
      fontSize: 14.5,
      lineHeight: 21,
      color: g.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 4,
    },
    list: { gap: 12 },
    cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: g.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardText: { flex: 1 },
    cardTitle: { fontSize: 15.5, fontWeight: '700', color: g.text },
    cardBody: { marginTop: 4, fontSize: 13.5, lineHeight: 19, color: g.textSecondary },
    allowBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      marginTop: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: g.accentSoft,
    },
    // No successSoft token in the theme; a subtle translucent green tint
    // that reads on both light and dark glass.
    allowBtnGranted: { backgroundColor: 'rgba(16,185,129,0.14)' },
    allowBtnText: { fontSize: 14, fontWeight: '700' },
    footer: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 8 },
    footerNote: {
      marginTop: 12,
      fontSize: 12.5,
      color: g.textFaint,
      textAlign: 'center',
    },
  });
}
