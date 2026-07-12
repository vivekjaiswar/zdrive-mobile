import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Pdf from 'react-native-pdf';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  uri: string;
}

// react-native-pdf (not an Expo-Go-compatible module - see the
// project-level note about needing a custom dev client / full EAS
// build once this landed) renders real paged, pinch-zoomable PDF
// pages natively. `cache: true` lets it keep a local copy keyed off
// the URL rather than re-downloading on every re-render, which
// matters here since `uri` is a short-lived ticket URL that changes
// each time the file details are re-fetched.
export default function PdfPreview({ uri }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Couldn't load this PDF.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Pdf
        source={{ uri, cache: true }}
        // Explicit false, not omitted: react-native-pdf forwards this
        // straight to react-native-blob-util as `trusty`, and leaving
        // it undefined can still evaluate truthy on the native side,
        // routing the request through blob-util's broken "trust all
        // certs" path (which requires a sharedTrustManager this app
        // never sets up) instead of normal TLS verification - causing
        // "IllegalStateException: Use of own trust manager but none
        // defined". A real boolean false avoids that path entirely.
        trustAllCerts={false}
        style={styles.pdf}
        onLoadComplete={() => setLoading(false)}
        onError={(error) => {
          // react-native-pdf's own download path swallows the real
          // fetch failure and can throw a second, misleading
          // "ENOENT .pdf.tmp" error from its internal cache-copy step
          // - logging the raw error here is the only way to see what
          // actually went wrong (network, auth, timeout, etc.).
          console.error('PdfPreview load error:', error);
          setLoading(false);
          setFailed(true);
        }}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      flex: 1,
    },

    pdf: {
      flex: 1,
      backgroundColor: colors.surfaceAlt,
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
      paddingHorizontal: 24,
    },

    errorText: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
