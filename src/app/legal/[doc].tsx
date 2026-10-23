import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

import GlassScreen from '@/components/glass/GlassScreen';
import GlassCard from '@/components/glass/GlassCard';
import { GlassTheme, useGlass } from '@/theme/glass';
import { fonts } from '@/theme/typography';
import {
  TERMS_OF_SERVICE_URL,
  PRIVACY_POLICY_URL,
  SECURITY_POLICY_URL,
} from '@/services/api';

type LegalTab = 'terms' | 'privacy' | 'security';

interface PolicyDoc {
  id: LegalTab;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  url: string;
}

interface ParsedPolicy {
  intro: string;
  sections: { heading: string; body: string }[];
}

function stripHtml(html: string): string {
  return html
    .replace(/\[email&#160;protected\]/gi, 'security@ojidrive.com')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#160;/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/https?:\/\/zhdrive\.in/gi, 'OJI Drive')
    .replace(/zhdrive\.in/gi, 'OJI Drive')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function parsePolicy(html: string): ParsedPolicy {
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
  const main = mainMatch ? mainMatch[0] : html;

  const firstSecIdx = main.indexOf('<section');
  const introHtml = firstSecIdx > -1 ? main.substring(0, firstSecIdx) : '';
  const cleanIntro = stripHtml(introHtml)
    .replace(/^Terms of Service\s*/i, '')
    .replace(/^Privacy Policy\s*/i, '')
    .replace(/^Security Policy\s*/i, '')
    .replace(/^Last updated:[^\n]*\n*/i, '')
    .trim();

  const sections: { heading: string; body: string }[] = [];
  const secRegex = /<section[\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)<\/section>/gi;
  let m: RegExpExecArray | null;
  while ((m = secRegex.exec(main)) !== null) {
    const heading = stripHtml(m[1]);
    const body = stripHtml(m[2]);
    if (heading && body) {
      sections.push({ heading, body });
    }
  }

  return { intro: cleanIntro, sections };
}

const POLICIES: PolicyDoc[] = [
  {
    id: 'terms',
    title: 'Terms of Service',
    icon: 'file-document-outline',
    url: TERMS_OF_SERVICE_URL,
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    icon: 'shield-lock-outline',
    url: PRIVACY_POLICY_URL,
  },
  {
    id: 'security',
    title: 'Security Policy',
    icon: 'security',
    url: SECURITY_POLICY_URL,
  },
];

const BUNDLED_POLICIES: Record<LegalTab, { title: string; sections: { heading: string; body: string }[] }> = {
  terms: {
    title: 'Terms of Service',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        body: 'By accessing or using OJI Drive, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to all terms, you may not access or use our services.',
      },
      {
        heading: '2. Account Security & Responsibilities',
        body: 'You are responsible for safeguarding your account credentials, password, and two-factor authentication recovery codes. You agree to notify us immediately of any unauthorized access to your account.',
      },
      {
        heading: '3. Acceptable Use & Storage Rules',
        body: 'OJI Drive provides cloud file storage, file sharing, and synchronization. You agree not to store, upload, or share content that is unlawful, malicious, contains malware, or infringes on third-party intellectual property rights.',
      },
      {
        heading: '4. Subscriptions & Payment Terms',
        body: 'Paid storage plans are billed on a recurring basis. Upgrades take effect immediately upon successful payment verification. Storage limits are enforced strictly per account tier.',
      },
      {
        heading: '5. Account Termination & Data Deletion',
        body: 'You can terminate your account at any time from Settings. Deleting your account permanently and irreversibly purges all stored files, folders, and shared links from our infrastructure.',
      },
      {
        heading: '6. Limitation of Liability',
        body: 'OJI Drive is provided on an "as is" and "as available" basis. While we maintain rigorous data redundancy and encryption protocols, we encourage maintaining independent backups of critical business data.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        heading: '1. Information We Collect',
        body: 'We collect account details (email address, profile name), file metadata (file names, sizes, mime types), and essential security telemetry (active session logs and IP addresses) strictly necessary to deliver the cloud storage service.',
      },
      {
        heading: '2. How We Use Your Data',
        body: 'Your data is used solely to operate OJI Drive services: storing and streaming your files, verifying 2FA security, processing subscription billing, and providing AI search over your own files.',
      },
      {
        heading: '3. Data Security & Encryption',
        body: 'All files are encrypted in transit using TLS 1.3 and at rest with AES-256. Access tickets for file streaming expire automatically after short windows to prevent unauthorized link harvesting.',
      },
      {
        heading: '4. Zero Third-Party Monetization',
        body: 'We never sell, rent, or monetize your personal data or file contents. We only interface with essential infrastructure providers (storage and payment gateways) strictly to process your requests.',
      },
      {
        heading: '5. Your Rights & Data Portability',
        body: 'You retain full ownership of all content stored on OJI Drive. You may download, export, share, or permanently erase your files and account at any time.',
      },
    ],
  },
  security: {
    title: 'Security Policy',
    sections: [
      {
        heading: '1. Bank-Grade Storage Encryption',
        body: 'All customer files uploaded to OJI Drive are encrypted at rest using AES-256 standard and transmitted exclusively over secure TLS 1.3 channels.',
      },
      {
        heading: '2. Two-Factor Authentication (2FA)',
        body: 'We support time-based one-time password (TOTP) two-factor authentication compatible with Google Authenticator, Authy, and hardware authenticators, alongside one-time hashed recovery codes.',
      },
      {
        heading: '3. HttpOnly Session Security',
        body: 'Authentication tokens are guarded via HttpOnly cookie architecture, immune to client-side script theft or XSS exfiltration.',
      },
      {
        heading: '4. Biometric Device Gates',
        body: 'The mobile application integrates hardware-backed Face ID and fingerprint biometrics to prevent unauthorized local device access while switching apps.',
      },
      {
        heading: '5. Temporary Signed Access Tickets',
        body: 'Direct file streaming URLs are signed with short-lived tickets that expire within 60 seconds, eliminating long-lived public exposure of media links.',
      },
    ],
  },
};

export default function LegalDocScreen() {
  const params = useLocalSearchParams<{ doc?: string }>();
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);

  const initialTab: LegalTab =
    params.doc === 'privacy'
      ? 'privacy'
      : params.doc === 'security' || params.doc === 'security-policy'
        ? 'security'
        : 'terms';

  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [livePolicyMap, setLivePolicyMap] = useState<Partial<Record<LegalTab, ParsedPolicy>>>({});
  const [fetching, setFetching] = useState(false);

  const currentPolicy = POLICIES.find((p) => p.id === activeTab) || POLICIES[0];
  const bundled = BUNDLED_POLICIES[activeTab];

  useEffect(() => {
    fetchLivePolicy(activeTab);
  }, [activeTab]);

  async function fetchLivePolicy(tab: LegalTab) {
    const policy = POLICIES.find((p) => p.id === tab);
    if (!policy) return;

    try {
      setFetching(true);
      const res = await axios.get(policy.url, { timeout: 7000 });
      if (typeof res.data === 'string') {
        const parsed = parsePolicy(res.data);
        if (parsed.sections.length > 0) {
          setLivePolicyMap((prev) => ({ ...prev, [tab]: parsed }));
        }
      }
    } catch {
      // Fallback seamlessly to bundled policies on offline/timeout
    } finally {
      setFetching(false);
    }
  }

  const parsedLive = livePolicyMap[activeTab];
  const displaySections =
    parsedLive && parsedLive.sections.length > 0 ? parsedLive.sections : bundled.sections;
  const displayIntro = parsedLive?.intro;

  return (
    <GlassScreen edges={['top', 'left', 'right', 'bottom']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={g.text} />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {currentPolicy.title}
          </Text>
          <Text style={styles.topBarSub}>OJI Drive Policies</Text>
        </View>

        <Pressable
          style={styles.reloadBtn}
          onPress={() => fetchLivePolicy(activeTab)}
          hitSlop={10}
          disabled={fetching}
        >
          {fetching ? (
            <ActivityIndicator size="small" color={g.accent} />
          ) : (
            <MaterialCommunityIcons name="refresh" size={20} color={g.accent} />
          )}
        </Pressable>
      </View>

      {/* Segmented Control: Terms, Privacy & Security on the SAME page */}
      <View style={styles.tabContainer}>
        {POLICIES.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={14}
                color={active ? '#FFFFFF' : g.textSecondary}
              />
              <Text
                style={[styles.tabText, active && styles.tabTextActive]}
                numberOfLines={1}
              >
                {tab.id === 'terms' ? 'Terms' : tab.id === 'privacy' ? 'Privacy' : 'Security'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content Card: Native Smooth Typography */}
      <GlassCard strong padding={0} radius={22} style={styles.docCard}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.docHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.docTitle}>{currentPolicy.title}</Text>
              <Text style={styles.docMeta}>
                {parsedLive ? 'Live Verified Policy • Auto-Updated' : 'Official Policy Document'}
              </Text>
            </View>
            {fetching && (
              <View style={styles.fetchingBadge}>
                <ActivityIndicator size="small" color={g.accent} />
              </View>
            )}
          </View>

          {displayIntro ? (
            <View style={styles.introBlock}>
              <Text style={styles.introBody}>{displayIntro}</Text>
            </View>
          ) : null}

          {displaySections.map((sec, idx) => (
            <View key={idx} style={styles.secBlock}>
              <Text style={styles.secHeading}>{sec.heading}</Text>
              <Text style={styles.secBody}>{sec.body}</Text>
            </View>
          ))}
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
      paddingVertical: 10,
      marginBottom: 6,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: g.glassFillStrong,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    titleWrap: {
      flex: 1,
      marginLeft: 12,
    },
    topBarTitle: {
      fontFamily: fonts.semiBold,
      fontSize: 17,
      color: g.text,
      letterSpacing: -0.2,
    },
    topBarSub: {
      fontFamily: fonts.medium,
      fontSize: 11,
      color: g.textSecondary,
      marginTop: 1,
    },
    reloadBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: g.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: g.glassFillStrong,
      borderRadius: 14,
      padding: 4,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: g.glassBorder,
    },
    tabBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 8,
      borderRadius: 10,
    },
    tabBtnActive: {
      backgroundColor: g.accent,
    },
    tabText: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: g.textSecondary,
    },
    tabTextActive: {
      color: '#FFFFFF',
      fontFamily: fonts.semiBold,
    },
    docCard: {
      flex: 1,
      overflow: 'hidden',
      marginBottom: 8,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 48,
    },
    docHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    fetchingBadge: {
      padding: 4,
    },
    docTitle: {
      fontSize: 22,
      fontFamily: fonts.extraBold,
      color: g.text,
      marginBottom: 4,
      letterSpacing: -0.3,
    },
    docMeta: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: g.accent,
    },
    introBlock: {
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: g.glassBorder,
    },
    introBody: {
      fontSize: 13.5,
      fontFamily: fonts.regular,
      color: g.textSecondary,
      lineHeight: 21,
    },
    secBlock: {
      marginBottom: 20,
    },
    secHeading: {
      fontSize: 15.5,
      fontFamily: fonts.bold,
      color: g.text,
      marginBottom: 6,
    },
    secBody: {
      fontSize: 13.5,
      fontFamily: fonts.regular,
      color: g.textSecondary,
      lineHeight: 21,
    },
  });
}
