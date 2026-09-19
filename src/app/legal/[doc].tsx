import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import GlassScreen from '@/components/glass/GlassScreen';
import GlassCard from '@/components/glass/GlassCard';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/services/api';
import { GlassTheme, useGlass } from '@/theme/glass';

const TERMS_SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using ZDrive (provided by ZennialHub), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to all terms, you may not access or use our services.',
  },
  {
    title: '2. Account Security & Responsibilities',
    body: 'You are responsible for safeguarding your account credentials, password, and two-factor authentication recovery codes. You agree to notify us immediately of any unauthorized access to your account.',
  },
  {
    title: '3. Acceptable Use & Storage Rules',
    body: 'ZDrive provides cloud file storage, file sharing, and synchronization. You agree not to store, upload, or share content that is unlawful, malicious, contains malware, or infringes on third-party intellectual property rights.',
  },
  {
    title: '4. Subscriptions & Payment Terms',
    body: 'Paid storage plans are billed on a 30-day recurring basis. Upgrades take effect immediately upon successful payment verification. Storage limits are enforced per account plan tier.',
  },
  {
    title: '5. Account Termination & Data Deletion',
    body: 'You can terminate your account at any time from Settings. Deleting your account permanently removes all stored files, folders, and shared links from our systems and cannot be undone.',
  },
];

const PRIVACY_SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'We collect information required to provide cloud storage: account details (email address, profile name), file metadata (file names, sizes, mime types), and basic security telemetry (active session logs and IP addresses).',
  },
  {
    title: '2. How We Use Your Data',
    body: 'Your data is used solely to operate ZDrive services: storing and streaming your files, verifying 2FA security, processing subscription billing, and providing AI search over your own files.',
  },
  {
    title: '3. Data Security & Encryption',
    body: 'ZDrive employs bank-grade security protocols. All files are encrypted in transit (TLS 1.3) and at rest (AES-256) on cloud infrastructure. Access tickets for file streaming expire automatically after short windows.',
  },
  {
    title: '4. Third-Party Sharing',
    body: 'We do not sell, rent, or monetize your personal data. We only share data with infrastructure partners (such as AWS for storage and Razorpay for payment processing) strictly to deliver the service.',
  },
  {
    title: '5. Your Rights & Data Portability',
    body: 'You retain full ownership of all content stored on ZDrive. You may download, export, share, or permanently erase your files and account at any time.',
  },
];

export default function LegalDocScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);

  const isTerms = doc === 'terms';
  const title = isTerms ? 'Terms of Service' : 'Privacy Policy';
  const webUrl = isTerms ? TERMS_OF_SERVICE_URL : PRIVACY_POLICY_URL;
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;
  const browserBtnLabel = isTerms
    ? 'View full ToS on browser'
    : 'View full Privacy Policy on browser';

  return (
    <GlassScreen edges={['top', 'left', 'right', 'bottom']}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={g.text} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {title}
        </Text>
        <Pressable
          style={styles.openWebBtn}
          onPress={() => Linking.openURL(webUrl)}
          hitSlop={12}
        >
          <MaterialCommunityIcons name="open-in-new" size={20} color={g.accent} />
        </Pressable>
      </View>

      {/* Native Document Viewer */}
      <GlassCard strong padding={20} radius={26} style={styles.docCard}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <Text style={styles.docHeaderTitle}>{title}</Text>
          <Text style={styles.docSub}>ZennialHub</Text>

          {sections.map((sec, idx) => (
            <View key={idx} style={styles.sectionBlock}>
              <Text style={styles.secTitle}>{sec.title}</Text>
              <Text style={styles.secBody}>{sec.body}</Text>
            </View>
          ))}

          <Pressable style={styles.webLinkBtn} onPress={() => Linking.openURL(webUrl)}>
            <Text style={styles.webLinkText}>{browserBtnLabel}</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={g.accent} />
          </Pressable>
        </ScrollView>
      </GlassCard>
    </GlassScreen>
  );
}

function getStyles(g: GlassTheme) {
  return StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      marginBottom: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: g.glassFill,
      borderWidth: 1,
      borderColor: g.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topBarTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 18,
      fontWeight: '800',
      letterSpacing: -0.3,
      color: g.text,
    },
    openWebBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: g.glassFill,
      borderWidth: 1,
      borderColor: g.glassBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    docCard: {
      flex: 1,
      marginBottom: 16,
    },
    scroll: {
      paddingBottom: 24,
    },
    docHeaderTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: g.text,
      letterSpacing: -0.4,
    },
    docSub: {
      marginTop: 4,
      fontSize: 12.5,
      fontWeight: '600',
      color: g.accent,
      marginBottom: 20,
    },
    sectionBlock: {
      marginBottom: 18,
    },
    secTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: g.text,
      marginBottom: 6,
    },
    secBody: {
      fontSize: 13.5,
      lineHeight: 21,
      color: g.textSecondary,
    },
    webLinkBtn: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: g.accentSoft,
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    webLinkText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: g.accent,
    },
  });
}
