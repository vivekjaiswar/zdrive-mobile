import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import Pdf from 'react-native-pdf';

import { ColorPalette } from '@/theme/palette';
import { useColors } from '@/theme/useColors';

interface Props {
  uri: string;
}

// react-native-pdf's own network-download path goes through
// react-native-blob-util, which does a strict check comparing bytes
// received against the response's Content-Length header and reports
// "Download interrupted" whenever they don't match exactly - which
// happens reliably against this backend, since files are decrypted
// on the fly while streaming and the header doesn't necessarily match
// the decrypted body size. expo-file-system's downloader (already
// used elsewhere in this app for the working "Download" button)
// handles this fine, so fetch the PDF ourselves and hand
// react-native-pdf a plain local file:// path instead of a network
// URL - that skips its buggy download path entirely.
export default function PdfPreview({ uri }: Props) {
  const colors = useColors();
  const styles = getStyles(colors);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLocalUri(null);
    setFailed(false);

    File.downloadFileAsync(uri, Paths.cache, { idempotent: true })
      .then((file) => {
        if (!cancelled) setLocalUri(file.uri);
      })
      .catch((error) => {
        console.error('PdfPreview download error:', error);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [uri]);

  if (failed) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Couldn't load this PDF.</Text>
      </View>
    );
  }

  if (!localUri) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Pdf
        source={{ uri: localUri }}
        style={styles.pdf}
        onError={(error) => {
          console.error('PdfPreview render error:', error);
          setFailed(true);
        }}
      />
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
