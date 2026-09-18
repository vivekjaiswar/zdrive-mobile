import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import Screen from '@/components/Layout/Screen';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/services/api';
import { GlassTheme, useGlass } from '@/theme/glass';

// Renders the live server-hosted Privacy Policy / Terms pages inside the
// app (single source of truth on the server), but restyled to match the
// app theme via injected CSS: the page's own web header/nav chrome is
// hidden (redundant with the native top bar here) and the body is recoloured
// to the app's theme so it doesn't show up as a glaring white web page
// inside the glass UI (especially in dark mode).
export default function LegalDocScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const router = useRouter();
  const g = useGlass();
  const styles = getStyles(g);

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const { title, url } = useMemo(() => {
    if (doc === 'terms') {
      return { title: 'Terms of Service', url: TERMS_OF_SERVICE_URL };
    }
    return { title: 'Privacy Policy', url: PRIVACY_POLICY_URL };
  }, [doc]);

  // Theme-matching CSS pushed into the page. `pageBg` is a solid tone close
  // to the gradient so the doc reads as part of the app rather than a white
  // sheet. Header/nav + card wrappers are flattened so it's one continuous
  // themed column under the native top bar.
  const injected = useMemo(() => {
    const pageBg = g.scheme === 'dark' ? '#0E1738' : '#F3F5FF';
    const css = `
      html,body{background:${pageBg} !important;color:${g.text} !important;
        margin:0 !important;padding:16px 18px 48px !important;
        font-size:15px !important;line-height:1.65 !important;}
      h1,h2,h3,h4,h5,strong,b{color:${g.text} !important;}
      p,li,span,div,td{color:${g.textSecondary} !important;}
      h1,h2,h3,h4,h5{color:${g.text} !important;}
      a{color:${g.accent} !important;}
      header,nav,footer,[class*="header" i],[class*="navbar" i],
      [class*="topbar" i],[class*="site-nav" i]{display:none !important;}
      [class*="card" i],[class*="container" i],[class*="wrapper" i],section{
        background:transparent !important;box-shadow:none !important;
        border:none !important;max-width:100% !important;}
    `;
    return `(function(){try{var s=document.createElement('style');
      s.innerHTML=\`${css}\`;document.head.appendChild(s);
      document.documentElement.style.background='${pageBg}';
      if(document.body)document.body.style.background='${pageBg}';
    }catch(e){}true;})();`;
  }, [g]);

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={g.text} />
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={styles.webviewWrap}>
        {failed ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color={g.textSecondary} />
            <Text style={styles.errorText}>
              Couldn't load this page. Check your connection and try again.
            </Text>
          </View>
        ) : (
          <>
            <WebView
              source={{ uri: url }}
              style={styles.webview}
              // Transparent so the app backdrop shows during load instead of
              // a white flash before the injected theme applies.
              backgroundColor="transparent"
              originWhitelist={['https://zhdrive.in/*', 'https://www.zhdrive.in/*']}
              onShouldStartLoadWithRequest={(request) =>
                request.url.startsWith('https://zhdrive.in/') ||
                request.url.startsWith('https://www.zhdrive.in/')
              }
              injectedJavaScriptBeforeContentLoaded={injected}
              injectedJavaScript={injected}
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
                <ActivityIndicator size="large" color={g.accent} />
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

function getStyles(g: GlassTheme) {
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
      color: g.text,
    },
    webviewWrap: { flex: 1, marginHorizontal: -24, marginBottom: -24 },
    webview: { flex: 1, backgroundColor: 'transparent' },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    errorText: { marginTop: 16, fontSize: 15, color: g.textSecondary, textAlign: 'center' },
  });
}
