import { useState, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

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

const TAB_CONFIG: {
  id: LegalTab;
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  url: string;
}[] = [
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

// Injected CSS hides the website header/navigation and footer, leaving
// only the pure policy document content rendered seamlessly in-app.
const INJECTED_CSS = `
  (function() {
    function cleanLayout() {
      var header = document.querySelector('header');
      if (header) header.style.display = 'none';

      var footer = document.querySelector('footer');
      if (footer) footer.style.display = 'none';

      var container = document.querySelector('.min-h-screen');
      if (container) {
        container.style.minHeight = 'auto';
        container.style.padding = '0px';
      }

      document.body.style.padding = '12px 4px';
      document.body.style.margin = '0px';
    }

    cleanLayout();
    document.addEventListener('DOMContentLoaded', cleanLayout);
    window.addEventListener('load', cleanLayout);
    setTimeout(cleanLayout, 500);
    setTimeout(cleanLayout, 1500);
  })();
  true;
`;

export default function LegalDocScreen() {
  const params = useLocalSearchParams<{ doc?: string }>();
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);
  const webViewRef = useRef<WebView>(null);

  const initialTab: LegalTab =
    params.doc === 'privacy'
      ? 'privacy'
      : params.doc === 'security' || params.doc === 'security-policy'
        ? 'security'
        : 'terms';

  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const currentTabConfig = TAB_CONFIG.find((t) => t.id === activeTab) || TAB_CONFIG[0];

  function handleTabChange(tab: LegalTab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setLoading(true);
    setHasError(false);
  }

  function handleReload() {
    setLoading(true);
    setHasError(false);
    webViewRef.current?.reload();
  }

  return (
    <GlassScreen edges={['top', 'left', 'right', 'bottom']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={g.text} />
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            Legal & Policies
          </Text>
          <Text style={styles.topBarSub}>Live from zhdrive.in • Auto-updating</Text>
        </View>

        <Pressable style={styles.reloadBtn} onPress={handleReload} hitSlop={10}>
          <MaterialCommunityIcons name="refresh" size={20} color={g.accent} />
        </Pressable>
      </View>

      {/* Segmented Control: Terms, Privacy & Security on the SAME page */}
      <View style={styles.tabContainer}>
        {TAB_CONFIG.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => handleTabChange(tab.id)}
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

      {/* Native In-App Web Viewer (No External Redirects) */}
      <GlassCard strong padding={0} radius={22} style={styles.docCard}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={g.accent} />
            <Text style={styles.loadingText}>Loading latest {currentTabConfig.title}…</Text>
          </View>
        )}

        {hasError ? (
          <View style={styles.errorOverlay}>
            <MaterialCommunityIcons name="cloud-off-outline" size={48} color={g.textSecondary} />
            <Text style={styles.errorTitle}>Unable to Load Policy</Text>
            <Text style={styles.errorDesc}>
              Could not fetch live content from {currentTabConfig.url}. Please check your internet connection.
            </Text>
            <Pressable style={styles.retryBtn} onPress={handleReload}>
              <MaterialCommunityIcons name="refresh" size={16} color="#FFFFFF" />
              <Text style={styles.retryBtnText}>Retry Connection</Text>
            </Pressable>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            key={currentTabConfig.url}
            source={{ uri: currentTabConfig.url }}
            style={styles.webView}
            injectedJavaScript={INJECTED_CSS}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setHasError(true);
            }}
            showsVerticalScrollIndicator={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={g.accent} />
                <Text style={styles.loadingText}>Fetching live policy…</Text>
              </View>
            )}
            onShouldStartLoadWithRequest={(request) => {
              // Stay on zhdrive.in policy paths without redirecting out
              if (
                request.url.includes('zhdrive.in/terms') ||
                request.url.includes('zhdrive.in/privacy') ||
                request.url.includes('zhdrive.in/security-policy')
              ) {
                return true;
              }
              // Prevent arbitrary third-party redirects
              return false;
            }}
          />
        )}
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
    webView: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFill,
      backgroundColor: g.glassFillStrong,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      zIndex: 10,
    },
    loadingText: {
      fontSize: 12.5,
      fontFamily: fonts.medium,
      color: g.textSecondary,
    },
    errorOverlay: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 12,
    },
    errorTitle: {
      fontSize: 16,
      fontFamily: fonts.semiBold,
      color: g.text,
    },
    errorDesc: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: g.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    retryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: g.accent,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
      marginTop: 6,
    },
    retryBtnText: {
      fontSize: 12.5,
      fontFamily: fonts.semiBold,
      color: '#FFFFFF',
    },
  });
}
