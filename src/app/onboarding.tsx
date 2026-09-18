import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import GradientBackground from '@/components/glass/GradientBackground';
import GlassCard from '@/components/glass/GlassCard';
import GlassButton from '@/components/glass/GlassButton';
import Logo from '@/components/glass/Logo';
import { useAuthStore } from '@/store/auth.store';
import { useOnboardingStore } from '@/store/onboarding.store';
import { GlassTheme, useGlass } from '@/theme/glass';

// Shown exactly once per device, right after the consent gate (see
// src/app/index.tsx for the redirect order). This is a PRIMER only: it
// explains which OS permissions ZDrive asks for and why, but does NOT
// trigger the OS dialogs. The real permission prompts still appear
// contextually the first time each feature is used - photo access when
// the user taps Upload -> Photos, biometric when they enable the app
// lock in Settings. That's what Android/iOS require and what keeps
// grant rates high; a blanket up-front prompt would be premature and
// risks App Store rejection.
const ITEMS: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  body: string;
}[] = [
  {
    icon: 'image-multiple-outline',
    title: 'Photos & media',
    body: 'So you can upload pictures and videos straight from your gallery. Asked only when you choose to upload from Photos.',
  },
  {
    icon: 'fingerprint',
    title: 'Biometric unlock',
    body: 'Optional. Lock ZDrive behind Face ID or your fingerprint. Enable it anytime in Settings.',
  },
  {
    icon: 'lock-check-outline',
    title: 'Your files stay yours',
    body: 'ZDrive only ever accesses what you pick. Nothing is read or uploaded in the background.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);

  const user = useAuthStore((state) => state.user);
  const markSeen = useOnboardingStore((state) => state.markSeen);
  const [continuing, setContinuing] = useState(false);

  async function handleContinue() {
    if (continuing) return;
    setContinuing(true);
    await markSeen();
    router.replace(user ? '/(tabs)/dashboard' : '/(auth)/login');
  }

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
              Here's what ZDrive may ask permission for as you use it. We only
              ask when you actually use each feature.
            </Text>
          </View>

          <View style={styles.list}>
            {ITEMS.map((item) => (
              <GlassCard key={item.title} padding={16} radius={20} style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.iconWrap}>
                    <MaterialCommunityIcons name={item.icon} size={22} color={g.accent} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardBody}>{item.body}</Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <GlassButton
            title="Get Started"
            onPress={handleContinue}
            loading={continuing}
            icon="arrow-right"
          />
          <Text style={styles.footerNote}>
            You can review these anytime in your phone's Settings.
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
    card: {},
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
    footer: { paddingHorizontal: 22, paddingTop: 6, paddingBottom: 8 },
    footerNote: {
      marginTop: 12,
      fontSize: 12.5,
      color: g.textFaint,
      textAlign: 'center',
    },
  });
}
