import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import Screen from '@/components/Layout/Screen';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/services/api';
import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

// Renders the live, server-hosted Privacy Policy / Terms of Service
// pages inside the app itself (via WebView) instead of kicking the
// user out to the system browser with Linking.openURL. Deliberately
// still points at the same live zhdrive.in/privacy /terms URLs rather
// than bundling a local copy - one source of truth on the server
// means editing the HTML there updates both the web and the app
// without a new app store release.
export default function LegalDocScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const router = useRouter();
  const colors = useColors();
  const styles = getStyles(colors);

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const { title, url } = useMemo(() => {
    if (doc === 'terms') {
      return { title: 'Terms of Service', url: TERMS_OF_SERVICE_URL };
    }
    return { title: 'Privacy Policy', url: PRIVACY_POLICY_URL };
  }, [doc]);

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text} />
        </Pressable>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          {title}
        </Text>

        <View style={{ width: 26 }} />
      </View>

      <View style={styles.webviewWrap}>
        {failed ? (
          <View style={styles.center}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.errorText}>
              Couldn't load this page. Check your connection and try again.
            </Text>
          </View>
        ) : (
          <>
            <WebView
              source={{ uri: url }}
              style={styles.webview}
              // Defense-in-depth: this page is fully self-controlled
              // (our own server, no user-generated content) so this
              // wasn't exploitable today, but without an explicit
              // whitelist react-native-webview will follow a tap on ANY
              // link the loaded page contains, anywhere. Restricting
              // navigation to our own domains means a future edit to
              // privacy.html/terms.html can't turn this into an open
              // in-app browser just by adding a link.
              originWhitelist={['https://zhdrive.in/*', 'https://www.zhdrive.in/*']}
              onShouldStartLoadWithRequest={(request) =>
                request.url.startsWith('https://zhdrive.in/') ||
                request.url.startsWith('https://www.zhdrive.in/')
              }
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setFailed(true);
              }}
              onHttpError={() => {
                setLoading(false);
                setFailed(true);
              }}
            />

            {loading && (
              <View style={styles.loadingOverlay} pointerEvents="none">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      gap: 12,
    },

    topBarTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: -0.3,
      color: colors.text,
    },

    webviewWrap: {
      flex: 1,
      marginHorizontal: -24,
      marginBottom: -24,
      backgroundColor: colors.background,
    },

    webview: {
      flex: 1,
      backgroundColor: colors.background,
    },

    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },

    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },

    errorText: {
      marginTop: 16,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
